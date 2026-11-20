"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/contexts/auth-context";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/types/auth";
import Link from "next/link";

function LoginForm() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "1";

  // Tự động chuyển hướng nếu người dùng đã đăng nhập
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirectUrl = searchParams.get("redirect") || "/";
      router.replace(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, searchParams]);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (!credentialResponse.credential) {
      setErrorMsg("Không nhận được mã xác thực từ Google. Vui lòng thử lại.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await loginWithGoogle(credentialResponse.credential);
      const redirectUrl = searchParams.get("redirect") || "/";
      router.replace(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as ApiErrorResponse;
        if (Array.isArray(data.message)) {
          setErrorMsg(data.message.join(", "));
        } else if (data.message) {
          setErrorMsg(data.message);
        } else {
          setErrorMsg("Đăng nhập Google thất bại. Vui lòng thử lại sau.");
        }
      } else {
        setErrorMsg(
          "Không thể kết nối đến máy chủ MyCast. Vui lòng kiểm tra lại đường truyền mạng.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg(
      "Xác thực bằng tài khoản Google không thành công hoặc người dùng đã hủy.",
    );
  };

  return (
    <div className="w-full rounded-3xl border border-[#3d3d3d] bg-[#2d2d2d] p-8 sm:p-10 shadow-2xl shadow-black/80 text-left">
      {/* Brand Icon & Heading */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="flex h-12 w-14 items-center justify-center rounded-2xl bg-[#9bf73c] text-[#141414] shadow-md shadow-[#9bf73c]/20 mb-4">
          <svg className="h-6 w-6 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#ececec] tracking-tight">
          Đăng nhập vào MyCast
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-[#8a8a8a]">
          Sử dụng Tài khoản Google của bạn để truy cập nền tảng và MyCast Studio
        </p>
      </div>

      {/* Cảnh báo phiên hết hạn */}
      {isExpired && (
        <div className="mb-6 rounded-2xl border border-[#f7c93c]/50 bg-[#f7c93c]/10 p-3.5 text-xs text-[#f7c93c] flex items-start gap-2.5">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <span className="font-semibold">Phiên làm việc đã hết hạn.</span>
            <p className="text-[11px] text-[#f7c93c]/80 mt-0.5">
              Vui lòng đăng nhập lại qua Google để tiếp tục.
            </p>
          </div>
        </div>
      )}

      {/* Cảnh báo lỗi */}
      {errorMsg && (
        <div className="mb-6 rounded-2xl border border-[#ff5c5c]/50 bg-[#ff5c5c]/10 p-3.5 text-xs text-[#ff5c5c] flex items-start gap-2.5">
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="leading-relaxed">{errorMsg}</div>
        </div>
      )}

      {/* Trung tâm hành động Google OAuth */}
      <div className="py-2 flex flex-col items-center justify-center">
        {isSubmitting ? (
          <div className="w-full flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-[#1c1c1c] border border-[#3d3d3d] space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-[#3d3d3d] border-t-[#9bf73c] animate-spin" />
            <div className="text-center">
              <div className="text-sm font-semibold text-[#ececec]">
                Đang xác thực với Google...
              </div>
              <div className="text-[11px] text-[#8a8a8a] mt-0.5">
                Khởi tạo phiên làm việc an toàn
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {/* Vùng chứa nút GoogleLogin chuẩn dark mode */}
            <div className="w-full flex justify-center p-2 rounded-2xl bg-[#1c1c1c] border border-[#3d3d3d] hover:border-[#9bf73c]/50 transition-colors shadow-inner">
              <div className="w-full flex justify-center py-1">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="continue_with"
                  width="340"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8a8a8a]">
              <svg
                className="w-3.5 h-3.5 text-[#9bf73c]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <span>Xác thực an toàn một chạm với Google OAuth 2.0</span>
            </div>
          </div>
        )}
      </div>

      {/* Thông báo điều khoản & quyền riêng tư */}
      <div className="mt-6 pt-4 border-t border-[#3d3d3d] text-[11px] text-[#8a8a8a] leading-relaxed text-center">
        Khi tiếp tục, Google sẽ chia sẻ tên, địa chỉ email và ảnh hồ sơ của bạn
        với MyCast. Xem thêm{" "}
        <Link
          href="/terms"
          className="text-[#ececec] underline hover:text-[#9bf73c] transition-colors"
        >
          Điều khoản
        </Link>{" "}
        và{" "}
        <Link
          href="/privacy"
          className="text-[#ececec] underline hover:text-[#9bf73c] transition-colors"
        >
          Quyền riêng tư
        </Link>
        .
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full rounded-3xl border border-[#3d3d3d] bg-[#2d2d2d] p-12 text-center text-[#8a8a8a] text-sm flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#3d3d3d] border-t-[#9bf73c] animate-spin" />
          <span>Đang tải không gian đăng nhập MyCast...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
