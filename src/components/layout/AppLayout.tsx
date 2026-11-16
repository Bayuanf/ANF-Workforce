"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/common/BrandLogo";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  UploadCloud,
  ClockAlert,
  CalendarDays,
  Timer,
  Banknote,
  FileBarChart,
  History,
  Menu,
  X,
  LogOut,
  Building2,
  UserCheck,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Client-side session cache agar navigasi antar halaman berlangsung instan (0 detik) tanpa blocking loading
let memoryUserCache: any = null;

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Inisialisasi langsung dari cache jika tersedia
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (memoryUserCache) return memoryUserCache;
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("anf_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          memoryUserCache = parsed;
          return parsed;
        }
      } catch {}
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return !memoryUserCache && (typeof window === "undefined" || !sessionStorage.getItem("anf_user"));
  });

  useEffect(() => {
    // Verifikasi sesi di background tanpa memblokir layar jika user sudah ada
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          memoryUserCache = null;
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("anf_user");
          }
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.user) {
          memoryUserCache = data.user;
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("anf_user", JSON.stringify(data.user));
            } catch {}
          }
          setCurrentUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!memoryUserCache) {
          router.push("/login");
        }
      });
  }, [router]);

  const handleLogout = async () => {
    memoryUserCache = null;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("anf_user");
      } catch {}
    }
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-secondary text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span>Memuat sesi sistem...</span>
        </div>
      </div>
    );
  }

  // Tentukan menu navigasi sesuai PRD Bagian 10
  const getNavItems = () => {
    if (!currentUser) return [];

    if (currentUser.role === "HR") {
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Data Karyawan", href: "/employees", icon: Users },
        { label: "Kehadiran", href: "/attendance", icon: CalendarCheck },
        { label: "Import Fingerprint", href: "/fingerprint/import", icon: UploadCloud },
        { label: "Pemeriksaan Keterlambatan", href: "/lateness-reviews", icon: ClockAlert },
        { label: "Pengajuan Cuti & Izin", href: "/leave-requests", icon: CalendarDays },
        { label: "Lembur", href: "/overtime", icon: Timer },
        { label: "Penggajian", href: "/payroll", icon: Banknote },
        { label: "Laporan", href: "/reports", icon: FileBarChart },
        { label: "Audit Log", href: "/audit-logs", icon: History },
      ];
    }

    if (currentUser.role === "MANAGER") {
      return [
        { label: "Dashboard Tim", href: "/dashboard", icon: LayoutDashboard },
        { label: "Kehadiran Tim", href: "/attendance", icon: CalendarCheck },
        { label: "Persetujuan Cuti & Izin", href: "/leave-requests", icon: CalendarDays },
        { label: "Persetujuan Lembur", href: "/overtime", icon: Timer },
        { label: "Laporan Tim", href: "/reports", icon: FileBarChart },
      ];
    }

    // Role EMPLOYEE
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Kehadiran Saya", href: "/attendance", icon: CalendarCheck },
      { label: "Pengajuan Cuti & Izin", href: "/leave-requests", icon: CalendarDays },
      { label: "Pengajuan Lembur", href: "/overtime", icon: Timer },
      { label: "Slip Gaji", href: "/payroll/payslip", icon: Banknote },
    ];
  };

  const navItems = getNavItems();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "HR":
        return "bg-primary text-white";
      case "MANAGER":
        return "bg-[#334155] text-white";
      default:
        return "bg-secondary-light text-secondary";
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div>
              <div className="text-sm font-semibold text-primary leading-tight">
                ANF Workforce
              </div>
              <div className="text-[11px] text-secondary">PT ANF Group</div>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1 text-secondary hover:text-primary"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-secondary uppercase tracking-wider">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-white font-medium shadow-sm"
                    : "text-secondary hover:text-primary hover:bg-[#F1F5F9]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-secondary"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Card & Logout at Sidebar Footer */}
        <div className="p-4 border-t border-border bg-[#FAFAFC]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-primary flex items-center justify-center font-medium text-xs">
              {currentUser?.fullName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {currentUser?.fullName}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded tracking-wide ${getRoleBadge(
                    currentUser?.role
                  )}`}
                >
                  {currentUser?.role === "HR"
                    ? "HR / ADMIN"
                    : currentUser?.role === "MANAGER"
                    ? "MANAGER"
                    : "KARYAWAN"}
                </span>
                {currentUser?.departmentName && (
                  <span className="text-[10px] text-secondary truncate">
                    • {currentUser.departmentName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-border rounded text-xs text-secondary hover:text-danger hover:border-danger hover:bg-danger-light transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded text-secondary hover:text-primary hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block text-xs text-secondary">
              Sistem Informasi Pengelolaan Sumber Daya Manusia
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-slate-700">
                {currentUser?.fullName}
              </div>
              <div className="text-[11px] text-secondary">
                {currentUser?.employeeCode ? `ID: ${currentUser.employeeCode}` : currentUser?.email}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-semibold">
              <UserCheck className="w-4 h-4 text-primary" />
            </div>
          </div>
        </header>

        {/* Dynamic Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
