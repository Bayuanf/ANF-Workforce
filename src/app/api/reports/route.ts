import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "attendance" atau "payroll"
    const month = searchParams.get("month"); // e.g. "2026-11"
    const departmentId = searchParams.get("departmentId");

    if (type === "payroll") {
      // Manager dan Karyawan dilarang mengakses laporan penggajian umum
      if (user.role !== "HR") {
        return NextResponse.json({ error: "Akses laporan penggajian hanya diizinkan untuk HR." }, { status: 403 });
      }

      const where: any = {};
      if (month) {
        where.payrollPeriod = { startDate: { startsWith: month } };
      }
      if (departmentId) {
        where.employee = { departmentId };
      }

      const records = await prisma.payrollRecord.findMany({
        where,
        include: {
          payrollPeriod: true,
          employee: {
            include: { department: true, position: true },
          },
        },
        orderBy: { employee: { employeeCode: "asc" } },
      });

      const totalBasic = records.reduce((sum, r) => sum + r.basicSalary, 0);
      const totalAllowance = records.reduce((sum, r) => sum + r.allowance, 0);
      const totalOvertime = records.reduce((sum, r) => sum + r.overtimePay, 0);
      const totalDeduction = records.reduce((sum, r) => sum + r.deduction, 0);
      const totalNet = records.reduce((sum, r) => sum + r.netSalary, 0);

      return NextResponse.json({
        reportType: "payroll",
        records,
        summary: {
          totalEmployees: records.length,
          totalBasic,
          totalAllowance,
          totalOvertime,
          totalDeduction,
          totalNet,
        },
      });
    }

    // Default: Attendance Report
    const where: any = {};

    if (user.role === "EMPLOYEE") {
      where.employee = { userId: user.id };
    } else if (user.role === "MANAGER") {
      where.employee = {
        OR: [
          { managerId: user.id },
          { department: { managerId: user.id } },
        ],
      };
    } else if (user.role === "HR" && departmentId) {
      where.employee = { departmentId };
    }

    if (month) {
      where.date = { startsWith: month };
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          include: { department: true, position: true },
        },
        latenessReview: true,
      },
      orderBy: [{ date: "desc" }, { employee: { employeeCode: "asc" } }],
    });

    const onTimeCount = attendanceRecords.filter((r) => r.status === "ON_TIME").length;
    const lateCount = attendanceRecords.filter((r) => r.status === "LATE").length;
    const incompleteCount = attendanceRecords.filter((r) => r.status === "INCOMPLETE").length;

    return NextResponse.json({
      reportType: "attendance",
      records: attendanceRecords,
      summary: {
        totalRecords: attendanceRecords.length,
        onTimeCount,
        lateCount,
        incompleteCount,
      },
    });
  } catch (err: any) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: "Gagal memuat data laporan." }, { status: 500 });
  }
}
