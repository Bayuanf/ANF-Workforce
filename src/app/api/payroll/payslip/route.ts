
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

    // DEMO tidak memiliki akses ke informasi payroll atau slip gaji
    if (user.role === "DEMO") {
      return NextResponse.json(
        { error: "Akun DEMO tidak memiliki akses ke informasi penggajian." },
        { status: 403 }
      );
    }

    if (!user.employeeId) {
      return NextResponse.json(
        { error: "Profil karyawan tidak ditemukan." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get("periodId");

    // Karyawan hanya bisa melihat slip gajinya sendiri yang sudah FINALIZED
    // HR juga bisa melihat untuk pengecekan administratif jika mengirimkan query employeeId
    let targetEmployeeId = user.employeeId;

    if (user.role === "HR" && searchParams.get("employeeId")) {
      targetEmployeeId = searchParams.get("employeeId")!;
    } else if (user.role === "MANAGER" && targetEmployeeId !== user.employeeId) {
      return NextResponse.json(
        {
          error:
            "Akses ditolak. Manager tidak memiliki akses penggajian.",
        },
        { status: 403 }
      );
    }

    const where: any = {
      employeeId: targetEmployeeId,
    };

    if (periodId) {
      where.payrollPeriodId = periodId;
    }

    // Jika bukan HR, hanya tampilkan yang sudah FINALIZED
    if (user.role !== "HR") {
      where.payrollPeriod = { status: "FINALIZED" };
    }

    const payslips = await prisma.payrollRecord.findMany({
      where,
      include: {
        payrollPeriod: true,
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
      orderBy: { payrollPeriod: { startDate: "desc" } },
    });

    return NextResponse.json({
      payslips,
    });
  } catch (err: any) {
    console.error("GET /api/payroll/payslip error:", err);
    return NextResponse.json(
      { error: "Gagal memuat slip gaji." },
      { status: 500 }
    );
  }
}
