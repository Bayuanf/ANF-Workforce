
"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  X,
  AlertCircle,
  UserCheck,
  Lock,
} from "lucide-react";

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMissing, setSessionMissing] = useState(false);

  // Modal Form Ajukan Cuti/Izin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "ANNUAL_LEAVE",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    totalDays: 1,
    reason: "",
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
      const res = await fetch("/api/leave-requests");
      const data = await res.json();

      if (!res.ok) {
        setRequests([]);
        return;
      }

      setRequests(data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Periksa sesi dan role sebelum mengambil data cuti
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const userData = await res.json();

        if (!res.ok || !userData.user) {
          setSessionMissing(true);
          setLoading(false);
          return;
        }

        setCurrentUser(userData.user);

        // DEMO tidak boleh mengakses halaman maupun API cuti
        if (userData.user.role === "DEMO") {
          setLoading(false);
          return;
        }

        // Hanya pengguna yang sudah terautentikasi
        // yang melanjutkan proses pengambilan data
        if (
          ["EMPLOYEE", "MANAGER", "HR"].includes(userData.user.role)
        ) {
          await fetchRequests();
        } else {
          setLoading(false);
        }
      } catch {
        setSessionMissing(true);
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Gagal mengajukan cuti/izin.");
        setSubmitting(false);
        return;
      }

      setFormSuccess("Pengajuan cuti/izin berhasil dikirim ke atasan!");
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
      const res = await fetch(
        `/api/leave-requests/${activeApproval.id}/approval`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: approvalStatus,
            reviewNotes,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Gagal memproses persetujuan.");
        setSubmitting(false);
        return;
      }

      setFormSuccess(
        `Pengajuan berhasil di-${approvalStatus === "APPROVED" ? "setujui" : "tolak"}.`
      );

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

  const getTypeName = (type: string) => {
    switch (type) {
      case "ANNUAL_LEAVE":
        return "Cuti Tahunan";
      case "SICK":
        return "Sakit (Surat Dokter)";
      case "PERMISSION":
        return "Izin Pribadi";
      default:
        return "Lainnya";
    }
  };

  // Tampilan loading
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-sm text-secondary">
            Memeriksa akses pengguna...
          </p>
        </div>
      </AppLayout>
    );
  }

  // Jika sesi tidak ditemukan
  if (sessionMissing) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-warning mx-auto mb-3" />
            <h2 className="text-lg font-bold text-primary">
              Sesi Pengguna Tidak Ditemukan
            </h2>
            <p className="text-sm text-secondary mt-1">
              Silakan login kembali untuk melanjutkan.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Halaman khusus pembatasan akun DEMO
  if (isDemo || (!isEmployee && !isManager && !isHr)) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="max-w-md w-full bg-surface border border-border rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold tracking-wider mb-4">
              DEMO · READ ONLY
            </div>

            <h2 className="text-lg font-bold text-primary mb-2">
              Akses Fitur Dibatasi
            </h2>

            <p className="text-sm text-secondary leading-relaxed">
              Akun demonstrasi hanya dapat mengakses Dashboard.
              Fitur Pengajuan Cuti & Izin tidak tersedia untuk akun DEMO.
            </p>

            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-secondary">
                Silakan gunakan menu Dashboard untuk melihat demonstrasi
                ANF Workforce.
              </p>
            </div>
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
            <h1 className="text-lg sm:text-xl font-bold text-primary">
              Pengajuan Cuti & Izin
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              {isEmployee
                ? "Ajukan permohonan cuti tahunan atau izin dan pantau status persetujuan atasan."
                : isManager
                ? "Daftar permohonan cuti & izin dari anggota tim yang membutuhkan persetujuan."
                : "Pengawasan seluruh permohonan cuti dan izin karyawan."}
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
              <span>Ajukan Cuti / Izin</span>
            </button>
          )}
        </div>

        {/* Tabel Pengajuan */}
        <div className="bg-surface border border-border rounded overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-secondary">
              Memuat data permohonan cuti...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              Belum ada permohonan cuti atau izin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tanggal Pengajuan</th>
                    {(isManager || isHr) && (
                      <th className="py-3 px-4">Karyawan</th>
                    )}
                    <th className="py-3 px-4">Jenis Permohonan</th>
                    <th className="py-3 px-4">Rentang Tanggal</th>
                    <th className="py-3 px-4 text-center">Durasi</th>
                    <th className="py-3 px-4">Alasan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Catatan Atasan</th>
                    {(isManager || isHr) && (
                      <th className="py-3 px-4 text-center">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-800">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString("id-ID")}
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
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {getTypeName(req.type)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {req.startDate} s/d {req.endDate}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {req.totalDays} Hari
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-[11px]">
                        {req.reason}
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
                            <span className="text-slate-800 font-medium">
                              "{req.reviewNotes}"
                            </span>
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

        {/* Modal Buat Pengajuan (Karyawan) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-sm font-bold text-primary">
                  Formulir Pengajuan Cuti / Izin
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
                    Jenis Permohonan *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
                  >
                    <option value="ANNUAL_LEAVE">Cuti Tahunan</option>
                    <option value="SICK">Sakit (Surat Dokter)</option>
                    <option value="PERMISSION">Izin Keperluan Pribadi</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Selesai *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Hari Kerja *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.totalDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalDays: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alasan / Keterangan Permohonan *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Jelaskan alasan permohonan secara jelas..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
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
                    {submitting ? "Mengirim..." : "Kirim Pengajuan"}
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
                  Persetujuan Permohonan Cuti/Izin
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
                    <span className="font-semibold text-slate-800">Jenis:</span>{" "}
                    {getTypeName(activeApproval.type)} ({activeApproval.totalDays} hari)
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Tanggal:</span>{" "}
                    {activeApproval.startDate} s/d {activeApproval.endDate}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Alasan:</span>{" "}
                    "{activeApproval.reason}"
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Keputusan Atasan *
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
                      <span className="text-success font-medium">Setujui (Approved)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="approvalStatus"
                        value="REJECTED"
                        checked={approvalStatus === "REJECTED"}
                        onChange={() => setApprovalStatus("REJECTED")}
                      />
                      <span className="text-danger font-medium">Tolak (Rejected)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Review Atasan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Berikan catatan jika diperlukan..."
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