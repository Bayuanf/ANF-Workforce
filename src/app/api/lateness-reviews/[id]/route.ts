import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// Pengisian hasil review pertama kali
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan mengisi hasil pemeriksaan." }, { status: 403 });
    }

    const body = await req.json();
    const { decision, reviewNotes } = body;

    // Sesuai PRD 5.3: HR WAJIB mengisi hasil pemeriksaan
    if (!decision || !reviewNotes || !reviewNotes.trim()) {
      return NextResponse.json(
        { error: "Keputusan dan catatan pemeriksaan wajib diisi." },
        { status: 400 }
      );
    }

    const review = await prisma.latenessReview.findUnique({
      where: { id: params.id },
      include: {
        attendanceRecord: {
          include: { employee: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Catatan pemeriksaan tidak ditemukan." }, { status: 404 });
    }

    const updated = await prisma.latenessReview.update({
      where: { id: params.id },
      data: {
        reviewerId: user.id,
        decision: decision.trim(),
        reviewNotes: reviewNotes.trim(),
        status: "REVIEWED",
        reviewedAt: new Date(),
      },
      include: {
        attendanceRecord: {
          include: { employee: true },
        },
      },
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "REVIEW_LATENESS",
      entityName: "LatenessReview",
      entityId: params.id,
      newValues: {
        employee: updated.attendanceRecord.employee.fullName,
        date: updated.attendanceRecord.date,
        decision,
        reviewNotes,
        status: "REVIEWED",
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    console.error("POST /api/lateness-reviews/[id] error:", err);
    return NextResponse.json({ error: "Gagal menyimpan hasil pemeriksaan." }, { status: 500 });
  }
}

// Perubahan hasil review yang sudah ada (dengan pencatatan riwayat audit wajib sesuai PRD 5.3)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan mengubah hasil pemeriksaan." }, { status: 403 });
    }

    const body = await req.json();
    const { decision, reviewNotes } = body;

    if (!decision || !reviewNotes || !reviewNotes.trim()) {
      return NextResponse.json(
        { error: "Keputusan dan catatan pemeriksaan baru wajib diisi." },
        { status: 400 }
      );
    }

    const currentReview = await prisma.latenessReview.findUnique({
      where: { id: params.id },
      include: {
        attendanceRecord: {
          include: { employee: true },
        },
      },
    });

    if (!currentReview) {
      return NextResponse.json({ error: "Catatan pemeriksaan tidak ditemukan." }, { status: 404 });
    }

    // Rekam perubahan ke LatenessReviewHistory dan perbarui LatenessReview dalam satu transaksi
    const updated = await prisma.$transaction(async (tx) => {
      await tx.latenessReviewHistory.create({
        data: {
          latenessReviewId: params.id,
          reviewerId: user.id,
          oldDecision: currentReview.decision,
          newDecision: decision.trim(),
          oldNotes: currentReview.reviewNotes,
          newNotes: reviewNotes.trim(),
        },
      });

      return tx.latenessReview.update({
        where: { id: params.id },
        data: {
          reviewerId: user.id,
          decision: decision.trim(),
          reviewNotes: reviewNotes.trim(),
          status: "REVIEWED",
          reviewedAt: new Date(),
        },
        include: {
          attendanceRecord: {
            include: { employee: true },
          },
          history: {
            include: { reviewer: true },
            orderBy: { changedAt: "desc" },
          },
        },
      });
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "UPDATE_LATENESS_REVIEW",
      entityName: "LatenessReview",
      entityId: params.id,
      oldValues: {
        decision: currentReview.decision,
        reviewNotes: currentReview.reviewNotes,
      },
      newValues: {
        decision: decision.trim(),
        reviewNotes: reviewNotes.trim(),
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (err: any) {
    console.error("PUT /api/lateness-reviews/[id] error:", err);
    return NextResponse.json({ error: "Gagal memperbarui hasil pemeriksaan." }, { status: 500 });
  }
}
