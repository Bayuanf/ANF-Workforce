
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { History, Search, Filter, Eye, X, ShieldCheck, Lock } from "lucide-react";

export default function AuditLogsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [actionFilter, setActionFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);

    try {
      let url = "/api/audit-logs";

      if (actionFilter) {
        url += `?action=${actionFilter}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setLogs([]);
        return;
      }

      setLogs(data.logs || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Periksa sesi dan role sebelum mengambil audit log
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!res.ok || !data.user) {
          setSessionMissing(true);
          setLoading(false);
          return;
        }

        setCurrentUser(data.user);

        // DEMO tidak boleh mengambil data audit log
        if (data.user.role !== "HR") {
          setLoading(false);
          return;
        }
      } catch {
        setSessionMissing(true);
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  // Ambil audit log hanya jika pengguna adalah HR
  useEffect(() => {
    if (currentUser?.role === "HR") {
      fetchLogs();
    }
  }, [currentUser, actionFilter]);

  const getActionBadge = (act: string) => {
    if (act.includes("APPROVE") || act.includes("FINALIZE") || act.includes("CREATE")) {
      return "bg-success-light text-success border border-success/30";
    }

    if (act.includes("REJECT") || act.includes("DELETE")) {
      return "bg-danger-light text-danger border border-danger/30";
    }

    if (act.includes("UPDATE") || act.includes("REVIEW")) {
      return "bg-warning-light text-warning border border-warning/30";
    }

    return "bg-slate-100 text-slate-700 border border-slate-200";
  };

  // Tampilan saat memeriksa sesi
  if (!currentUser && !sessionMissing) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-xs text-secondary">
          Memeriksa sesi pengguna...
        </div>
      </AppLayout>
    );
  }

  // Tampilan jika sesi tidak ditemukan
  if (sessionMissing) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lock className="w-12 h-12 text-secondary mb-4" />
          <h2 className="text-lg font-bold text-primary">
            Sesi Pengguna Tidak Ditemukan
          </h2>
          <p className="text-sm text-secondary mt-2">
            Silakan login kembali untuk mengakses halaman ini.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Pembatasan akses DEMO dan role selain HR
  if (currentUser?.role !== "HR") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-5">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>

          <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-2">
            DEMO · READ ONLY
          </span>

          <h2 className="text-xl font-bold text-primary">
            Akses Fitur Dibatasi
          </h2>

          <p className="text-sm text-secondary mt-2 max-w-md leading-relaxed">
            Audit Log merupakan fitur administratif yang hanya dapat diakses
            oleh HR Administrator. Riwayat aktivitas dan rincian perubahan
            data sistem tidak tersedia untuk akun demonstrasi.
          </p>

          <div className="mt-6 px-4 py-2 bg-amber-50 border border-amber-200 rounded text-xs font-medium text-amber-700">
            Fitur ini hanya dapat diakses oleh HR Administrator.
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Audit Log Aktivitas Sistem</span>
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Pencatatan transparan seluruh aktivitas penting, mutasi data, pemeriksaan keterlambatan, dan persetujuan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary">Filter Aksi:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="py-1.5 px-3 border border-border rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Semua Tindakan</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="IMPORT_FINGERPRINT">IMPORT_FINGERPRINT</option>
              <option value="REVIEW_LATENESS">REVIEW_LATENESS</option>
              <option value="UPDATE_LATENESS_REVIEW">UPDATE_LATENESS_REVIEW</option>
              <option value="APPROVE_LEAVE">APPROVE_LEAVE</option>
              <option value="REJECT_LEAVE">REJECT_LEAVE</option>
              <option value="APPROVE_OVERTIME">APPROVE_OVERTIME</option>
              <option value="REJECT_OVERTIME">REJECT_OVERTIME</option>
              <option value="GENERATE_PAYROLL">GENERATE_PAYROLL</option>
              <option value="FINALIZE_PAYROLL">FINALIZE_PAYROLL</option>
              <option value="CREATE_EMPLOYEE">CREATE_EMPLOYEE</option>
              <option value="UPDATE_EMPLOYEE">UPDATE_EMPLOYEE</option>
            </select>
          </div>
        </div>

        {/* Tabel Audit Log */}
        <div className="bg-surface border border-border rounded overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-secondary">
              Memuat catatan audit log...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              Tidak ada riwayat aktivitas yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                  <tr>
                    <th className="py-3 px-4">Waktu Aktivitas</th>
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Tindakan (Action)</th>
                    <th className="py-3 px-4">Entitas Objek</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-center">Rincian Nilai</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border text-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {log.user?.employee?.fullName || log.user?.username || "Sistem"}
                        </div>
                        <div className="text-[10px] text-secondary font-mono">
                          {log.user?.email || "-"}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700">
                          {log.userRole || log.user?.role || "SYSTEM"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded font-mono ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        {log.entityName}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-secondary">
                        {log.ipAddress || "127.0.0.1"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {(log.oldValues || log.newValues) && (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] border border-border rounded text-secondary hover:text-primary hover:bg-slate-50"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat Diff</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Detail Perubahan Data */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-xl w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-primary">
                    Rincian Perubahan Data: {selectedLog.action}
                  </h2>
                  <div className="text-[11px] text-secondary">
                    Entitas: {selectedLog.entityName} ({selectedLog.entityId || "-"})
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                {selectedLog.oldValues && (
                  <div>
                    <div className="font-semibold text-slate-700 mb-1 text-[11px]">
                      Nilai Sebelumnya (Old Values):
                    </div>
                    <pre className="p-3 bg-slate-50 border border-border rounded font-mono text-[11px] overflow-x-auto text-slate-800">
                      {JSON.stringify(
                        JSON.parse(selectedLog.oldValues),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}

                {selectedLog.newValues && (
                  <div>
                    <div className="font-semibold text-slate-700 mb-1 text-[11px]">
                      Nilai Baru (New Values):
                    </div>
                    <pre className="p-3 bg-slate-50 border border-border rounded font-mono text-[11px] overflow-x-auto text-slate-800">
                      {JSON.stringify(
                        JSON.parse(selectedLog.newValues),
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 border border-border rounded text-xs text-secondary hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}