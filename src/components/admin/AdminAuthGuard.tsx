"use client";

import React, { useState } from "react";
import { Lock, KeyRound, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface AdminAuthGuardProps {
  isAuthenticated: boolean;
  onLogin: (password: string) => boolean;
  children: React.ReactNode;
}

export function AdminAuthGuard({
  isAuthenticated,
  onLogin,
  children,
}: AdminAuthGuardProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu quản trị");
      return;
    }
    const success = onLogin(password);
    if (!success) {
      setError("Mật khẩu không chính xác. Vui lòng thử lại!");
    } else {
      setError("");
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      {/* Background Subtle Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415518_1px,transparent_1px),linear-gradient(to_bottom,#33415518_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Floating Glass Auth Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lonking-500 text-slate-950 mb-4 shadow-lg shadow-lonking-500/20">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase">
            Xác Thực Quản Trị Kho
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Hệ thống Quản lý Vật tư Phụ Tùng Lonking & Cơ Giới Miền Nam
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Mật khẩu quản trị
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Nhập mật khẩu (Mặc định: admin123)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-lonking-500 focus:outline-none focus:ring-1 focus:ring-lonking-500 font-mono"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-400">
                <ShieldAlert className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl btn-lonking py-2.5 text-sm font-bold text-slate-950 shadow-md touch-target sm:min-h-0"
          >
            Đăng Nhập Vào Bảng Điều Khiển
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center flex items-center justify-between text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Về trang tra cứu
          </Link>
          <span className="font-mono text-[11px] text-slate-500">Mật khẩu: admin123</span>
        </div>
      </div>
    </div>
  );
}
