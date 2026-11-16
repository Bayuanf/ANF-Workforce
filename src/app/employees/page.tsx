"use client";

import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Users,
  Search,
  Plus,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    employeeCode: "",
    fullName: "",
    email: "",
    phone: "",
    departmentId: "",
    positionId: "",
    managerId: "",
    joinDate: new Date().toISOString().split("T")[0],
    basicSalary: 0,
    username: "",
    password: "",
    role: "EMPLOYEE",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      let url = `/api/employees?search=${encodeURIComponent(search)}`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      const res = await fetch(url);
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch {}
  };

useEffect(() => {
  const initializePage = async () => {
    try {
      const userRes = await fetch("/api/auth/me");
      const userData = await userRes.json();

      setCurrentUser(userData.user);

      // Akun DEMO tidak boleh mengambil data karyawan/departemen.
      if (userData.user?.role === "DEMO") {
        setLoading(false);
        return;
      }

      // Pengguna selain DEMO tetap menjalankan alur normal.
      const deptRes = await fetch("/api/departments");
      const deptData = await deptRes.json();

      setDepartments(deptData.departments || []);

      await fetchEmployees();
    } catch (error) {
      console.error("Gagal menginisialisasi halaman karyawan:", error);
    } finally {
      setLoading(false);
    }
  };

  initializePage();
}, []);

  useEffect(() => {
  if (!loading && currentUser?.role !== "DEMO") {
    fetchEmployees();
  }
}, [search, selectedDept, loading, currentUser]);

  // Posisi yang tersedia berdasarkan departemen yang dipilih
  const availablePositions =
    departments.find((d) => d.id === formData.departmentId)?.positions || [];

  const handleOpenAdd = () => {
    setFormData({
      employeeCode: "",
      fullName: "",
      email: "",
      phone: "",
      departmentId: departments[0]?.id || "",
      positionId: departments[0]?.positions[0]?.id || "",
      managerId: "",
      joinDate: new Date().toISOString().split("T")[0],
      basicSalary: 6000000,
      username: "",
      password: "",
      role: "EMPLOYEE",
    });
    setFormError("");
    setFormSuccess("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (emp: any) => {
    setSelectedEmp(emp);
    setFormData({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone || "",
      departmentId: emp.departmentId,
      positionId: emp.positionId,
      managerId: emp.managerId || "",
      joinDate: emp.joinDate.split("T")[0],
      basicSalary: emp.basicSalary || 0,
      username: emp.user?.username || "",
      password: "",
      role: emp.user?.role || "EMPLOYEE",
    });
    setFormError("");
    setFormSuccess("");
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Gagal menambahkan karyawan.");
        setSubmitting(false);
        return;
      }

      setFormSuccess("Karyawan baru berhasil ditambahkan!");
      fetchEmployees();
      setTimeout(() => {
        setShowAddModal(false);
      }, 1000);
    } catch {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/employees/${selectedEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          departmentId: formData.departmentId,
          positionId: formData.positionId,
          managerId: formData.managerId || null,
          basicSalary: formData.basicSalary,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Gagal memperbarui data karyawan.");
        setSubmitting(false);
        return;
      }

      setFormSuccess("Data karyawan berhasil diperbarui!");
      fetchEmployees();
      setTimeout(() => {
        setShowEditModal(false);
      }, 1000);
    } catch {
      setFormError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };
  const isHr = currentUser?.role === "HR";

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-secondary">Memuat halaman...</p>
        </div>
      </AppLayout>
    );
  }

  if (currentUser?.role === "DEMO") {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-amber-600" />
            </div>

            <h1 className="text-xl font-bold text-primary mb-2">
              Akses Fitur Dibatasi
            </h1>

            <p className="text-sm text-secondary leading-relaxed mb-5">
              Fitur Data Karyawan tidak tersedia untuk akun DEMO.
              Silakan gunakan Dashboard untuk melihat simulasi ANF Workforce.
            </p>

            <span className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              DEMO · READ ONLY
            </span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (

    <AppLayout>
      <div className="space-y-6">
        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-primary">
              Data Karyawan
            </h1>
            <p className="text-xs text-secondary mt-0.5">
              {isHr
                ? "Kelola data kepegawaian, jabatan, departemen, dan hak akses pengguna."
                : "Informasi data anggota kepegawaian."}
            </p>
          </div>

          {isHr && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-medium rounded hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Karyawan</span>
            </button>
          )}
        </div>

        {/* Filter & Pencarian */}
        <div className="bg-surface border border-border rounded p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, kode (ANF-...), atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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

        {/* Tabel Data Karyawan (Responsif) */}
        <div className="bg-surface border border-border rounded overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-secondary">
              Memuat data karyawan...
            </div>
          ) : employees.length === 0 ? (
            <div className="py-12 text-center text-xs text-secondary">
              Tidak ada data karyawan yang ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-border text-secondary font-semibold">
                  <tr>
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Departemen</th>
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4">Atasan (Manager)</th>
                    {isHr && <th className="py-3 px-4 text-right">Gaji Pokok</th>}
                    <th className="py-3 px-4 text-center">Status</th>
                    {isHr && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-800">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {emp.employeeCode}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-[11px] text-secondary">{emp.email}</div>
                      </td>
                      <td className="py-3 px-4">{emp.department?.name || "-"}</td>
                      <td className="py-3 px-4">{emp.position?.title || "-"}</td>
                      <td className="py-3 px-4">
                        {emp.manager?.employee?.fullName || emp.manager?.username || "-"}
                      </td>
                      {isHr && (
                        <td className="py-3 px-4 text-right font-mono">
                          Rp {emp.basicSalary?.toLocaleString("id-ID") || 0}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded ${
                            emp.status === "ACTIVE"
                              ? "bg-success-light text-success border border-success/20"
                              : "bg-danger-light text-danger border border-danger/20"
                          }`}
                        >
                          {emp.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      {isHr && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-1 text-secondary hover:text-primary rounded hover:bg-slate-100"
                            title="Edit Data"
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

        {/* Modal Tambah Karyawan */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-sm font-bold text-primary">
                  Tambah Karyawan Baru
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 text-xs">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Kode Karyawan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ANF-005"
                      value={formData.employeeCode}
                      onChange={(e) =>
                        setFormData({ ...formData, employeeCode: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Pegawai"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="pegawai@anfgroup.co.id"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      placeholder="08123456789"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Departemen *
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        const dept = departments.find((d) => d.id === deptId);
                        setFormData({
                          ...formData,
                          departmentId: deptId,
                          positionId: dept?.positions[0]?.id || "",
                        });
                      }}
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Jabatan / Posisi *
                    </label>
                    <select
                      value={formData.positionId}
                      onChange={(e) =>
                        setFormData({ ...formData, positionId: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availablePositions.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Gaji Pokok (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.basicSalary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          basicSalary: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Role Pengguna
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="EMPLOYEE">Karyawan</option>
                      <option value="MANAGER">Manager</option>
                      <option value="HR">HR / Admin</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-border rounded space-y-2 mt-2">
                  <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                    Akun Login Pengguna
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="username_login"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 border border-border rounded text-secondary hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-primary-hover disabled:opacity-50"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Karyawan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Edit Karyawan */}
        {showEditModal && selectedEmp && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
            <div className="bg-surface rounded border border-border shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-sm font-bold text-primary">
                  Perbarui Data Karyawan ({selectedEmp.employeeCode})
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-secondary hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-3 text-xs">
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
                  <label className="block font-medium text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Gaji Pokok (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.basicSalary}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          basicSalary: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Departemen
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => {
                        const deptId = e.target.value;
                        const dept = departments.find((d) => d.id === deptId);
                        setFormData({
                          ...formData,
                          departmentId: deptId,
                          positionId: dept?.positions[0]?.id || "",
                        });
                      }}
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Jabatan / Posisi
                    </label>
                    <select
                      value={formData.positionId}
                      onChange={(e) =>
                        setFormData({ ...formData, positionId: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availablePositions.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-3 py-1.5 border border-border rounded text-secondary hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 bg-primary text-white rounded font-medium hover:bg-primary-hover disabled:opacity-50"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Perubahan"}
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
