'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/contexts/auth-context';
import { tokenService } from '@/lib/token';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/auth';

function AdminLoginForm() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithGoogle, user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already authenticated as ADMIN
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'ADMIN') {
      const redirectUrl = searchParams.get('redirect') || '/admin';
      router.replace(redirectUrl);
    }
  }, [isLoading, isAuthenticated, user, router, searchParams]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setErrorMsg('Không nhận được thông tin xác thực từ Google. Vui lòng thử lại.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const authUser = await loginWithGoogle(credentialResponse.credential);

      if (authUser?.role !== 'ADMIN') {
        tokenService.clearTokens();
        setErrorMsg('Tài khoản không có quyền truy cập Staff Portal. Vui lòng liên hệ Quản trị viên cấp cao.');
        return;
      }

      const redirectUrl = searchParams.get('redirect') || '/admin';
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as ApiErrorResponse;
        if (Array.isArray(data.message)) {
          setErrorMsg(data.message.join(', '));
        } else if (data.message) {
          setErrorMsg(data.message);
        } else {
          setErrorMsg('Xác thực tài khoản Google thất bại.');
        }
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Đăng nhập Google không thành công hoặc đã bị hủy.');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#141414] px-4 py-12 text-[#ececec]">
      <div className="w-full max-w-md rounded-2xl border border-[#525252] bg-[#2d2d2d] p-8 shadow-2xl shadow-black/60 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9bf73c]/30 bg-[#9bf73c]/10 px-3 py-1 text-xs font-semibold text-[#9bf73c] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#9bf73c] animate-pulse" />
            Staff / Operations Portal
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#ececec]">
            MyCast Staff Portal
          </h1>
          <p className="mt-1.5 text-xs text-[#8a8a8a]">
            Cổng quản trị hệ thống và điều hành hạ tầng lưu trữ. Đăng nhập bằng tài khoản Google quản trị được ủy quyền.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 rounded-xl border border-[#ff5c5c] bg-[#ff5c5c]/10 p-3 text-xs text-[#ff5c5c] text-left">
            {errorMsg}
          </div>
        )}

        <div className="py-4 flex flex-col items-center justify-center">
          {isSubmitting ? (
            <div className="flex items-center gap-2.5 py-3 text-sm text-[#ececec]">
              <svg className="h-5 w-5 animate-spin text-[#9bf73c]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang kiểm tra quyền quản trị...</span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="pill"
                size="large"
                text="signin_with"
              />
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-[#3d3d3d] pt-4 text-center">
          <Link
            href="/"
            className="text-xs text-[#8a8a8a] hover:text-[#ececec] transition-colors inline-flex items-center gap-1"
          >
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
        <div className="flex min-h-screen w-full items-center justify-center bg-[#141414] text-[#8a8a8a] text-sm">
          Đang tải cổng quản trị...
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
