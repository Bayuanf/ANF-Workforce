
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // DEMO tidak boleh mengakses data pengajuan lembur
    if (user.role === "DEMO") {
      return NextResponse.json(
        { error: "Akun DEMO tidak memiliki akses ke data pengajuan lembur." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    if (user.role === "EMPLOYEE") {
      where.employee = { userId: user.id };
    } else if (user.role === "MANAGER") {
      where.employee = {
        OR: [
          { managerId: user.id },
          { department: { managerId: user.id } },
        ],
      };
    }

    const requests = await prisma.overtimeRequest.findMany({
      where,
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            employee: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (err: any) {
    console.error("GET /api/overtime-requests error:", err);
    return NextResponse.json(
      { error: "Gagal memuat pengajuan lembur." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // DEMO hanya memiliki akses lihat (read-only)
    if (user.role === "DEMO") {
      return NextResponse.json(
        { error: "Akun DEMO hanya memiliki akses lihat (read-only)." },
        { status: 403 }
      );
    }

    if (!user.employeeId) {
      return NextResponse.json(
        { error: "Akun Anda tidak terhubung dengan profil karyawan aktif." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { date, startTime, endTime, durationHours, taskDescription } = body;

    if (
      !date ||
      !startTime ||
      !endTime ||
      !durationHours ||
      !taskDescription ||
      !taskDescription.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Semua kolom wajib diisi (Tanggal, Jam Mulai, Jam Selesai, Durasi, Deskripsi Tugas).",
        },
        { status: 400 }
      );
    }

    const request = await prisma.overtimeRequest.create({
      data: {
        employeeId: user.employeeId,
        date,
        startTime,
        endTime,
        durationHours: parseFloat(durationHours),
        taskDescription: taskDescription.trim(),
        status: "PENDING",
      },
      include: {
        employee: true,
      },
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "CREATE_OVERTIME_REQUEST",
      entityName: "OvertimeRequest",
      entityId: request.id,
      newValues: {
        date,
        startTime,
        endTime,
        durationHours,
        taskDescription,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json(
      { success: true, request },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/overtime-requests error:", err);
    return NextResponse.json(
      { error: "Gagal mengajukan lembur." },
      { status: 500 }
    );
  }
}
