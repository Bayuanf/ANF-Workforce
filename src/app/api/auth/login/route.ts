import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username.trim() }, { email: username.trim().toLowerCase() }],
      },
      include: {
        employee: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan atau password salah." },
        { status: 401 }
      );
    }

    // Periksa status akun
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Akun Anda berstatus nonaktif. Hubungi HR Admin." },
        { status: 403 }
      );
    }

    // Periksa lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMin = Math.ceil(
        (user.lockoutUntil.getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          error: `Akun terkunci sementara karena terlalu banyak percobaan gagal. Silakan coba lagi dalam ${waitMin} menit.`,
        },
        { status: 429 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const attempts = user.failedLoginAttempts + 1;
      let lockoutDate: Date | null = null;
      if (attempts >= 5) {
        lockoutDate = new Date(Date.now() + 15 * 60 * 1000); // lock 15 menit
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockoutUntil: lockoutDate,
        },
      });

      return NextResponse.json(
        { error: "Akun tidak ditemukan atau password salah." },
        { status: 401 }
      );
    }

    // Reset failed login attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    const sessionPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      employeeId: user.employee?.id,
      employeeCode: user.employee?.employeeCode,
      fullName: user.employee?.fullName || user.username,
      departmentId: user.employee?.departmentId,
      departmentName: user.employee?.department?.name,
    };

    setSessionCookie(sessionPayload);

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "LOGIN",
      entityName: "User",
      entityId: user.id,
      newValues: { username: user.username, role: user.role },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      user: sessionPayload,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
