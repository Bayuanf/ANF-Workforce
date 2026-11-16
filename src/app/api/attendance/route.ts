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
    const date = searchParams.get("date");
    const month = searchParams.get("month"); // e.g. "2026-11"
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");

    const where: any = {};

    // RBAC:
    if (user.role === "EMPLOYEE") {
      where.employee = { userId: user.id };
    } else if (user.role === "MANAGER") {
      where.employee = {
        OR: [
          { managerId: user.id },
          { department: { managerId: user.id } },
          { userId: user.id },
        ],
      };
    } else if (user.role === "HR") {
      if (departmentId) {
        where.employee = { departmentId };
      }
    }

    if (date) {
      where.date = date;
    } else if (month) {
      where.date = { startsWith: month };
    }

    if (status) {
      where.status = status;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        latenessReview: {
          include: {
            reviewer: {
              select: {
                username: true,
                employee: { select: { fullName: true } },
              },
            },
          },
        },
      },
      orderBy: [{ date: "desc" }, { employee: { employeeCode: "asc" } }],
    });

    return NextResponse.json({ records });
  } catch (err: any) {
    console.error("GET /api/attendance error:", err);
    return NextResponse.json({ error: "Gagal memuat data kehadiran." }, { status: 500 });
  }
}
