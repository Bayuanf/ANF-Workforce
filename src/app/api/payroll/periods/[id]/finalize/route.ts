import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan memfinalisasi penggajian." }, { status: 403 });
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: params.id },
      include: { records: true },
    });

    if (!period) {
      return NextResponse.json({ error: "Periode penggajian tidak ditemukan." }, { status: 404 });
    }

    if (period.records.length === 0) {
      return NextResponse.json(
        { error: "Periode penggajian belum memiliki perhitungan. Silakan jalankan 'Generate Perhitungan' terlebih dahulu." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payrollRecord.updateMany({
        where: { payrollPeriodId: params.id },
        data: { status: "FINALIZED" },
      });

      return tx.payrollPeriod.update({
        where: { id: params.id },
        data: {
          status: "FINALIZED",
          finalizedAt: new Date(),
        },
        include: {
          records: {
            include: {
              employee: {
                include: { department: true, position: true },
              },
            },
          },
        },
      });
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "FINALIZE_PAYROLL",
      entityName: "PayrollPeriod",
      entityId: params.id,
      newValues: {
        periodName: period.name,
        totalRecords: period.records.length,
        status: "FINALIZED",
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Periode penggajian ${period.name} berhasil difinalisasi. Slip gaji kini dapat diakses oleh karyawan.`,
      period: updated,
    });
  } catch (err: any) {
    console.error("POST /api/payroll/periods/[id]/finalize error:", err);
    return NextResponse.json({ error: "Gagal memfinalisasi periode penggajian." }, { status: 500 });
  }
}
