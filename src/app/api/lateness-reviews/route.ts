import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan mengakses data pemeriksaan keterlambatan." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "PENDING" atau "REVIEWED"
    const date = searchParams.get("date");

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (date) {
      where.attendanceRecord = { date };
    }

    const reviews = await prisma.latenessReview.findMany({
      where,
      include: {
        attendanceRecord: {
          include: {
            employee: {
              include: {
                department: true,
                position: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            employee: { select: { fullName: true } },
          },
        },
        history: {
          include: {
            reviewer: {
              select: {
                id: true,
                username: true,
                employee: { select: { fullName: true } },
              },
            },
          },
          orderBy: { changedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (err: any) {
    console.error("GET /api/lateness-reviews error:", err);
    return NextResponse.json({ error: "Gagal memuat daftar pemeriksaan keterlambatan." }, { status: 500 });
  }
}
