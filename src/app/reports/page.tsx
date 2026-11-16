"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  FileBarChart,
  Printer,
  Calendar,
  Building2,
  Users,
  Banknote,
  CheckCircle2,
  ClockAlert,
} from "lucide-react";

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [reportType, setReportType] = useState<"attendance" | "payroll">("attendance");
  const [selectedMonth, setSelectedMonth] = useState("2026-11");
  const [selectedDept, setSelectedDept] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?type=${reportType}&month=${selectedMonth}`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]).then(([userData, deptData]) => {
      setCurrentUser(userData.user);
      setDepartments(deptData.departments || []);
      fetchReport();
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchReport();
    }
  }, [reportType, selectedMonth, selectedDept]);

  const handlePrint = () => {
    window.print();
  };

  const isHr = currentUser?.role === "HR";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary">
              Laporan Operasional HR
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Rekapitulasi dan analisis data kehadiran serta penggajian PT ANF Group.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Dokumen Laporan</span>
          </button>
        </div>

        {/* Filter Bar (No print) */}
        <div className="bg-surface border border-border rounded p-4 flex flex-col sm:flex-row gap-3 items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReportType("attendance")}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                reportType === "attendance"
                  ? "bg-primary text-white"
                  : "border border-border text-secondary hover:bg-slate-50"
              }`}
            >
              Laporan Kehadiran
            </button>
            {isHr && (
              <button
                onClick={() => setReportType("payroll")}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  reportType === "payroll"
                    ? "bg-primary text-white"
                    : "border border-border text-secondary hover:bg-slate-50"
                }`}
              >
                Laporan Penggajian
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-secondary">Periode:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 border border-border rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {isHr && (
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="py-1.5 px-3 border border-border rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Semua Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Konten Laporan Resmi */}
        <div className="bg-surface border border-border rounded p-6 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Kop Laporan Resmi */}
          <div className="border-b-2 border-slate-800 pb-3 mb-5 flex justify-between items-start">
            <div>
              <div className="text-base font-bold text-primary">PT ANF GROUP</div>
              <div className="text-xs font-semibold text-slate-800 uppercase tracking-wide mt-0.5">
                {reportType === "attendance"
                  ? "LAPORAN REKAPITULASI KEHADIRAN KARYAWAN"
                  : "LAPORAN REKAPITULASI PENGGAJIAN (PAYROLL)"}
              </div>
              <div className="text-[11px] text-secondary">
                Periode: {selectedMonth} • Dicetak oleh: {currentUser?.fullName} ({currentUser?.role})
              </div>
            </div>
            <div className="text-right text-[11px] text-secondary font-mono">
              Tanggal Cetak: {new Date().toLocaleDateString("id-ID")}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-secondary">
              Menyiapkan dokumen laporan...
            </div>
          ) : !reportData ? (
            <div className="py-12 text-center text-xs text-secondary">
              Tidak ada data laporan yang tersedia.
            </div>
          ) : reportType === "attendance" ? (
            /* Laporan Kehadiran */
            <div className="space-y-5">
              {/* Stat Summary Card */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-border rounded">
                  <div className="text-[11px] text-secondary">Total Kehadiran</div>
                  <div className="text-lg font-bold text-slate-800 mt-1">
                    {reportData.summary?.totalRecords}
                  </div>
                </div>
                <div className="p-3 bg-success-light border border-success/30 rounded">
                  <div className="text-[11px] text-success font-medium">Tepat Waktu</div>
                  <div className="text-lg font-bold text-success mt-1">
                    {reportData.summary?.onTimeCount}
                  </div>
                </div>
                <div className="p-3 bg-danger-light border border-danger/30 rounded">
                  <div className="text-[11px] text-danger font-medium">Terlambat (&gt; 08.10)</div>
                  <div className="text-lg font-bold text-danger mt-1">
                    {reportData.summary?.lateCount}
                  </div>
                </div>
                <div className="p-3 bg-warning-light border border-warning/30 rounded">
                  <div className="text-[11px] text-warning font-medium">Tidak Lengkap (1 scan)</div>
                  <div className="text-lg font-bold text-warning mt-1">
                    {reportData.summary?.incompleteCount}
                  </div>
                </div>
              </div>

              {/* Tabel Detail Kehadiran */}
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Karyawan</th>
                      <th className="py-2.5 px-3">Departemen</th>
                      <th className="py-2.5 px-3">Jam Masuk</th>
                      <th className="py-2.5 px-3">Jam Pulang</th>
                      <th className="py-2.5 px-3 text-center">Durasi</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Hasil Pemeriksaan HR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-slate-800">
                    {reportData.records?.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-2 px-3 font-mono">{r.date}</td>
                        <td className="py-2 px-3">
                          <span className="font-semibold">{r.employee?.fullName}</span>{" "}
                          <span className="text-secondary font-mono text-[10px]">
                            ({r.employee?.employeeCode})
                          </span>
                        </td>
                        <td className="py-2 px-3">{r.employee?.department?.name}</td>
                        <td className="py-2 px-3 font-mono">
                          {r.checkIn
                            ? new Date(r.checkIn).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {r.checkOut
                            ? new Date(r.checkOut).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {r.workHours ? `${r.workHours} Jam` : "-"}
                        </td>
                        <td className="py-2 px-3 text-center font-medium">
                          {r.status === "ON_TIME"
                            ? "Tepat Waktu"
                            : r.status === "LATE"
                            ? "Terlambat"
                            : "Tidak Lengkap"}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-secondary">
                          {r.latenessReview?.decision || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Laporan Penggajian */
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-border rounded">
                  <div className="text-[11px] text-secondary">Total Karyawan</div>
                  <div className="text-lg font-bold text-slate-800 mt-1">
                    {reportData.summary?.totalEmployees}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-border rounded">
                  <div className="text-[11px] text-secondary">Total Gaji Pokok</div>
                  <div className="text-base font-bold text-slate-800 mt-1 font-mono">
                    Rp {reportData.summary?.totalBasic?.toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="p-3 bg-primary-light border border-primary/20 rounded">
                  <div className="text-[11px] text-primary font-semibold">Total Pengeluaran Gaji Bersih</div>
                  <div className="text-base font-bold text-primary mt-1 font-mono">
                    Rp {reportData.summary?.totalNet?.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Pegawai</th>
                      <th className="py-2.5 px-3">Departemen</th>
                      <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                      <th className="py-2.5 px-3 text-right">Tunjangan</th>
                      <th className="py-2.5 px-3 text-right">Lembur</th>
                      <th className="py-2.5 px-3 text-right">Potongan</th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">
                        Gaji Bersih
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-slate-800">
                    {reportData.records?.map((r: any) => (
                      <tr key={r.id}>
                        <td className="py-2 px-3 font-mono">{r.employee?.employeeCode}</td>
                        <td className="py-2 px-3 font-semibold">{r.employee?.fullName}</td>
                        <td className="py-2 px-3">{r.employee?.department?.name}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          Rp {r.basicSalary?.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          Rp {r.allowance?.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          Rp {r.overtimePay?.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-danger">
                          Rp {r.deduction?.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-primary">
                          Rp {r.netSalary?.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pengesahan Laporan */}
          <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-border text-center text-xs">
            <div>
              <div className="text-secondary text-[11px]">Dibuat oleh,</div>
              <div className="h-14"></div>
              <div className="font-semibold text-slate-900 underline">
                {currentUser?.fullName}
              </div>
              <div className="text-[10px] text-secondary">
                {currentUser?.role === "HR" ? "HR Administrator" : "Department Manager"}
              </div>
            </div>

            <div>
              <div className="text-secondary text-[11px]">Mengetahui,</div>
              <div className="h-14"></div>
              <div className="font-semibold text-slate-900 underline">
                Direktur Operasional
              </div>
              <div className="text-[10px] text-secondary">PT ANF Group</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
