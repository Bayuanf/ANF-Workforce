
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // DEMO tidak boleh mengakses detail karyawan
    if (user.role === "DEMO") {
      return NextResponse.json(
        { error: "Akun DEMO tidak memiliki akses ke detail karyawan." },
        { status: 403 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
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
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Karyawan hanya bisa melihat profil sendiri
    if (user.role === "EMPLOYEE" && employee.userId !== user.id) {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    // Manager dan pengguna non-HR tidak boleh melihat gaji orang lain
    if (user.role !== "HR" && employee.userId !== user.id) {
      const { basicSalary, ...rest } = employee;
      return NextResponse.json({ employee: rest });
    }

    return NextResponse.json({ employee });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal memuat detail karyawan" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "HR") {
      return NextResponse.json(
        { error: "Hanya HR yang diizinkan memperbarui data." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      fullName,
      phone,
      departmentId,
      positionId,
      managerId,
      basicSalary,
      status,
      userStatus,
    } = body;

    const oldEmployee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!oldEmployee) {
      return NextResponse.json(
        { error: "Karyawan tidak ditemukan" },
        { status: 404 }
      );
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      if (userStatus && oldEmployee.userId) {
        await tx.user.update({
          where: { id: oldEmployee.userId },
          data: { status: userStatus },
        });
      }

      return tx.employee.update({
        where: { id: params.id },
        data: {
          fullName: fullName !== undefined ? fullName : oldEmployee.fullName,
          phone: phone !== undefined ? phone : oldEmployee.phone,
          departmentId: departmentId || oldEmployee.departmentId,
          positionId: positionId || oldEmployee.positionId,
          managerId: managerId !== undefined ? managerId : oldEmployee.managerId,
          basicSalary: basicSalary !== undefined ? Number(basicSalary) : oldEmployee.basicSalary,
          status: status || oldEmployee.status,
        },
        include: {
          department: true,
          position: true,
        },
      });
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "UPDATE_EMPLOYEE",
      entityName: "Employee",
      entityId: params.id,
      oldValues: {
        fullName: oldEmployee.fullName,
        departmentId: oldEmployee.departmentId,
        positionId: oldEmployee.positionId,
        basicSalary: oldEmployee.basicSalary,
        status: oldEmployee.status,
      },
      newValues: {
        fullName: updatedEmployee.fullName,
        departmentId: updatedEmployee.departmentId,
        positionId: updatedEmployee.positionId,
        basicSalary: updatedEmployee.basicSalary,
        status: updatedEmployee.status,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
    });
  } catch (err: any) {
    console.error("PUT /api/employees/[id] error:", err);

    return NextResponse.json(
      { error: "Gagal memperbarui data karyawan." },
      { status: 500 }
    );
  }
}
