"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Banknote,
  Plus,
  Calculator,
  Lock,
  Edit2,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  DollarSign,
} from "lucide-react";

export default function PayrollPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal Periode Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState("Desember 2026");
  const [startDate, setStartDate] = useState("2026-12-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  // Modal Edit Penyesuaian Record Karyawan
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [allowance, setAllowance] = useState(0);
  const [overtimePay, setOvertimePay] = useState(0);
  const [deduction, setDeduction] = useState(0);
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPeriods = async () => {
    try {
      const res = await fetch("/api/payroll/periods");
      const data = await res.json();
      setPeriods(data.periods || []);
      if (data.periods?.length > 0) {
        // Pilih periode terbaru secara default
        const active = selectedPeriod
          ? data.periods.find((p: any) => p.id === selectedPeriod.id) || data.periods[0]
          : data.periods[0];
        setSelectedPeriod(active);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

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

      if (userData.user.role === "DEMO") {
        setLoading(false);
        return;
      }

      fetchPeriods();
    } catch {
      setCurrentUser(null);
      setLoading(false);
    }
  };

  checkUser();
}, []);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/payroll/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPeriodName,
          startDate,
          endDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal membuat periode penggajian.");
        setSubmitting(false);
        return;
      }

      setActionMsg(`Periode ${newPeriodName} berhasil dibuat.`);
      setShowCreateModal(false);
      fetchPeriods();
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!selectedPeriod) return;
    setSubmitting(true);
    setErrorMsg("");
    setActionMsg("");

    try {
      const res = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId: selectedPeriod.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal mengenerate perhitungan.");
        setSubmitting(false);
        return;
      }

      setActionMsg(data.message || "Perhitungan penggajian berhasil digenerate!");
      fetchPeriods();
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizePeriod = async () => {
    if (!selectedPeriod) return;
    if (
      !confirm(
        `Apakah Anda yakin ingin memfinalisasi periode ${selectedPeriod.name}? Data penggajian akan dikunci dan slip gaji diterbitkan untuk karyawan.`
      )
    ) {
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/payroll/periods/${selectedPeriod.id}/finalize`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memfinalisasi penggajian.");
        setSubmitting(false);
        return;
      }

      setActionMsg(data.message);
      fetchPeriods();
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditRecord = (rec: any) => {
    setEditingRecord(rec);
    setAllowance(rec.allowance || 0);
    setOvertimePay(rec.overtimePay || 0);
    setDeduction(rec.deduction || 0);
    setNotes(rec.notes || "");
    setErrorMsg("");
  };

  const handleSaveEditRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/payroll/records/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowance,
          overtimePay,
          deduction,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memperbarui rincian gaji.");
        setSubmitting(false);
        return;
      }

      setActionMsg("Penyesuaian komponen gaji berhasil disimpan.");
      setEditingRecord(null);
      fetchPeriods();
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFinalized = selectedPeriod?.status === "FINALIZED";
  const records = selectedPeriod?.records || [];

  const totalPayroll = records.reduce((sum: number, r: any) => sum + r.netSalary, 0);
  const isDemo = currentUser?.role === "DEMO";

// Periksa sesi pengguna
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
            <Lock className="w-7 h-7 text-amber-600" />
          </div>

          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold tracking-wide">
            DEMO · READ ONLY
          </div>

          <h1 className="text-lg font-bold text-primary mb-2">
            Akses Fitur Dibatasi
          </h1>

          <p className="text-sm text-secondary leading-relaxed">
            Fitur Pengelolaan Penggajian tidak tersedia dalam mode demonstrasi
            karena memuat informasi keuangan dan gaji karyawan.
            Silakan kembali ke Dashboard untuk menjelajahi simulasi ANF Workforce.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

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
              Pengelolaan Penggajian (Payroll)
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Alur: Inisiasi Periode → Generate Perhitungan → Pemeriksaan & Penyesuaian HR → Finalisasi → Slip Gaji Resmi.
            </p>
          </div>

          <button
            onClick={() => {
              setErrorMsg("");
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Periode Baru</span>
          </button>
        </div>

        {/* Notifikasi Pesan */}
        {actionMsg && (
          <div className="p-3.5 rounded bg-success-light border border-success/20 text-xs text-success flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded bg-danger-light border border-danger/20 text-xs text-danger flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Pemilihan Periode & Action Bar */}
        <div className="bg-surface border border-border rounded p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Pilih Periode:</span>
            <select
              value={selectedPeriod?.id || ""}
              onChange={(e) => {
                const found = periods.find((p) => p.id === e.target.value);
                setSelectedPeriod(found);
              }}
              className="py-1.5 px-3 border border-border rounded text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.startDate} s/d {p.endDate}) - [{p.status}]
                </option>
              ))}
            </select>

            <span
              className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                isFinalized
                  ? "bg-success-light text-success border border-success/30"
                  : "bg-warning-light text-warning border border-warning/30"
              }`}
            >
              {isFinalized ? "Telah Difinalisasi" : "Draft (Bisa Diedit)"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isFinalized && (
              <>
                <button
                  onClick={handleGeneratePayroll}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{records.length > 0 ? "Hitung Ulang" : "Generate Perhitungan"}</span>
                </button>
                {records.length > 0 && (
                  <button
                    onClick={handleFinalizePeriod}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success text-white text-xs font-medium rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Finalisasi Periode</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Ringkasan Total Penggajian */}
        {selectedPeriod && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded p-4">
              <div className="text-secondary text-xs">Total Karyawan Dihitung</div>
              <div className="text-xl font-bold text-slate-800 mt-1">
                {records.length} Orang
              </div>
            </div>
            <div className="bg-surface border border-border rounded p-4">
              <div className="text-secondary text-xs">Total Pengeluaran Gaji Bersih</div>
              <div className="text-xl font-bold text-primary mt-1 font-mono">
                Rp {totalPayroll.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="bg-surface border border-border rounded p-4">
              <div className="text-secondary text-xs">Status Slip Gaji</div>
              <div className="text-xs font-semibold text-slate-700 mt-2">
                {isFinalized
                  ? "Sudah Terbit & Dapat Diunduh Karyawan"
                  : "Belum Dirilis (Menunggu Finalisasi HR)"}
              </div>
            </div>
          </div>
        )}

        {/* Tabel Rincian Penggajian */}
        <div className="bg-surface border border-border rounded overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-secondary">
              Memuat data penggajian...
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              Belum ada data perhitungan untuk periode ini. Klik <strong>"Generate Perhitungan"</strong> untuk memulai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                  <tr>
                    <th className="py-3 px-4">Karyawan</th>
                    <th className="py-3 px-4">Departemen</th>
                    <th className="py-3 px-4 text-right">Gaji Pokok</th>
                    <th className="py-3 px-4 text-right">Tunjangan</th>
                    <th className="py-3 px-4 text-right">Uang Lembur</th>
                    <th className="py-3 px-4 text-right">Potongan</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">
                      Gaji Bersih (Net)
                    </th>
                    <th className="py-3 px-4">Catatan</th>
                    {!isFinalized && (
                      <th className="py-3 px-4 text-center">Aksi Penyesuaian</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-800">
                  {records.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {rec.employee?.fullName}
                        </div>
                        <div className="text-[11px] text-secondary">
                          {rec.employee?.employeeCode} • {rec.employee?.position?.title}
                        </div>
                      </td>
                      <td className="py-3 px-4">{rec.employee?.department?.name}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        Rp {rec.basicSalary?.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        Rp {rec.allowance?.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        Rp {rec.overtimePay?.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-danger">
                        {rec.deduction > 0
                          ? `- Rp ${rec.deduction?.toLocaleString("id-ID")}`
                          : "Rp 0"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                        Rp {rec.netSalary?.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-secondary max-w-xs truncate">
                        {rec.notes || "-"}
                      </td>
                      {!isFinalized && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenEditRecord(rec)}
                            className="p-1 text-secondary hover:text-primary rounded hover:bg-slate-100"
                            title="Edit Komponen Gaji"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Buat Periode Baru */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-sm font-bold text-primary">
                  Buat Periode Penggajian Baru
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePeriod} className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Periode *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Desember 2026"
                    value={newPeriodName}
                    onChange={(e) => setNewPeriodName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
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
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
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
                    {submitting ? "Menyimpan..." : "Simpan Periode"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Komponen Gaji Karyawan */}
        {editingRecord && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-primary">
                    Penyesuaian Komponen Gaji
                  </h2>
                  <div className="text-[11px] text-secondary">
                    {editingRecord.employee?.fullName} ({editingRecord.employee?.employeeCode})
                  </div>
                </div>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditRecord} className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 border border-border rounded">
                  <span className="text-secondary">Gaji Pokok:</span>{" "}
                  <span className="font-mono font-bold text-slate-800">
                    Rp {editingRecord.basicSalary?.toLocaleString("id-ID")}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tunjangan Tambahan (Rp)
                  </label>
                  <input
                    type="number"
                    value={allowance}
                    onChange={(e) => setAllowance(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-border rounded font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Uang Lembur (Rp)
                  </label>
                  <input
                    type="number"
                    value={overtimePay}
                    onChange={(e) => setOvertimePay(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-border rounded font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Potongan (Rp)
                  </label>
                  <input
                    type="number"
                    value={deduction}
                    onChange={(e) => setDeduction(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-border rounded font-mono focus:outline-none focus:ring-1 focus:ring-primary text-danger"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Rincian
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Bonus performa / penyesuaian"
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="p-2.5 bg-primary-light rounded border border-primary/20 text-xs text-primary font-medium flex justify-between items-center">
                  <span>Estimasi Gaji Bersih (Net):</span>
                  <span className="font-mono font-bold text-sm">
                    Rp{" "}
                    {(
                      editingRecord.basicSalary +
                      allowance +
                      overtimePay -
                      deduction
                    ).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditingRecord(null)}
                    className="px-3 py-1.5 border border-border rounded text-secondary hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-primary-hover disabled:opacity-50"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Penyesuaian"}
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
