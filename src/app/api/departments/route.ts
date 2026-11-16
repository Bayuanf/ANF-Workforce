import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Gagal memuat departemen" }, { status: 500 });
  }
}
