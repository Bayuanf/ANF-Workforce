
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Timer,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  X,
  AlertCircle,
} from "lucide-react";

export default function OvertimePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal Form Ajukan Lembur
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "17:30",
    endTime: "20:30",
    durationHours: 3.0,
    taskDescription: "",
  });

  // Modal Approval Manager
  const [activeApproval, setActiveApproval] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/overtime-requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Periksa identitas sebelum mengambil data lembur
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const userData = await res.json();

        if (!res.ok || !userData.user) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        setCurrentUser(userData.user);

        // DEMO tidak boleh mengambil data lembur
        if (userData.user.role === "DEMO") {
          setLoading(false);
          return;
        }

        fetchRequests();
      } catch {
        setCurrentUser(null);
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Hitung estimasi durasi lembur otomatis dari jam mulai dan jam selesai
  const calculateDuration = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      let diffHours = eh - sh + (em - sm) / 60;
      if (diffHours < 0) diffHours += 24;
      return Math.round(diffHours * 10) / 10;
    } catch {
      return 1;
    }
  };

  const handleTimeChange = (start: string, end: string) => {
    const dur = calculateDuration(start, end);
    setFormData((prev) => ({
      ...prev,
      startTime: start,
      endTime: end,
      durationHours: dur > 0 ? dur : 1,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/overtime-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal mengajukan lembur.");
        setSubmitting(false);
        return;
      }

      setFormSuccess("Pengajuan lembur berhasil dikirim ke atasan!");
      fetchRequests();
      setTimeout(() => {
        setShowCreateModal(false);
      }, 1000);
    } catch {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApproval) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/overtime-requests/${activeApproval.id}/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: approvalStatus, reviewNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal memproses persetujuan.");
        setSubmitting(false);
        return;
      }

      setFormSuccess(`Pengajuan lembur berhasil di-${approvalStatus === "APPROVED" ? "setujui" : "tolak"}.`);
      fetchRequests();
      setTimeout(() => {
        setActiveApproval(null);
      }, 1000);
    } catch {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const isEmployee = currentUser?.role === "EMPLOYEE";
  const isManager = currentUser?.role === "MANAGER";
  const isHr = currentUser?.role === "HR";
  const isDemo = currentUser?.role === "DEMO";

  // Tampilan loading saat memeriksa sesi pengguna
  if (loading && !currentUser) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-xs text-secondary">
          Memeriksa sesi pengguna...
        </div>
      </AppLayout>
    );
  }

  // Halaman khusus DEMO
  if (isDemo) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-border rounded-lg p-8 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Timer className="w-7 h-7 text-amber-600" />
            </div>

            <div className="inline-block px-3 py-1 mb-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tracking-wide">
              DEMO · READ ONLY
            </div>

            <h1 className="text-lg font-bold text-primary mb-2">
              Akses Fitur Dibatasi
            </h1>

            <p className="text-sm text-secondary leading-relaxed">
              Halaman Pengajuan & Pengelolaan Lembur tidak tersedia dalam mode
              demonstrasi. Anda tetap dapat menjelajahi Dashboard untuk melihat
              simulasi sistem ANF Workforce.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Tampilan jika sesi pengguna tidak ditemukan
  if (!currentUser) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-xs text-secondary">
          Sesi pengguna tidak ditemukan. Silakan login kembali.
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
            <h1 className="text-lg sm:text-xl font-bold text-primary">
              Pengajuan & Pengelolaan Lembur
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              {isEmployee
                ? "Ajukan jam kerja lembur dan pantau persetujuan atasan."
                : isManager
                ? "Verifikasi dan berikan persetujuan atas pengajuan lembur anggota tim."
                : "Monitoring dan pengelolaan seluruh data lembur karyawan."}
            </p>
          </div>

          {isEmployee && (
            <button
              onClick={() => {
                setFormError("");
                setFormSuccess("");
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajukan Lembur</span>
            </button>
          )}
        </div>

        {/* Tabel Data Lembur */}
        <div className="bg-surface border border-border rounded overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-secondary">
              Memuat data pengajuan lembur...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              Belum ada data pengajuan lembur.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tanggal Lembur</th>
                    {(isManager || isHr) && (
                      <th className="py-3 px-4">Karyawan</th>
                    )}
                    <th className="py-3 px-4">Jam Lembur</th>
                    <th className="py-3 px-4 text-center">Durasi</th>
                    <th className="py-3 px-4">Deskripsi / Uraian Tugas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Catatan Persetujuan</th>
                    {(isManager || isHr) && (
                      <th className="py-3 px-4 text-center">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-800">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-700 font-mono font-medium">
                        {req.date}
                      </td>
                      {(isManager || isHr) && (
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {req.employee?.fullName}
                          </div>
                          <div className="text-[11px] text-secondary">
                            {req.employee?.employeeCode} • {req.employee?.department?.name}
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {req.startTime} – {req.endTime} WIB
                      </td>
                      <td className="py-3 px-4 text-center font-semibold font-mono">
                        {req.durationHours} Jam
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[11px]">
                        {req.taskDescription}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${
                            req.status === "APPROVED"
                              ? "bg-success-light text-success border border-success/20"
                              : req.status === "REJECTED"
                              ? "bg-danger-light text-danger border border-danger/20"
                              : "bg-warning-light text-warning border border-warning/20"
                          }`}
                        >
                          {req.status === "APPROVED"
                            ? "Disetujui"
                            : req.status === "REJECTED"
                            ? "Ditolak"
                            : "Menunggu Persetujuan"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-secondary">
                        {req.reviewNotes ? (
                          <div>
                            <span className="text-slate-800 font-medium">"{req.reviewNotes}"</span>
                            <span className="block text-[10px]">
                              Oleh: {req.reviewer?.employee?.fullName || req.reviewer?.username}
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      {(isManager || isHr) && (
                        <td className="py-3 px-4 text-center">
                          {req.status === "PENDING" && (
                            <button
                              onClick={() => {
                                setActiveApproval(req);
                                setApprovalStatus("APPROVED");
                                setReviewNotes("");
                                setFormError("");
                                setFormSuccess("");
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-primary-hover"
                            >
                              Proses
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Ajukan Lembur (Karyawan) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-sm font-bold text-primary">
                  Formulir Pengajuan Lembur
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3 text-xs">
                {formError && (
                  <div className="p-2.5 rounded bg-danger-light text-danger border border-danger/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="p-2.5 rounded bg-success-light text-success border border-success/20 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Lembur *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jam Mulai *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) =>
                        handleTimeChange(e.target.value, formData.endTime)
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jam Selesai *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) =>
                        handleTimeChange(formData.startTime, e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Durasi Efektif (Jam)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={formData.durationHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationHours: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-border rounded bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deskripsi / Uraian Tugas Lembur *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Uraikan target pekerjaan atau tugas yang dikerjakan saat lembur..."
                    value={formData.taskDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, taskDescription: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 border border-border rounded text-secondary hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-primary-hover disabled:opacity-50"
                  >
                    {submitting ? "Mengirim..." : "Kirim Pengajuan Lembur"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Approval Manager */}
        {activeApproval && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-sm font-bold text-primary">
                  Persetujuan Lembur Karyawan
                </h2>
                <button
                  onClick={() => setActiveApproval(null)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleApprovalSubmit} className="mt-4 space-y-3 text-xs">
                {formError && (
                  <div className="p-2.5 rounded bg-danger-light text-danger border border-danger/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {formSuccess && (
                  <div className="p-2.5 rounded bg-success-light text-success border border-success/20 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-border rounded text-[11px] space-y-1">
                  <div>
                    <span className="font-semibold text-slate-800">Karyawan:</span>{" "}
                    {activeApproval.employee?.fullName} ({activeApproval.employee?.employeeCode})
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Tanggal:</span>{" "}
                    {activeApproval.date} ({activeApproval.startTime} – {activeApproval.endTime} WIB)
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Durasi:</span>{" "}
                    {activeApproval.durationHours} Jam
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Uraian Tugas:</span>{" "}
                    "{activeApproval.taskDescription}"
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Keputusan *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="approvalStatus"
                        value="APPROVED"
                        checked={approvalStatus === "APPROVED"}
                        onChange={() => setApprovalStatus("APPROVED")}
                      />
                      <span className="text-success font-medium">Setujui Lembur (Approved)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="approvalStatus"
                        value="REJECTED"
                        checked={approvalStatus === "REJECTED"}
                        onChange={() => setApprovalStatus("REJECTED")}
                      />
                      <span className="text-danger font-medium">Tolak Lembur (Rejected)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Atasan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Berikan catatan..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setActiveApproval(null)}
                    className="px-3 py-1.5 border border-border rounded text-secondary hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-primary-hover disabled:opacity-50"
                  >
                    {submitting ? "Memproses..." : "Konfirmasi Keputusan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}