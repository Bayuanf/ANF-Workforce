import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Akses ditolak. Penggajian hanya dapat diakses oleh HR." }, { status: 403 });
    }

    const periods = await prisma.payrollPeriod.findMany({
      include: {
        records: {
          include: {
            employee: {
              include: {
                department: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ periods });
  } catch (err: any) {
    console.error("GET /api/payroll/periods error:", err);
    return NextResponse.json({ error: "Gagal memuat periode penggajian." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan membuat periode penggajian." }, { status: 403 });
    }

    const body = await req.json();
    const { name, startDate, endDate } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Nama periode, tanggal mulai, dan tanggal selesai wajib diisi." }, { status: 400 });
    }

    const period = await prisma.payrollPeriod.create({
      data: {
        name,
        startDate,
        endDate,
        status: "DRAFT",
      },
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "CREATE_PAYROLL_PERIOD",
      entityName: "PayrollPeriod",
      entityId: period.id,
      newValues: { name, startDate, endDate },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, period }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/payroll/periods error:", err);
    return NextResponse.json({ error: "Gagal membuat periode penggajian." }, { status: 500 });
  }
}
