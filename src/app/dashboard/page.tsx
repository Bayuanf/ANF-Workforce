
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  ClockAlert,
  CalendarDays,
  Banknote,
  UploadCloud,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("anf_user");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<any>({
    totalEmployees: 0,
    todayAttendance: 0,
    todayOnTime: 0,
    todayLate: 0,
    todayIncomplete: 0,
    pendingReviews: 0,
    pendingLeaves: 0,
    pendingOvertimes: 0,
  });

  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        let user = currentUser;

        if (!user) {
          const uRes = await fetch("/api/auth/me");
          if (!uRes.ok) return;

          const uData = await uRes.json();
          user = uData.user;

          if (user) {
            setCurrentUser(user);
            try {
              sessionStorage.setItem("anf_user", JSON.stringify(user));
            } catch {}
          }
        }

        if (!user) return;

        // DEMO: Gunakan statistik simulasi.
        // Tidak mengambil data internal perusahaan melalui API.
        if (user.role === "DEMO") {
          setStats({
            totalEmployees: 120,
            todayAttendance: 108,
            todayOnTime: 100,
            todayLate: 6,
            todayIncomplete: 2,
            pendingReviews: 5,
            pendingLeaves: 4,
            pendingOvertimes: 3,
          });

          setRecentReviews([]);
          setPendingRequests([]);
          return;
        }

        const todayStr = new Date().toISOString().split("T")[0];

        const promises: Promise<any>[] = [
          fetch(`/api/attendance?date=${todayStr}`)
            .then((r) => r.json())
            .catch(() => ({ records: [] })),

          fetch("/api/leave-requests?status=PENDING")
            .then((r) => r.json())
            .catch(() => ({ requests: [] })),

          fetch("/api/overtime-requests?status=PENDING")
            .then((r) => r.json())
            .catch(() => ({ requests: [] })),
        ];

        if (user.role === "HR") {
          promises.push(
            fetch("/api/employees")
              .then((r) => r.json())
              .catch(() => ({ employees: [] })),

            fetch("/api/lateness-reviews?status=PENDING")
              .then((r) => r.json())
              .catch(() => ({ reviews: [] }))
          );
        }

        const results = await Promise.all(promises);

        const attData = results[0] || {};
        const leaveData = results[1] || {};
        const otData = results[2] || {};
        const empData = results[3] || {};
        const revData = results[4] || {};

        const records = attData.records || [];

        const onTime = records.filter(
          (r: any) => r.status === "ON_TIME"
        ).length;

        const late = records.filter(
          (r: any) => r.status === "LATE"
        ).length;

        const inc = records.filter(
          (r: any) => r.status === "INCOMPLETE"
        ).length;

        setStats({
          totalEmployees: empData.employees?.length || 0,
          todayAttendance: records.length,
          todayOnTime: onTime,
          todayLate: late,
          todayIncomplete: inc,
          pendingReviews: revData.reviews?.length || 0,
          pendingLeaves: leaveData.requests?.length || 0,
          pendingOvertimes: otData.requests?.length || 0,
        });

        if (revData.reviews) {
          setRecentReviews(revData.reviews.slice(0, 5));
        }

        const combined = [
          ...(leaveData.requests || []).map((r: any) => ({
            ...r,
            category: "CUTI/IZIN",
          })),
          ...(otData.requests || []).map((r: any) => ({
            ...r,
            category: "LEMBUR",
          })),
        ].slice(0, 5);

        setPendingRequests(combined);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-xs text-secondary">
          Memuat ringkasan operasional...
        </div>
      </AppLayout>
    );
  }

  const role = currentUser?.role;
  const isDemo = role === "DEMO";

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Banner Selamat Datang */}
        <div className="bg-surface border border-border rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
              Portal Terpadu ANF Workforce
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-primary">
              {isDemo
                ? "Selamat Datang, Demo ANF Workforce"
                : `Selamat Datang, ${currentUser?.fullName || ""}`}
            </h1>

            <p className="text-xs text-secondary mt-1">
              {isDemo
                ? "Jelajahi demonstrasi sistem pengelolaan sumber daya manusia ANF Workforce."
                : role === "HR"
                ? "Kelola administrasi kepegawaian, verifikasi kehadiran, dan perhitungan penggajian."
                : role === "MANAGER"
                ? `Pantau kehadiran dan persetujuan pengajuan anggota ${currentUser?.departmentName || "Tim"}.`
                : "Pantau riwayat kehadiran, ajukan permohonan cuti, lembur, dan unduh slip gaji."}
            </p>
          </div>

          {isDemo && (
            <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-blue-700 text-xs font-semibold text-center">
              MODE DEMONSTRASI · READ ONLY
            </div>
          )}

          <div className="flex items-center gap-2">
            {role === "HR" && (
              <>
                <Link
                  href="/fingerprint/import"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Import Fingerprint</span>
                </Link>

                <Link
                  href="/lateness-reviews"
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-white text-xs font-medium text-slate-700 rounded hover:bg-slate-50 transition-colors"
                >
                  <ClockAlert className="w-3.5 h-3.5 text-warning" />
                  <span>Pemeriksaan HR</span>
                </Link>
              </>
            )}

            {role === "EMPLOYEE" && (
              <>
                <Link
                  href="/leave-requests"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover transition-colors"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Ajukan Cuti/Izin</span>
                </Link>

                <Link
                  href="/payroll/payslip"
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-white text-xs font-medium text-slate-700 rounded hover:bg-slate-50 transition-colors"
                >
                  <Banknote className="w-3.5 h-3.5 text-success" />
                  <span>Lihat Slip Gaji</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Kartu Statistik */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {(role === "HR" || isDemo) && (
            <div className="bg-surface border border-border rounded p-4">
              <div className="flex items-center justify-between text-secondary">
                <span className="text-xs font-medium">
                  Total Karyawan Aktif
                </span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>

              <div className="mt-2 text-2xl font-bold text-slate-800">
                {stats.totalEmployees}
              </div>

              <div className="text-[11px] text-secondary mt-1">
                {isDemo ? "Angka simulasi demonstrasi" : "Karyawan terdaftar di sistem"}
              </div>
            </div>
          )}

          <div className="bg-surface border border-border rounded p-4">
            <div className="flex items-center justify-between text-secondary">
              <span className="text-xs font-medium">
                {role === "EMPLOYEE"
                  ? "Kehadiran Hari Ini"
                  : "Total Scan Hari Ini"}
              </span>
              <CalendarCheck className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-800">
              {stats.todayAttendance}
            </div>

            <div className="text-[11px] text-secondary mt-1">
              {stats.todayOnTime} Tepat Waktu • {stats.todayLate} Terlambat
            </div>
          </div>

          <div className="bg-surface border border-border rounded p-4">
            <div className="flex items-center justify-between text-secondary">
              <span className="text-xs font-medium">
                {role === "HR" ? "Keterlambatan Belum Diperiksa" : "Kehadiran Tidak Lengkap"}
              </span>
              <ClockAlert className="w-4 h-4 text-warning" />
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-800">
              {role === "HR" ? stats.pendingReviews : stats.todayIncomplete}
            </div>

            <div className="text-[11px] text-secondary mt-1">
              {role === "HR"
                ? "Menunggu verifikasi hasil pemeriksaan"
                : isDemo
                ? "Angka simulasi demonstrasi"
                : "1 scan (menunggu verifikasi HR)"}
            </div>
          </div>

          <div className="bg-surface border border-border rounded p-4">
            <div className="flex items-center justify-between text-secondary">
              <span className="text-xs font-medium">Pengajuan Pending</span>
              <CalendarDays className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-800">
              {stats.pendingLeaves + stats.pendingOvertimes}
            </div>

            <div className="text-[11px] text-secondary mt-1">
              {stats.pendingLeaves} Cuti • {stats.pendingOvertimes} Lembur
            </div>
          </div>
        </div>

        {/* Panel Informasi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Panel Keterlambatan / Aturan Kerja */}
          <div className="bg-surface border border-border rounded overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-primary">
                {role === "HR"
                  ? "Pemeriksaan Keterlambatan Menunggu HR"
                  : "Jadwal Kerja & Aturan Kehadiran"}
              </h2>

              <div className="text-[11px] text-secondary">
                {role === "HR"
                  ? "Wajib diisi hasil pemeriksaan dan keputusan"
                  : "Standar operasional PT ANF Group"}
              </div>
            </div>

            <div className="p-4">
              {role === "HR" ? (
                recentReviews.length === 0 ? (
                  <div className="py-8 text-center text-xs text-secondary">
                    Tidak ada catatan keterlambatan yang menunggu pemeriksaan.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="py-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-slate-800">
                            {rev.attendanceRecord.employee.fullName} (
                            {rev.attendanceRecord.employee.employeeCode})
                          </div>
                          <div className="text-secondary text-[11px] mt-0.5">
                            Tanggal: {rev.attendanceRecord.date} • Masuk:{" "}
                            {rev.attendanceRecord.checkIn
                              ? new Date(rev.attendanceRecord.checkIn).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "-"}
                          </div>
                        </div>

                        <Link
                          href="/lateness-reviews"
                          className="px-2.5 py-1 text-xs font-medium text-primary border border-border rounded hover:bg-slate-50"
                        >
                          Periksa
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 bg-[#F8FAFC] border border-border rounded space-y-1.5">
                    <div className="font-semibold text-primary">
                      Ketentuan Jam Kerja:
                    </div>
                    <div className="text-secondary text-[11px]">
                      • Hari Kerja: Senin – Jumat (08.00 – 17.00 WIB)
                    </div>
                    <div className="text-secondary text-[11px]">
                      • Jam Istirahat: 12.00 – 13.00 WIB
                    </div>
                    <div className="text-secondary text-[11px]">
                      • Toleransi Keterlambatan: 10 menit (s/d 08.10 tepat waktu)
                    </div>
                    <div className="text-secondary text-[11px]">
                      • Pukul 08.11 ke atas dicatat sebagai Keterlambatan untuk diperiksa HR
                    </div>
                  </div>

                  <div className="text-[11px] text-secondary">
                    Catatan: Kehadiran dengan 1 kali scan berstatus INCOMPLETE dan akan diverifikasi oleh HR.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel Pengajuan */}
          <div className="bg-surface border border-border rounded overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-primary">
                {isDemo ? "Informasi Modul Pengajuan" : "Pengajuan Cuti & Lembur"}
              </h2>

              <div className="text-[11px] text-secondary">
                {isDemo
                  ? "Gambaran fitur pengajuan dalam ANF Workforce"
                  : role === "EMPLOYEE"
                  ? "Status permohonan terkini Anda"
                  : "Menunggu persetujuan atasan"}
              </div>
            </div>

            <div className="p-4">
              {isDemo ? (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 bg-[#F8FAFC] border border-border rounded">
                    <div className="font-semibold text-primary mb-1">
                      Pengajuan Cuti & Izin
                    </div>
                    <div className="text-secondary text-[11px]">
                      Modul untuk mengelola permohonan cuti dan izin karyawan,
                      termasuk proses persetujuan oleh atasan.
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-border rounded">
                    <div className="font-semibold text-primary mb-1">
                      Pengajuan Lembur
                    </div>
                    <div className="text-secondary text-[11px]">
                      Modul untuk mengelola pengajuan lembur dan proses
                      persetujuan sesuai kebijakan perusahaan.
                    </div>
                  </div>

                  <div className="text-[11px] text-secondary">
                    Data yang ditampilkan pada Dashboard DEMO merupakan
                    simulasi dan tidak mewakili data operasional perusahaan.
                  </div>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-secondary">
                  Tidak ada pengajuan cuti atau lembur yang pending.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="py-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {req.employee?.fullName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {req.category}
                          </span>
                        </div>

                        <div className="text-secondary text-[11px] mt-0.5">
                          {req.category === "CUTI/IZIN"
                            ? `${req.startDate} s/d ${req.endDate} (${req.totalDays} hari)`
                            : `Tanggal: ${req.date} • Durasi: ${req.durationHours} jam`}
                        </div>
                      </div>

                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-warning-light text-warning border border-warning/30">
                        Menunggu Persetujuan
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
