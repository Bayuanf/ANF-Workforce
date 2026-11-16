import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Akses ditolak. Hanya HR yang diizinkan melihat Audit Log." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const entityName = searchParams.get("entityName");

    const where: any = {};
    if (action) where.action = action;
    if (entityName) where.entityName = entityName;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            email: true,
            role: true,
            employee: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // 100 log terbaru
    });

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error("GET /api/audit-logs error:", err);
    return NextResponse.json({ error: "Gagal memuat catatan audit log." }, { status: 500 });
  }
}
