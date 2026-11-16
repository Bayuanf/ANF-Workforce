import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const requests = await prisma.leaveRequest.findMany({
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
    console.error("GET /api/leave-requests error:", err);
    return NextResponse.json({ error: "Gagal memuat pengajuan cuti & izin." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.employeeId) {
      return NextResponse.json(
        { error: "Akun Anda tidak terhubung dengan profil karyawan aktif." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { type, startDate, endDate, totalDays, reason } = body;

    if (!type || !startDate || !endDate || !totalDays || !reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi (Tipe, Tanggal Mulai, Tanggal Selesai, Jumlah Hari, Alasan)." },
        { status: 400 }
      );
    }

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: user.employeeId,
        type,
        startDate,
        endDate,
        totalDays: parseInt(totalDays, 10),
        reason: reason.trim(),
        status: "PENDING",
      },
      include: {
        employee: true,
      },
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "CREATE_LEAVE_REQUEST",
      entityName: "LeaveRequest",
      entityId: request.id,
      newValues: {
        type,
        startDate,
        endDate,
        totalDays,
        reason,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, request }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/leave-requests error:", err);
    return NextResponse.json({ error: "Gagal mengajukan cuti/izin." }, { status: 500 });
  }
}
