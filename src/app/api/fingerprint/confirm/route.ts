import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { calculateAttendance } from "@/lib/attendance";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan mengonfirmasi import." }, { status: 403 });
    }

    const body = await req.json();
    const { fileName, rows } = body;

    if (!fileName || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Data konfirmasi tidak valid atau kosong." }, { status: 400 });
    }

    const totalRows = rows.length;
    const validRows = rows.filter((r) => r.status === "VALID");
    const invalidCount = rows.filter((r) => r.status === "INVALID").length;
    const duplicateCount = rows.filter((r) => r.status === "DUPLICATE").length;

    // Ambil mapping employeeCode -> employee
    const employees = await prisma.employee.findMany();
    const employeeMap = new Map(employees.map((e) => [e.employeeCode.toUpperCase(), e]));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Simpan Header Batch Import
      const importRecord = await tx.attendanceImport.create({
        data: {
          fileName,
          fileType: fileName.endsWith(".csv") ? "CSV" : "EXCEL",
          totalRows,
          validRows: validRows.length,
          invalidRows: invalidCount,
          duplicateRows: duplicateCount,
          importedBy: user.username,
        },
      });

      // 2. Simpan Seluruh Raw Records (Data mentah fingerprint tidak boleh diubah/dihapus)
      const rawInserts = rows.map((r) => {
        let scanDateTime = new Date();
        try {
          scanDateTime = new Date(`${r.date}T${r.scanTime}`);
          if (isNaN(scanDateTime.getTime())) {
            scanDateTime = new Date();
          }
        } catch {
          scanDateTime = new Date();
        }

        return {
          importId: importRecord.id,
          employeeCode: r.employeeCode,
          scanTime: scanDateTime,
          status: r.status,
          errorMessage: r.error || null,
          rawText: `${r.employeeCode},${r.date},${r.scanTime}`,
        };
      });

      await tx.rawAttendanceRecord.createMany({
        data: rawInserts,
      });

      // 3. Kelompokkan baris VALID berdasarkan employeeCode dan date
      const groupMap = new Map<string, { employeeId: string; date: string; scanDates: Date[] }>();

      for (const r of validRows) {
        const emp = employeeMap.get(r.employeeCode.toUpperCase());
        if (!emp) continue;

        const groupKey = `${emp.id}_${r.date}`;
        let scanDate = new Date(`${r.date}T${r.scanTime}`);
        if (isNaN(scanDate.getTime())) continue;

        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            employeeId: emp.id,
            date: r.date,
            scanDates: [scanDate],
          });
        } else {
          groupMap.get(groupKey)!.scanDates.push(scanDate);
        }
      }

      // 4. Proses kalkulasi AttendanceRecord dan LatenessReview
      let createdAttendanceCount = 0;
      let lateCount = 0;
      let incompleteCount = 0;

      for (const item of Array.from(groupMap.values())) {
        const calc = calculateAttendance(item.scanDates);

        // Cari apakah attendance record untuk tanggal tersebut sudah ada
        const existingAttendance = await tx.attendanceRecord.findUnique({
          where: {
            employeeId_date: {
              employeeId: item.employeeId,
              date: item.date,
            },
          },
          include: { latenessReview: true },
        });

        let attendanceId = "";

        if (existingAttendance) {
          const updated = await tx.attendanceRecord.update({
            where: { id: existingAttendance.id },
            data: {
              checkIn: calc.checkIn,
              checkOut: calc.checkOut,
              workHours: calc.workHours,
              status: calc.status,
            },
          });
          attendanceId = updated.id;
        } else {
          const created = await tx.attendanceRecord.create({
            data: {
              employeeId: item.employeeId,
              date: item.date,
              checkIn: calc.checkIn,
              checkOut: calc.checkOut,
              workHours: calc.workHours,
              status: calc.status,
            },
          });
          attendanceId = created.id;
          createdAttendanceCount++;
        }

        if (calc.status === "LATE") {
          lateCount++;
        } else if (calc.status === "INCOMPLETE") {
          incompleteCount++;
        }

        // Jika LATE atau INCOMPLETE, pastikan ada entri di LatenessReview untuk diperiksa HR
        if (calc.status === "LATE" || calc.status === "INCOMPLETE") {
          const existingReview = await tx.latenessReview.findUnique({
            where: { attendanceRecordId: attendanceId },
          });

          if (!existingReview) {
            await tx.latenessReview.create({
              data: {
                attendanceRecordId: attendanceId,
                status: "PENDING", // Belum diperiksa HR
                reviewNotes: null,
                decision: null,
              },
            });
          }
        }
      }

      return {
        importId: importRecord.id,
        createdAttendanceCount,
        lateCount,
        incompleteCount,
      };
    });

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: "IMPORT_FINGERPRINT",
      entityName: "AttendanceImport",
      entityId: result.importId,
      newValues: {
        fileName,
        totalRows,
        validRows: validRows.length,
        invalidRows: invalidCount,
        duplicateRows: duplicateCount,
        lateDetected: result.lateCount,
        incompleteDetected: result.incompleteCount,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({
      success: true,
      message: "Data fingerprint berhasil diimpor dan diproses ke sistem.",
      summary: {
        fileName,
        totalRows,
        validProcessed: validRows.length,
        lateDetected: result.lateCount,
        incompleteDetected: result.incompleteCount,
      },
    });
  } catch (err: any) {
    console.error("POST /api/fingerprint/confirm error:", err);
    return NextResponse.json({ error: "Gagal menyimpan hasil import fingerprint." }, { status: 500 });
  }
}
