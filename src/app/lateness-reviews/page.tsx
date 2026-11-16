"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  ClockAlert,
  Search,
  CheckCircle,
  AlertCircle,
  History,
  X,
  Edit,
  Clock,
  Filter,
} from "lucide-react";
import { LATENESS_DECISIONS } from "@/lib/constants";

export default function LatenessReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("PENDING");
  const [selectedDate, setSelectedDate] = useState("");

  // Modal Input / Edit Review
  const [activeReview, setActiveReview] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [decision, setDecision] = useState("EXCUSED");
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Modal Riwayat Perubahan (Audit History)
  const [historyReview, setHistoryReview] = useState<any>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let url = `/api/lateness-reviews?status=${selectedStatus}`;
      if (selectedDate) url += `&date=${selectedDate}`;
      const res = await fetch(url);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedStatus, selectedDate]);

  const handleOpenReview = (rev: any, edit: boolean = false) => {
    setActiveReview(rev);
    setIsEditMode(edit);
    setDecision(rev.decision || "EXCUSED");
    setReviewNotes(rev.reviewNotes || "");
    setFormError("");
    setFormSuccess("");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview) return;
    if (!reviewNotes.trim()) {
      setFormError("Catatan pemeriksaan wajib diisi.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(`/api/lateness-reviews/${activeReview.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal menyimpan hasil pemeriksaan.");
        setSubmitting(false);
        return;
      }

      setFormSuccess(
        isEditMode
          ? "Hasil pemeriksaan berhasil diubah & tercatat dalam riwayat audit."
          : "Hasil pemeriksaan berhasil disimpan. Status menjadi Sudah Diperiksa."
      );
      fetchReviews();
      setTimeout(() => {
        setActiveReview(null);
      }, 1000);
    } catch {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary">
              Pemeriksaan Keterlambatan
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Daftar catatan kehadiran karyawan yang melewati toleransi (08.10) atau berstatus tidak lengkap.
            </p>
          </div>

          <div className="text-xs text-secondary bg-surface border border-border px-3 py-2 rounded">
            Kebijakan: Toleransi 10 menit (s/d 08.10 tepat waktu, 08.11 ke atas diperiksa HR)
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface border border-border rounded p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedStatus("PENDING")}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedStatus === "PENDING"
                  ? "bg-primary text-white"
                  : "border border-border text-secondary hover:bg-slate-50"
              }`}
            >
              Belum Diperiksa
            </button>
            <button
              onClick={() => setSelectedStatus("REVIEWED")}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedStatus === "REVIEWED"
                  ? "bg-primary text-white"
                  : "border border-border text-secondary hover:bg-slate-50"
              }`}
            >
              Sudah Diperiksa
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-secondary">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 border border-border rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="text-xs text-secondary hover:text-danger"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tabel Pemeriksaan Keterlambatan */}
        <div className="bg-surface border border-border rounded overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-secondary">
              Memuat data pemeriksaan keterlambatan...
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              Tidak ada catatan keterlambatan untuk kategori ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Karyawan</th>
                    <th className="py-3 px-4">Departemen</th>
                    <th className="py-3 px-4">Jam Masuk Asli</th>
                    <th className="py-3 px-4">Status Kehadiran</th>
                    <th className="py-3 px-4">Hasil Pemeriksaan HR</th>
                    <th className="py-3 px-4 text-center">Status Review</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-800">
                  {reviews.map((rev) => {
                    const att = rev.attendanceRecord;
                    const emp = att.employee;
                    const checkInStr = att.checkIn
                      ? new Date(att.checkIn).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Tidak Ada Scan";

                    return (
                      <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {att.date}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] text-secondary">
                            {emp.employeeCode} • {emp.position?.title}
                          </div>
                        </td>
                        <td className="py-3 px-4">{emp.department?.name}</td>
                        <td className="py-3 px-4 font-mono text-danger font-medium">
                          {checkInStr}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${
                              att.status === "LATE"
                                ? "bg-danger-light text-danger border border-danger/20"
                                : "bg-warning-light text-warning border border-warning/20"
                            }`}
                          >
                            {att.status === "LATE"
                              ? "Terlambat (> 08.10)"
                              : "Kehadiran Tidak Lengkap"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {rev.status === "REVIEWED" ? (
                            <div>
                              <div className="font-semibold text-slate-800 text-[11px]">
                                {rev.decision}
                              </div>
                              <div className="text-[11px] text-secondary truncate max-w-xs">
                                "{rev.reviewNotes}"
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-secondary italic">
                              Belum diperiksa oleh HR
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${
                              rev.status === "REVIEWED"
                                ? "bg-success-light text-success border border-success/20"
                                : "bg-warning-light text-warning border border-warning/20"
                            }`}
                          >
                            {rev.status === "REVIEWED"
                              ? "Sudah Diperiksa"
                              : "Belum Diperiksa"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {rev.status === "PENDING" ? (
                              <button
                                onClick={() => handleOpenReview(rev, false)}
                                className="px-2.5 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-primary-hover"
                              >
                                Periksa
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenReview(rev, true)}
                                  className="p-1 text-secondary hover:text-primary rounded hover:bg-slate-100"
                                  title="Ubah Hasil Pemeriksaan"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {rev.history?.length > 0 && (
                                  <button
                                    onClick={() => setHistoryReview(rev)}
                                    className="p-1 text-secondary hover:text-primary rounded hover:bg-slate-100"
                                    title="Lihat Riwayat Audit Perubahan"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Pengisian / Pengubahan Hasil Pemeriksaan (PRD 5.3) */}
        {activeReview && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-primary">
                    {isEditMode
                      ? "Ubah Hasil Pemeriksaan Keterlambatan"
                      : "Pemeriksaan Keterlambatan HR"}
                  </h2>
                  <div className="text-[11px] text-secondary">
                    {activeReview.attendanceRecord.employee.fullName} (
                    {activeReview.attendanceRecord.date})
                  </div>
                </div>
                <button
                  onClick={() => setActiveReview(null)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="mt-4 space-y-3 text-xs">
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
                    <span className="font-semibold text-slate-700">Waktu Scan Masuk:</span>{" "}
                    {activeReview.attendanceRecord.checkIn
                      ? new Date(
                          activeReview.attendanceRecord.checkIn
                        ).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Tidak ada data scan"}
                  </div>
                  <div className="text-secondary">
                    Data fingerprint mentah tetap utuh dan tidak diubah.
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Keputusan HR *
                  </label>
                  <select
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
                  >
                    <option value="Izin Diterima (Alasan Darurat/Cuaca)">
                      Izin Diterima (Alasan Darurat / Cuaca Buruk)
                    </option>
                    <option value="Teguran Lisan / Pengingat">
                      Teguran Lisan / Pengingat
                    </option>
                    <option value="Tanpa Alasan Sah">Tanpa Alasan Sah</option>
                    <option value="Mesin Gangguan / Lupa Scan Pulang">
                      Mesin Gangguan / Terverifikasi Hadir (Lupa Scan)
                    </option>
                    <option value="Perlu Koordinasi Atasan Langsung">
                      Perlu Koordinasi Atasan Langsung
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Pemeriksaan HR (Wajib Diisi) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan alasan, keterangan karyawan, atau tindak lanjut..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {isEditMode && (
                  <div className="text-[11px] text-warning bg-warning-light p-2 rounded border border-warning/20">
                    Perhatian: Setiap perubahan hasil pemeriksaan akan tersimpan dalam riwayat audit sistem.
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setActiveReview(null)}
                    className="px-3 py-1.5 border border-border rounded text-secondary hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-primary-hover disabled:opacity-50"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Hasil Pemeriksaan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Riwayat Audit Perubahan Hasil Pemeriksaan (PRD 5.3) */}
        {historyReview && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                    <History className="w-4 h-4 text-secondary" />
                    <span>Riwayat Audit Perubahan Pemeriksaan</span>
                  </h2>
                  <div className="text-[11px] text-secondary">
                    {historyReview.attendanceRecord.employee.fullName} •{" "}
                    {historyReview.attendanceRecord.date}
                  </div>
                </div>
                <button
                  onClick={() => setHistoryReview(null)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate-50 border border-border rounded text-xs">
                  <div className="text-slate-500 font-semibold mb-1 text-[11px] uppercase tracking-wider">
                    Nilai Saat Ini:
                  </div>
                  <div className="font-semibold text-slate-800">
                    {historyReview.decision}
                  </div>
                  <div className="text-secondary text-[11px]">
                    "{historyReview.reviewNotes}"
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-700 pt-2">
                  Jejak Perubahan Sebelumnya:
                </div>

                <div className="divide-y divide-border border border-border rounded overflow-hidden">
                  {historyReview.history.map((hist: any) => (
                    <div key={hist.id} className="p-3 bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-secondary">
                        <span className="font-medium text-primary">
                          Diubah oleh: {hist.reviewer?.employee?.fullName || hist.reviewer?.username}
                        </span>
                        <span>{new Date(hist.changedAt).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="text-slate-700">
                        <span className="text-secondary font-mono text-[10px]">
                          Keputusan Lama:
                        </span>{" "}
                        <span className="line-through text-slate-500">{hist.oldDecision || "-"}</span>{" "}
                        → <span className="font-semibold text-slate-800">{hist.newDecision}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        <span className="text-secondary font-mono text-[10px]">Catatan Lama:</span>{" "}
                        "{hist.oldNotes || "-"}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryReview(null)}
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
