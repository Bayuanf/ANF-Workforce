"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Banknote,
  Printer,
  Download,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function PayslipPage() {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [selectedSlip, setSelectedSlip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payroll/payslip")
      .then((r) => r.json())
      .then((data) => {
        const list = data.payslips || [];
        setPayslips(list);
        if (list.length > 0) {
          setSelectedSlip(list[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header (Disembunyikan saat dicetak) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary">
              Slip Gaji Karyawan
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              Rincian penghasilan resmi yang diterbitkan oleh HR PT ANF Group.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {payslips.length > 0 && (
              <>
                <select
                  value={selectedSlip?.id || ""}
                  onChange={(e) => {
                    const found = payslips.find((p) => p.id === e.target.value);
                    setSelectedSlip(found);
                  }}
                  className="py-1.5 px-3 border border-border rounded text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {payslips.map((s) => (
                    <option key={s.id} value={s.id}>
                      Periode: {s.payrollPeriod?.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Konten Slip Gaji */}
        {loading ? (
          <div className="py-12 text-center text-xs text-secondary bg-surface border border-border rounded">
            Memuat dokumen slip gaji...
          </div>
        ) : !selectedSlip ? (
          <div className="py-12 text-center text-xs text-secondary bg-surface border border-border rounded p-6">
            <AlertCircle className="w-8 h-8 text-secondary mx-auto mb-2 opacity-50" />
            <div className="font-semibold text-slate-700">
              Belum ada slip gaji yang diterbitkan.
            </div>
            <p className="mt-1 text-[11px] text-secondary">
              Slip gaji akan muncul secara otomatis setelah periode penggajian difinalisasi oleh HR.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded p-8 max-w-3xl mx-auto shadow-sm print:border-none print:shadow-none print:p-0">
            {/* Kop Surat PT ANF Group */}
            <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-primary text-white flex items-center justify-center font-bold text-xs tracking-wider">
                    ANF
                  </div>
                  <span className="text-base font-bold text-primary tracking-tight">
                    PT ANF GROUP
                  </span>
                </div>
                <div className="text-[11px] text-secondary mt-1">
                  Gedung Menara ANF Lt. 8, Kawasan Bisnis Terpadu, Jakarta
                </div>
                <div className="text-[10px] text-secondary">
                  Telepon: (021) 555-0199 • Email: hrd@anfgroup.co.id
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  SLIP GAJI KARYAWAN
                </div>
                <div className="text-xs text-secondary font-medium mt-0.5">
                  Periode: {selectedSlip.payrollPeriod?.name}
                </div>
                <div className="text-[10px] text-secondary">
                  Status: DIVERIFIKASI RESMI
                </div>
              </div>
            </div>

            {/* Biodata Karyawan */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-border text-xs">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-28 text-secondary">Kode Karyawan</span>
                  <span className="font-mono font-bold text-slate-800">
                    : {selectedSlip.employee?.employeeCode}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-secondary">Nama Lengkap</span>
                  <span className="font-semibold text-slate-900">
                    : {selectedSlip.employee?.fullName}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-secondary">Email</span>
                  <span className="text-slate-700">: {selectedSlip.employee?.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex">
                  <span className="w-28 text-secondary">Departemen</span>
                  <span className="font-semibold text-slate-800">
                    : {selectedSlip.employee?.department?.name}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-secondary">Jabatan / Posisi</span>
                  <span className="text-slate-700">
                    : {selectedSlip.employee?.position?.title}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-28 text-secondary">Tanggal Bergabung</span>
                  <span className="text-slate-700 font-mono">
                    : {new Date(selectedSlip.employee?.joinDate).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabel Rincian Penerimaan & Potongan */}
            <div className="grid grid-cols-2 gap-6 py-5 text-xs">
              {/* Kolom Penerimaan */}
              <div>
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-300">
                  A. Penerimaan (Penghasilan)
                </div>
                <div className="divide-y divide-border/60 mt-2">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-700">Gaji Pokok</span>
                    <span className="font-mono font-medium text-slate-900">
                      Rp {selectedSlip.basicSalary?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-700">Tunjangan</span>
                    <span className="font-mono font-medium text-slate-900">
                      Rp {selectedSlip.allowance?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-700">Uang Lembur</span>
                    <span className="font-mono font-medium text-slate-900">
                      Rp {selectedSlip.overtimePay?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                <div className="pt-3 mt-2 border-t border-slate-300 flex justify-between font-bold text-slate-900">
                  <span>Total Penerimaan</span>
                  <span className="font-mono">
                    Rp{" "}
                    {(
                      selectedSlip.basicSalary +
                      selectedSlip.allowance +
                      selectedSlip.overtimePay
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Kolom Potongan */}
              <div>
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1.5 border-b border-slate-300">
                  B. Potongan
                </div>
                <div className="divide-y divide-border/60 mt-2">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-700">Potongan Penyesuaian</span>
                    <span className="font-mono font-medium text-danger">
                      Rp {selectedSlip.deduction?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between text-secondary">
                    <span>Potongan Keterlambatan</span>
                    <span className="font-mono">Rp 0 (Sesuai PRD)</span>
                  </div>
                </div>
                <div className="pt-3 mt-2 border-t border-slate-300 flex justify-between font-bold text-slate-900">
                  <span>Total Potongan</span>
                  <span className="font-mono text-danger">
                    Rp {selectedSlip.deduction?.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Gaji Bersih (Take Home Pay) */}
            <div className="p-4 bg-[#F8FAFC] border border-border rounded flex justify-between items-center text-sm font-bold mt-2">
              <span className="text-slate-900 uppercase tracking-wider">
                GAJI BERSIH DITERIMA (TAKE HOME PAY)
              </span>
              <span className="font-mono text-base text-primary">
                Rp {selectedSlip.netSalary?.toLocaleString("id-ID")}
              </span>
            </div>

            {selectedSlip.notes && (
              <div className="mt-3 text-[11px] text-secondary italic">
                Catatan: {selectedSlip.notes}
              </div>
            )}

            {/* Tanda Tangan */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-border text-center text-xs">
              <div>
                <div className="text-secondary text-[11px]">Diterima oleh,</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-900 underline">
                  {selectedSlip.employee?.fullName}
                </div>
                <div className="text-[10px] text-secondary">Karyawan</div>
              </div>

              <div>
                <div className="text-secondary text-[11px]">Disahkan oleh,</div>
                <div className="h-16"></div>
                <div className="font-semibold text-slate-900 underline">
                  Departemen HR & Payroll
                </div>
                <div className="text-[10px] text-secondary">PT ANF Group</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
