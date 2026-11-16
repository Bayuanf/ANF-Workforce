import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "DEMO") {
      return NextResponse.json(
       { error: "Akun DEMO tidak memiliki akses ke data karyawan." },
      { status: 403 }
  );
}

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "";

    const where: any = {};

    // RBAC: Karyawan hanya profil sendiri, Manager hanya timnya,
    // HR dapat melihat seluruh data karyawan
    if (user.role === "EMPLOYEE") {
      where.userId = user.id;
    } else if (user.role === "MANAGER") {
      // Manager melihat bawahan di departemen yang dipimpin atau yang managerId-nya adalah dirinya
      where.OR = [
        { managerId: user.id },
        { department: { managerId: user.id } },
        { userId: user.id }, // termasuk dirinya sendiri
      ];
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { fullName: { contains: search } },
            { employeeCode: { contains: search } },
            { email: { contains: search } },
          ],
        },
      ];
    }

    if (departmentId && user.role === "HR") {
      where.departmentId = departmentId;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        manager: {
          select: {
            id: true,
            username: true,
            employee: { select: { fullName: true } },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { employeeCode: "asc" },
    });

      // Sembunyikan gaji dari DEMO dan pengguna non-HR lainnya
      const sanitized = employees.map((emp) => {
      if (user.role === "DEMO") {
        const { basicSalary, ...rest } = emp;
        return rest;
      }

      if (user.role !== "HR" && emp.userId !== user.id) {
        const { basicSalary, ...rest } = emp;
        return rest;
      }

      return emp;
    });

    return NextResponse.json({ employees: sanitized });
  } catch (err: any) {
    console.error("GET /api/employees error:", err);
    return NextResponse.json({ error: "Gagal memuat data karyawan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Akses ditolak. Hanya HR yang diizinkan." }, { status: 403 });
    }

    const body = await req.json();
    const {
      employeeCode,
      fullName,
      email,
      phone,
      departmentId,
      positionId,
      managerId,
      joinDate,
      basicSalary,
      username,
      password,
      role = "EMPLOYEE",
    } = body;

    if (!employeeCode || !fullName || !email || !departmentId || !positionId || !username || !password) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi (Kode, Nama, Email, Departemen, Posisi, Username, Password)." },
        { status: 400 }
      );
    }

    // Cek duplikasi
    const existingCode = await prisma.employee.findUnique({ where: { employeeCode } });
    if (existingCode) {
      return NextResponse.json({ error: "Kode karyawan sudah terdaftar." }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email sudah digunakan." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Buat User dan Employee dalam satu transaksi
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          role,
          status: "ACTIVE",
        },
      });

      const newEmp = await tx.employee.create({
        data: {
          userId: newUser.id,
          employeeCode,
          fullName,
          email,
          phone: phone || null,
          departmentId,
          positionId,
          managerId: managerId || null,
          joinDate: new Date(joinDate || Date.now()),
          basicSalary: Number(basicSalary) || 0,
          status: "ACTIVE",
        },
        include: {
          department: true,
          position: true,
        },
      });

      return { user: newUser, employee: newEmp };
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "CREATE_EMPLOYEE",
      entityName: "Employee",
      entityId: result.employee.id,
      newValues: {
        employeeCode: result.employee.employeeCode,
        fullName: result.employee.fullName,
        role,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, employee: result.employee }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/employees error:", err);
    return NextResponse.json({ error: "Gagal membuat data karyawan baru." }, { status: 500 });
  }
}
