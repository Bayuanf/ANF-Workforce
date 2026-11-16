import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "HR") {
      return NextResponse.json({ error: "Hanya HR yang diizinkan mengimpor data fingerprint." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const fileName = file.name;
    const isCsv = fileName.endsWith(".csv");
    const isXlsx = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isCsv && !isXlsx) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap unggah file CSV atau Excel (.xlsx)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = XLSX.read(buffer, { type: "buffer", raw: true });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" });

    if (rawRows.length === 0) {
      return NextResponse.json({ error: "File kosong atau tidak memiliki data yang dapat dibaca." }, { status: 400 });
    }

    // Ambil semua employeeCode yang aktif di sistem
    const existingEmployees = await prisma.employee.findMany({
      select: { employeeCode: true, fullName: true, id: true },
    });
    const employeeMap = new Map(existingEmployees.map((e) => [e.employeeCode.toUpperCase(), e]));

    const processedRows: any[] = [];
    const seenSet = new Set<string>();

    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      // Normalisasi nama kolom (case insensitive dan toleran terhadap spasi / underscore)
      const empCodeRaw = (
        row.employee_code ||
        row.Employee_Code ||
        row.nik ||
        row.NIK ||
        row.id_karyawan ||
        row.ID_Karyawan ||
        row["Employee Code"] ||
        row["ID Karyawan"] ||
        ""
      ).toString().trim();

      const dateRaw = (
        row.date ||
        row.Date ||
        row.tanggal ||
        row.Tanggal ||
        ""
      ).toString().trim();

      const timeRaw = (
        row.scan_time ||
        row.Scan_Time ||
        row.time ||
        row.Time ||
        row.jam ||
        row.Jam ||
        ""
      ).toString().trim();

      const rowNumber = i + 2; // Baris di file (1-based + header)
      let status: "VALID" | "INVALID" | "DUPLICATE" = "VALID";
      let error = "";

      if (!empCodeRaw || !dateRaw || !timeRaw) {
        status = "INVALID";
        error = "Kolom kode karyawan, tanggal, atau waktu kosong.";
      } else {
        const empCodeUpper = empCodeRaw.toUpperCase();
        if (!employeeMap.has(empCodeUpper)) {
          status = "INVALID";
          error = `Kode karyawan '${empCodeRaw}' tidak terdaftar di sistem.`;
        } else {
          // Validasi tanggal (YYYY-MM-DD)
          const dateMatch = dateRaw.match(/^\d{4}-\d{2}-\d{2}$/);
          if (!dateMatch) {
            status = "INVALID";
            error = `Format tanggal '${dateRaw}' tidak valid (Gunakan format YYYY-MM-DD).`;
          } else {
            // Validasi format jam
            const timeMatch = timeRaw.match(/^\d{1,2}:\d{2}(:\d{2})?$/);
            if (!timeMatch) {
              status = "INVALID";
              error = `Format jam scan '${timeRaw}' tidak valid (Gunakan format HH:mm atau HH:mm:ss).`;
            } else {
              // Cek duplikasi
              const key = `${empCodeUpper}_${dateRaw}_${timeRaw}`;
              if (seenSet.has(key)) {
                status = "DUPLICATE";
                error = "Data pemindaian duplikat dalam file ini.";
              } else {
                seenSet.add(key);
              }
            }
          }
        }
      }

      if (status === "VALID") validCount++;
      else if (status === "DUPLICATE") duplicateCount++;
      else invalidCount++;

      processedRows.push({
        rowNumber,
        employeeCode: empCodeRaw,
        employeeName: employeeMap.get(empCodeRaw.toUpperCase())?.fullName || "-",
        date: dateRaw,
        scanTime: timeRaw,
        status,
        error,
      });
    }

    return NextResponse.json({
      fileName,
      totalRows: rawRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateRows: duplicateCount,
      rows: processedRows,
    });
  } catch (err: any) {
    console.error("POST /api/fingerprint/validate error:", err);
    return NextResponse.json({ error: "Gagal memproses validasi file fingerprint." }, { status: 500 });
  }
}
