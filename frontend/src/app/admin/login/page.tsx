'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { tokenService } from '@/lib/token';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/auth';

function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already authenticated as ADMIN
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'ADMIN') {
      const redirectUrl = searchParams.get('redirect') || '/admin/storage-nodes';
      router.replace(redirectUrl);
    }
  }, [isLoading, isAuthenticated, user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ username: username.trim(), password });

      const currentUser = tokenService.getUser();
      if (currentUser?.role !== 'ADMIN') {
        tokenService.clearTokens();
        setErrorMsg('Tài khoản không có quyền truy cập Staff Portal. Vui lòng liên hệ Quản trị viên.');
        return;
      }

      const redirectUrl = searchParams.get('redirect') || '/admin/storage-nodes';
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as ApiErrorResponse;
        if (Array.isArray(data.message)) {
          setErrorMsg(data.message.join(', '));
        } else if (data.message) {
          setErrorMsg(data.message);
        } else {
          setErrorMsg('Tên đăng nhập hoặc mật khẩu quản trị không chính xác.');
        }
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#141414] px-4 py-12 text-[#ececec]">
      <div className="w-full max-w-md rounded-2xl border border-[#525252] bg-[#2d2d2d] p-8 shadow-2xl shadow-black/60">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9bf73c]/30 bg-[#9bf73c]/10 px-3 py-1 text-xs font-semibold text-[#9bf73c] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9bf73c] animate-pulse" />
            Staff / Operations Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#ececec]">
            MyCast Staff Portal
          </h1>
          <p className="mt-1.5 text-xs text-[#8a8a8a]">
            Cổng quản trị hệ thống và điều hành hạ tầng lưu trữ.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-[#ff5c5c] bg-[#ff5c5c]/10 p-3 text-xs text-[#ff5c5c]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-username"
              className="block text-xs font-medium text-[#ececec] mb-1.5"
            >
              Tên tài khoản quản trị
            </label>
            <input
              id="admin-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@mycast.vn"
              className="w-full rounded-xl border border-[#525252] bg-[#3d3d3d] px-3.5 py-2.5 text-sm text-[#ececec] placeholder-[#8a8a8a] focus:border-[#9bf73c] focus:outline-none focus:ring-1 focus:ring-[#9bf73c] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#ececec]"
              >
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#525252] bg-[#3d3d3d] px-3.5 py-2.5 pr-10 text-sm text-[#ececec] placeholder-[#8a8a8a] focus:border-[#9bf73c] focus:outline-none focus:ring-1 focus:ring-[#9bf73c] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8a8a] hover:text-[#ececec]"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-[#9bf73c] py-3 text-sm font-semibold text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20 hover:bg-[#b6fa6b] active:bg-[#7ad81f] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-[#1c1c1c]" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Đang xác thực quyền...
              </span>
            ) : (
              'Đăng nhập Quản trị'
            )}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-center text-xs text-[#8a8a8a]">
          <span>Cần cấp quyền quản trị? Vui lòng liên hệ bộ phận IT / Super Admin.</span>
          <Link href="/" className="text-[#ececec] hover:text-[#9bf73c] transition-colors">
            ← Quay lại trang chủ MyCast
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#141414] text-[#ececec]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3d3d3d] border-t-[#9bf73c]" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
