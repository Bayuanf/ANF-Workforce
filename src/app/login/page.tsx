
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Eye as DemoEye,
} from "lucide-react";
import BrandLogo from "@/components/common/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const login = async (loginUsername: string, loginPassword: string) => {
    setError("");
    setLoading(true);
    setDemoLoading(loginUsername === "demo");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal melakukan autentikasi.");
        setLoading(false);
        setDemoLoading(false);
        return;
      }

      if (typeof window !== "undefined" && data.user) {
        try {
          sessionStorage.setItem("anf_user", JSON.stringify(data.user));
        } catch {}
      }

      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan jaringan atau server.");
      setLoading(false);
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleDemoLogin = async () => {
    await login("demo", "DemoANF2026!");
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F1F5F9] font-sans">
      {/* SISI KIRI */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-5/12 bg-[#27364B] flex-col justify-between p-10 xl:p-14 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg
            className="w-full h-full"
            viewBox="0 0 600 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="anf-grid"
                width="36"
                height="36"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 36 0 L 0 0 0 36"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#anf-grid)" />

            <g
              className="animate-float-subtle"
              stroke="rgba(255, 255, 255, 0.14)"
              strokeWidth="1.5"
            >
              <polygon
                points="120,100 360,100 440,240 200,240"
                fill="rgba(255,255,255,0.02)"
              />
              <polygon
                points="200,240 440,240 380,440 140,440"
                fill="rgba(255,255,255,0.015)"
              />
              <polygon
                points="140,440 380,440 300,640 60,640"
                fill="rgba(255,255,255,0.02)"
              />
              <line x1="360" y1="100" x2="500" y2="340" strokeDasharray="4 4" />
              <line x1="120" y1="100" x2="260" y2="540" strokeDasharray="4 4" />

              <circle cx="440" cy="240" r="3.5" fill="rgba(255,255,255,0.5)" className="animate-pulse-soft" />
              <circle cx="380" cy="440" r="3.5" fill="rgba(255,255,255,0.5)" className="animate-pulse-soft-delayed" />
              <circle cx="300" cy="640" r="3.5" fill="rgba(255,255,255,0.5)" className="animate-pulse-soft" />
            </g>

            <g className="animate-rotate-slow">
              <circle cx="550" cy="700" r="200" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
              <circle cx="550" cy="700" r="280" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </g>
          </svg>
        </div>

        <div className="absolute -top-24 -left-24 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl pointer-events-none animate-ambient-drift" />

        <div></div>

        <div className="relative z-10 my-auto py-12 max-w-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            PT ANF GROUP
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
            ANF Workforce
          </h1>
          <p className="mt-3 text-sm xl:text-base text-slate-200 font-normal leading-relaxed">
            Human Resource Management System
          </p>
          <div className="mt-6 w-12 h-0.5 bg-slate-400/40"></div>
        </div>

        <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-400">
          © 2026 PT ANF Group. Hak Cipta Dilindungi.
        </div>
      </div>

      {/* SISI KANAN */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 bg-[#F8FAFC]">
        <div className="lg:hidden w-full max-w-sm mb-6 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            PT ANF GROUP
          </div>
          <div className="text-lg font-bold text-[#27364B] leading-tight mt-0.5">
            ANF Workforce
          </div>
          <div className="text-[11px] text-[#64748B]">
            Human Resource Management System
          </div>
        </div>

        <div className="w-full max-w-sm sm:max-w-md bg-white border border-[#E2E8F0] rounded-lg shadow-[0_4px_24px_-4px_rgba(39,54,75,0.06)] p-7 sm:p-9 transition-all">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-[#27364B] tracking-tight">
              Masuk ke Akun Anda
            </h2>
            <p className="mt-1 text-xs text-[#64748B] leading-relaxed">
              Masukkan kredensial pengguna Anda untuk mengakses sistem.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username atau Email
              </label>
              <div className="relative rounded">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email"
                  className="block w-full pl-9 pr-3 py-2.5 border border-[#CBD5E1] rounded text-xs bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#27364B] focus:border-[#27364B] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
              </div>
              <div className="relative rounded">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Anda"
                  className="block w-full pl-9 pr-10 py-2.5 border border-[#CBD5E1] rounded text-xs bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#27364B] focus:border-[#27364B] transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded text-xs font-semibold text-white bg-[#27364B] hover:bg-[#1E293B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#27364B] transition-colors disabled:opacity-60 shadow-sm min-h-[42px] cursor-pointer"
              >
                {loading && !demoLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AKSES DEMO */}
          <div className="mt-5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-4">
            <div className="text-center">
              <p className="text-xs font-semibold text-[#27364B]">
                Ingin mencoba ANF Workforce?
              </p>
              <p className="mt-1 text-[11px] text-[#64748B] leading-relaxed">
                Jelajahi fitur sistem menggunakan akun demonstrasi tanpa perlu mendaftar.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="mt-3 w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded text-xs font-semibold text-[#27364B] bg-white border border-[#CBD5E1] hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#27364B] transition-colors disabled:opacity-60 min-h-[42px] cursor-pointer"
            >
              {demoLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#27364B] border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyiapkan akun DEMO...</span>
                </>
              ) : (
                <>
                  <DemoEye className="w-4 h-4" />
                  <span>Coba Akun DEMO</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <p className="mt-2 text-center text-[10px] text-[#64748B]">
              Akses demonstrasi · Read-only
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#F1F5F9] text-center">
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Akses sistem terbatas untuk personel berwenang PT ANF Group.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-[11px] text-[#64748B]">
          © 2026 PT ANF Group. Hak Cipta Dilindungi.
        </div>
      </div>
    </div>
  );
}
