import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan memperbarui data penggajian." }, { status: 403 });
    }

    const body = await req.json();
    const { allowance, overtimePay, deduction, notes } = body;

    const record = await prisma.payrollRecord.findUnique({
      where: { id: params.id },
      include: {
        payrollPeriod: true,
        employee: true,
      },
    });

    if (!record) {
      return NextResponse.json({ error: "Catatan penggajian tidak ditemukan." }, { status: 404 });
    }

    if (record.payrollPeriod.status === "FINALIZED") {
      return NextResponse.json({ error: "Periode ini telah difinalisasi dan tidak dapat diedit lagi." }, { status: 400 });
    }

    const newAllowance = allowance !== undefined ? Number(allowance) : record.allowance;
    const newOvertimePay = overtimePay !== undefined ? Number(overtimePay) : record.overtimePay;
    const newDeduction = deduction !== undefined ? Number(deduction) : record.deduction;
    const newNotes = notes !== undefined ? notes : record.notes;

    const netSalary = record.basicSalary + newAllowance + newOvertimePay - newDeduction;

    const updated = await prisma.payrollRecord.update({
      where: { id: params.id },
      data: {
        allowance: newAllowance,
        overtimePay: newOvertimePay,
        deduction: newDeduction,
        netSalary,
        notes: newNotes,
      },
      include: {
        employee: {
          include: { department: true, position: true },
        },
      },
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "UPDATE_PAYROLL_RECORD",
      entityName: "PayrollRecord",
      entityId: params.id,
      oldValues: {
        allowance: record.allowance,
        overtimePay: record.overtimePay,
        deduction: record.deduction,
        netSalary: record.netSalary,
      },
      newValues: {
        allowance: newAllowance,
        overtimePay: newOvertimePay,
        deduction: newDeduction,
        netSalary,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, record: updated });
  } catch (err: any) {
    console.error("PUT /api/payroll/records/[id] error:", err);
    return NextResponse.json({ error: "Gagal memperbarui rincian penggajian." }, { status: 500 });
  }
}
