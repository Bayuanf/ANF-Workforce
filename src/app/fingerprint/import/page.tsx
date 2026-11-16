"use client";

import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function FingerprintImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setErrorMsg("");
      setSuccessMsg("");
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Harap pilih file CSV atau Excel terlebih dahulu.");
      return;
    }

    setValidating(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/fingerprint/validate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memvalidasi file.");
        setValidating(false);
        return;
      }

      setValidationResult(data);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat memvalidasi file.");
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult) return;
    setConfirming(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/fingerprint/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: validationResult.fileName,
          rows: validationResult.rows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal menyimpan data import.");
        setConfirming(false);
        return;
      }

      setSuccessMsg(
        `Sukses! ${data.summary.validProcessed} data pemindaian diproses. Terdeteksi ${data.summary.lateDetected} keterlambatan dan ${data.summary.incompleteDetected} data tidak lengkap (1 scan) yang masuk ke antrean pemeriksaan HR.`
      );
      setValidationResult(null);
      setFile(null);
    } catch {
      setErrorMsg("Terjadi kesalahan saat mengonfirmasi import.");
    } finally {
      setConfirming(false);
    }
  };

  // Unduh contoh template CSV
  const handleDownloadSample = () => {
    const csvContent =
      "employee_code,date,scan_time\nANF-001,2026-11-16,07:55:00\nANF-001,2026-11-16,17:05:00\nANF-002,2026-11-16,08:15:00\nANF-002,2026-11-16,17:10:00\nANF-003,2026-11-16,08:05:00\nANF-003,2026-11-16,17:00:00\nANF-004,2026-11-16,08:25:00\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "template_fingerprint_anf.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary">
              Import Data Fingerprint
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Simulasi import file data mentah mesin absensi (format CSV atau Excel .xlsx).
            </p>
          </div>

          <button
            onClick={handleDownloadSample}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-border bg-white text-xs font-medium text-slate-700 rounded hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-secondary" />
            <span>Unduh Contoh File (CSV)</span>
          </button>
        </div>

        {/* Notifikasi Pesan */}
        {errorMsg && (
          <div className="p-3.5 rounded bg-danger-light border border-danger/20 text-xs text-danger flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded bg-success-light border border-success/20 text-xs text-success flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Upload & Validasi */}
        <div className="bg-surface border border-border rounded p-6">
          <form onSubmit={handleValidate} className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <UploadCloud className="w-8 h-8 mx-auto text-secondary mb-2" />
              <div className="text-xs font-medium text-slate-800">
                Pilih atau Seret File Fingerprint (.csv / .xlsx)
              </div>
              <p className="text-[11px] text-secondary mt-0.5 mb-3">
                Format kolom yang didukung: <code className="bg-slate-100 px-1 py-0.5 rounded">employee_code</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">date</code> (YYYY-MM-DD), <code className="bg-slate-100 px-1 py-0.5 rounded">scan_time</code> (HH:mm:ss)
              </p>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="text-xs text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-white hover:file:bg-primary-hover file:cursor-pointer"
              />
              {file && (
                <div className="mt-3 text-xs font-semibold text-primary flex items-center justify-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>File terpilih: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!file || validating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                {validating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memvalidasi Struktur & Data...</span>
                  </>
                ) : (
                  <>
                    <span>Validasi Data</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Ringkasan Hasil Validasi (PRD 7.1) */}
        {validationResult && (
          <div className="space-y-5">
            <div className="bg-surface border border-border rounded p-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h2 className="text-sm font-bold text-primary">
                    Ringkasan Hasil Validasi File: {validationResult.fileName}
                  </h2>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Periksa ringkasan baris data sebelum mengonfirmasi penyimpanan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={confirming || validationResult.validRows === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-success text-white text-xs font-medium rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {confirming ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Konfirmasi & Simpan ({validationResult.validRows} Data Valid)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Stat Cards Validasi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3 bg-slate-50 border border-border rounded">
                  <div className="text-[11px] font-medium text-secondary">Total Baris</div>
                  <div className="text-lg font-bold text-slate-800 mt-1">
                    {validationResult.totalRows}
                  </div>
                </div>
                <div className="p-3 bg-success-light border border-success/30 rounded">
                  <div className="text-[11px] font-medium text-success">Baris Valid</div>
                  <div className="text-lg font-bold text-success mt-1">
                    {validationResult.validRows}
                  </div>
                </div>
                <div className="p-3 bg-danger-light border border-danger/30 rounded">
                  <div className="text-[11px] font-medium text-danger">Tidak Valid (Error)</div>
                  <div className="text-lg font-bold text-danger mt-1">
                    {validationResult.invalidRows}
                  </div>
                </div>
                <div className="p-3 bg-warning-light border border-warning/30 rounded">
                  <div className="text-[11px] font-medium text-warning">Duplikat</div>
                  <div className="text-lg font-bold text-warning mt-1">
                    {validationResult.duplicateRows}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabel Pratinjau Baris Data */}
            <div className="bg-surface border border-border rounded overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-[#F8FAFC]">
                <h3 className="text-xs font-semibold text-slate-800">
                  Detail Pratinjau Baris Data
                </h3>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Kode Karyawan</th>
                      <th className="py-2.5 px-3">Nama Terdaftar</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Waktu Scan</th>
                      <th className="py-2.5 px-3 text-center">Status Validasi</th>
                      <th className="py-2.5 px-3">Keterangan / Kesalahan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-slate-800">
                    {validationResult.rows.map((row: any, idx: number) => (
                      <tr
                        key={idx}
                        className={
                          row.status === "INVALID"
                            ? "bg-danger-light/30"
                            : row.status === "DUPLICATE"
                            ? "bg-warning-light/30"
                            : "hover:bg-slate-50"
                        }
                      >
                        <td className="py-2 px-3 text-secondary">{row.rowNumber}</td>
                        <td className="py-2 px-3 font-mono font-medium">
                          {row.employeeCode}
                        </td>
                        <td className="py-2 px-3">{row.employeeName}</td>
                        <td className="py-2 px-3">{row.date}</td>
                        <td className="py-2 px-3 font-mono">{row.scanTime}</td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded ${
                              row.status === "VALID"
                                ? "bg-success-light text-success border border-success/30"
                                : row.status === "DUPLICATE"
                                ? "bg-warning-light text-warning border border-warning/30"
                                : "bg-danger-light text-danger border border-danger/30"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">
                          {row.error || "Data siap diproses"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
