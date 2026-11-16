"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("2026-11");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = `/api/attendance?month=${selectedMonth}`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      if (selectedStatus) url += `&status=${selectedStatus}`;

      const res = await fetch(url);
      const data = await res.json();
      setRecords(data.records || []);
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
      fetchAttendance();
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAttendance();
    }
  }, [selectedMonth, selectedDept, selectedStatus]);

  const isHr = currentUser?.role === "HR";
  const isManager = currentUser?.role === "MANAGER";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary">
              {isHr
                ? "Rekapitulasi Kehadiran Karyawan"
                : isManager
                ? "Kehadiran Anggota Tim"
                : "Riwayat Kehadiran Saya"}
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Jadwal resmi: 08.00 – 17.00 WIB (Toleransi 10 menit s/d 08.10).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary">Periode Bulan:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 border border-border rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface border border-border rounded p-4 flex flex-col sm:flex-row gap-3">
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

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 border border-border rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Semua Status Kehadiran</option>
            <option value="ON_TIME">Tepat Waktu (s/d 08.10)</option>
            <option value="LATE">Terlambat (&gt; 08.10)</option>
            <option value="INCOMPLETE">Kehadiran Tidak Lengkap (1 scan)</option>
          </select>
        </div>

        {/* Tabel Kehadiran */}
        <div className="bg-surface border border-border rounded overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-secondary">
              Memuat catatan kehadiran...
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              Tidak ada catatan kehadiran pada periode ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    {(isHr || isManager) && (
                      <>
                        <th className="py-3 px-4">Karyawan</th>
                        <th className="py-3 px-4">Departemen</th>
                      </>
                    )}
                    <th className="py-3 px-4">Jam Masuk</th>
                    <th className="py-3 px-4">Jam Pulang</th>
                    <th className="py-3 px-4 text-center">Durasi Kerja</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Hasil Pemeriksaan HR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-800">
                  {records.map((r) => {
                    const checkInStr = r.checkIn
                      ? new Date(r.checkIn).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";

                    const checkOutStr = r.checkOut
                      ? new Date(r.checkOut).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {r.date}
                        </td>
                        {(isHr || isManager) && (
                          <>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">
                                {r.employee.fullName}
                              </div>
                              <div className="text-[11px] text-secondary">
                                {r.employee.employeeCode}
                              </div>
                            </td>
                            <td className="py-3 px-4">{r.employee.department?.name}</td>
                          </>
                        )}
                        <td
                          className={`py-3 px-4 font-mono font-medium ${
                            r.status === "LATE" ? "text-danger" : "text-slate-800"
                          }`}
                        >
                          {checkInStr}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800">
                          {checkOutStr}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {r.workHours ? `${r.workHours} Jam` : "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${
                              r.status === "ON_TIME"
                                ? "bg-success-light text-success border border-success/20"
                                : r.status === "LATE"
                                ? "bg-danger-light text-danger border border-danger/20"
                                : "bg-warning-light text-warning border border-warning/20"
                            }`}
                          >
                            {r.status === "ON_TIME"
                              ? "Tepat Waktu"
                              : r.status === "LATE"
                              ? "Terlambat"
                              : "Tidak Lengkap"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {r.latenessReview ? (
                            r.latenessReview.status === "REVIEWED" ? (
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {r.latenessReview.decision}
                                </span>
                                <span className="text-secondary block">
                                  "{r.latenessReview.reviewNotes}"
                                </span>
                              </div>
                            ) : (
                              <span className="text-warning italic">
                                Belum diperiksa HR
                              </span>
                            )
                          ) : (
                            <span className="text-secondary">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
