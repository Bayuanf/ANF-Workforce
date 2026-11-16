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
    if (!user || (user.role !== "MANAGER" && user.role !== "HR")) {
      return NextResponse.json({ error: "Hanya Manager atau HR yang berhak menyetujui/menolak lembur." }, { status: 403 });
    }

    const body = await req.json();
    const { status, reviewNotes } = body;

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Status harus APPROVED atau REJECTED." }, { status: 400 });
    }

    const request = await prisma.overtimeRequest.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          include: { department: true },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Pengajuan lembur tidak ditemukan." }, { status: 404 });
    }

    if (user.role === "MANAGER") {
      const isTeam =
        request.employee.managerId === user.id ||
        request.employee.department.managerId === user.id;

      if (!isTeam) {
        return NextResponse.json({ error: "Anda hanya berwenang menyetujui pengajuan anggota tim Anda." }, { status: 403 });
      }
    }

    const updated = await prisma.overtimeRequest.update({
      where: { id: params.id },
      data: {
        status,
        reviewerId: user.id,
        reviewNotes: reviewNotes?.trim() || null,
        reviewedAt: new Date(),
      },
      include: {
        employee: true,
        reviewer: true,
      },
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: status === "APPROVED" ? "APPROVE_OVERTIME" : "REJECT_OVERTIME",
      entityName: "OvertimeRequest",
      entityId: params.id,
      oldValues: { status: request.status },
      newValues: { status, reviewNotes },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (err: any) {
    console.error("PUT /api/overtime-requests/[id]/approval error:", err);
    return NextResponse.json({ error: "Gagal memproses persetujuan lembur." }, { status: 500 });
  }
}
