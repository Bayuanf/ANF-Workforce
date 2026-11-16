import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan mengelola perhitungan penggajian." }, { status: 403 });
    }

    const body = await req.json();
    const { periodId } = body;

    if (!periodId) {
      return NextResponse.json({ error: "ID Periode wajib disertakan." }, { status: 400 });
    }

    const period = await prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return NextResponse.json({ error: "Periode penggajian tidak ditemukan." }, { status: 404 });
    }

    if (period.status === "FINALIZED") {
      return NextResponse.json({ error: "Periode ini sudah difinalisasi dan tidak dapat dihitung ulang." }, { status: 400 });
    }

    // Ambil seluruh karyawan aktif
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        department: true,
        position: true,
      },
    });

    // Ambil lembur yang disetujui pada rentang tanggal periode
    const approvedOvertimes = await prisma.overtimeRequest.findMany({
      where: {
        status: "APPROVED",
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
    });

    // Petakan total durasi lembur per karyawan
    const overtimeHoursMap = new Map<string, number>();
    for (const ot of approvedOvertimes) {
      const current = overtimeHoursMap.get(ot.employeeId) || 0;
      overtimeHoursMap.set(ot.employeeId, current + ot.durationHours);
    }

    // Buat atau perbarui PayrollRecord per karyawan
    const generatedRecords = await prisma.$transaction(async (tx) => {
      const records = [];

      for (const emp of employees) {
        const otHours = overtimeHoursMap.get(emp.id) || 0;
        // Default uang lembur: jika ada jam lembur yang disetujui, HR dapat melihat estimasi atau mengeditnya
        // Standar sederhana jika ada lembur: 50.000 / jam atau disesuaikan HR
        const estimatedOtPay = otHours * 50000;

        // Cek apakah record sudah ada sebelumnya di periode ini
        const existing = await tx.payrollRecord.findUnique({
          where: {
            payrollPeriodId_employeeId: {
              payrollPeriodId: period.id,
              employeeId: emp.id,
            },
          },
        });

        let allowance = 0;
        let deduction = 0;
        let overtimePay = estimatedOtPay;

        if (existing) {
          // Pertahankan penyesuaian manual yang mungkin sudah diinput HR sebelumnya
          allowance = existing.allowance;
          deduction = existing.deduction;
          if (existing.overtimePay > 0) {
            overtimePay = existing.overtimePay;
          }
        }

        const netSalary = emp.basicSalary + allowance + overtimePay - deduction;

        const record = await tx.payrollRecord.upsert({
          where: {
            payrollPeriodId_employeeId: {
              payrollPeriodId: period.id,
              employeeId: emp.id,
            },
          },
          update: {
            basicSalary: emp.basicSalary,
            allowance,
            overtimePay,
            deduction,
            netSalary,
            notes: otHours > 0 ? `Termasuk lembur disetujui: ${otHours} jam` : null,
          },
          create: {
            payrollPeriodId: period.id,
            employeeId: emp.id,
            basicSalary: emp.basicSalary,
            allowance,
            overtimePay,
            deduction,
            netSalary,
            notes: otHours > 0 ? `Termasuk lembur disetujui: ${otHours} jam` : null,
            status: "DRAFT",
          },
          include: {
            employee: {
              include: { department: true, position: true },
            },
          },
        });

        records.push(record);
      }

      return records;
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "GENERATE_PAYROLL",
      entityName: "PayrollPeriod",
      entityId: period.id,
      newValues: {
        periodName: period.name,
        totalEmployeesProcessed: generatedRecords.length,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: `Perhitungan penggajian periode ${period.name} berhasil digenerate untuk ${generatedRecords.length} karyawan.`,
      records: generatedRecords,
    });
  } catch (err: any) {
    console.error("POST /api/payroll/generate error:", err);
    return NextResponse.json({ error: "Gagal mengenerate perhitungan gaji." }, { status: 500 });
  }
}
