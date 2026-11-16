
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // DEMO tidak boleh mengakses informasi departemen
    if (user.role === "DEMO") {
      return NextResponse.json(
        { error: "Akun DEMO tidak memiliki akses ke data departemen." },
        { status: 403 }
      );
    }

    const departments = await prisma.department.findMany({
      include: {
        positions: true,
        manager: {
          select: {
            id: true,
            username: true,
            employee: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json({ departments });
  } catch (err: any) {
    console.error("GET /api/departments error:", err);

    return NextResponse.json(
      { error: "Gagal memuat departemen" },
      { status: 500 }
    );
  }
}
