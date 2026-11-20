'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '@/contexts/auth-context';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/auth';
import Link from 'next/link';

function LoginForm() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === '1';

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setErrorMsg('Không nhận được mã xác thực từ Google. Vui lòng thử lại.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await loginWithGoogle(credentialResponse.credential);
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as ApiErrorResponse;
        if (Array.isArray(data.message)) {
          setErrorMsg(data.message.join(', '));
        } else if (data.message) {
          setErrorMsg(data.message);
        } else {
          setErrorMsg('Đăng nhập Google thất bại. Vui lòng thử lại sau.');
        }
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ My-Cast. Vui lòng kiểm tra lại đường truyền.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg('Xác thực bằng tài khoản Google không thành công hoặc người dùng đã hủy.');
  };

  return (
    <div className="w-full rounded-3xl border border-[#3d3d3d] bg-[#2d2d2d]/95 backdrop-blur-2xl shadow-2xl shadow-black/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
      {/* CỘT TRÁI: Creator Studio Showcase & Visualizer */}
      <div className="lg:col-span-7 bg-gradient-to-br from-[#1c1c1c] via-[#222222] to-[#171717] p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#3d3d3d] relative overflow-hidden">
        {/* Glow ambient background inside left card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#9bf73c]/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#3d3d3d]/50 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          {/* Studio Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4444]/15 border border-[#ff4444]/30 text-xs font-semibold text-[#ff5c5c]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4444] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff5c5c]"></span>
              </span>
              <span>ON AIR</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9bf73c]/10 border border-[#9bf73c]/25 text-xs font-medium text-[#9bf73c]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
              <span>STUDIO CREATOR SUITE</span>
            </div>
          </div>

          {/* Heading Pitch */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#ececec] tracking-tight leading-tight">
            Nền tảng phát sóng trực tiếp & <span className="text-[#9bf73c]">Podcast đa phương tiện</span> thế hệ mới
          </h1>

          <p className="mt-3 text-sm text-[#8a8a8a] leading-relaxed max-w-xl">
            Tận hưởng phòng thu đám mây với chuẩn truyền dẫn âm thanh lossless, mã hóa đa bitrate thích ứng thời gian thực và mạng lưới lưu trữ phi tập trung siêu tốc.
          </p>

          {/* Live Audio Visualizer Card Simulation */}
          <div className="mt-8 rounded-2xl border border-[#3d3d3d] bg-[#141414]/80 p-5 backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2d2d]">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#9bf73c]/20 border border-[#9bf73c]/40 flex items-center justify-center text-[#9bf73c]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#ececec] flex items-center gap-2">
                    <span>Phòng thu chính #01</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3d3d3d] text-[#8a8a8a]">4K HDR</span>
                  </div>
                  <div className="text-[11px] text-[#8a8a8a]">Kênh âm thanh đa tầng • 48kHz Lossless</div>
                </div>
              </div>

              {/* Dynamic Sound Equalizer Wave */}
              <div className="flex items-end gap-1 h-8 px-2 py-1 bg-[#1c1c1c] rounded-lg border border-[#3d3d3d]">
                <span className="w-1 bg-[#9bf73c] rounded-full animate-wave-1" />
                <span className="w-1 bg-[#9bf73c] rounded-full animate-wave-2" />
                <span className="w-1 bg-[#9bf73c] rounded-full animate-wave-3" />
                <span className="w-1 bg-[#9bf73c] rounded-full animate-wave-4" />
                <span className="w-1 bg-[#9bf73c] rounded-full animate-wave-5" />
                <span className="w-1 bg-[#9bf73c] rounded-full animate-wave-6" />
                <span className="w-1 bg-[#9bf73c] rounded-full animate-wave-7" />
                <span className="w-1 bg-[#9bf73c] rounded-full animate-wave-8" />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="p-2.5 rounded-xl bg-[#1c1c1c]/90 border border-[#2d2d2d]">
                <div className="text-[11px] text-[#8a8a8a]">Độ trễ truyền dẫn</div>
                <div className="text-sm font-bold text-[#9bf73c] mt-0.5">&lt; 0.8s</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1c1c1c]/90 border border-[#2d2d2d]">
                <div className="text-[11px] text-[#8a8a8a]">Chất lượng hình ảnh</div>
                <div className="text-sm font-bold text-[#ececec] mt-0.5">60 FPS</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1c1c1c]/90 border border-[#2d2d2d]">
                <div className="text-[11px] text-[#8a8a8a]">Node lưu trữ</div>
                <div className="text-sm font-bold text-[#9bf73c] mt-0.5">Auto Edge</div>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Community Highlights Footer in Left Column */}
        <div className="mt-8 pt-6 border-t border-[#3d3d3d]/80 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1c1c1c] bg-[#9bf73c] text-[#141414] font-black text-xs flex items-center justify-center">
                MC
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1c1c1c] bg-[#3d3d3d] text-[#ececec] font-bold text-xs flex items-center justify-center">
                VN
              </div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1c1c1c] bg-[#525252] text-[#ececec] font-bold text-xs flex items-center justify-center">
                4K
              </div>
            </div>
            <div className="text-xs">
              <span className="font-semibold text-[#ececec]">25,000+ Creators</span>
              <p className="text-[11px] text-[#8a8a8a]">đã sẵn sàng phát sóng hôm nay</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-[#9bf73c]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>Không thu phí nền tảng</span>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: Creator Authentication Gateway */}
      <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between bg-[#2d2d2d] relative">
        <div>
          {/* Header Section */}
          <div className="mb-6">
            <span className="text-[11px] font-bold tracking-wider text-[#9bf73c] uppercase">
              Cổng kết nối Creator
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#ececec] mt-1">
              Đăng nhập Studio
            </h2>
            <p className="mt-2 text-xs text-[#8a8a8a] leading-relaxed">
              Truy cập bảng điều khiển phòng thu, quản lý danh sách phát và phiên live streaming của bạn chỉ với một thao tác.
            </p>
          </div>

          {/* Session Expired Banner */}
          {isExpired && (
            <div className="mb-5 rounded-2xl border border-[#f7c93c]/50 bg-[#f7c93c]/10 p-3.5 text-xs text-[#f7c93c] flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-semibold">Phiên đăng nhập đã hết hạn.</span>
                <p className="text-[11px] text-[#f7c93c]/80 mt-0.5">Vui lòng đăng nhập lại để tiếp tục phiên làm việc.</p>
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMsg && (
            <div className="mb-5 rounded-2xl border border-[#ff5c5c]/50 bg-[#ff5c5c]/10 p-3.5 text-xs text-[#ff5c5c] flex items-start gap-2.5">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="leading-relaxed">
                {errorMsg}
              </div>
            </div>
          )}

          {/* Google OAuth Login Action Center */}
          <div className="py-4 my-2 flex flex-col items-center justify-center">
            {isSubmitting ? (
              <div className="w-full flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-[#1c1c1c] border border-[#3d3d3d] space-y-3">
                <div className="relative flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-2 border-[#3d3d3d] border-t-[#9bf73c] animate-spin" />
                  <div className="absolute h-4 w-4 rounded-full bg-[#9bf73c]/20" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-[#ececec]">Đang xác thực Google OAuth...</div>
                  <div className="text-[11px] text-[#8a8a8a] mt-0.5">Khởi tạo phiên phòng thu an toàn</div>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                {/* Glow frame container for GoogleLogin button */}
                <div className="relative w-full flex justify-center p-2 rounded-2xl bg-[#1c1c1c]/80 border border-[#3d3d3d] hover:border-[#9bf73c]/50 transition-colors shadow-inner">
                  <div className="w-full flex justify-center py-1">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="filled_black"
                      shape="pill"
                      size="large"
                      text="continue_with"
                      width="320"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] text-[#8a8a8a]">
                  <svg className="w-3.5 h-3.5 text-[#9bf73c]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                  <span>Xác thực một chạm với Google • Bảo mật đa lớp</span>
                </div>
              </div>
            )}
          </div>

          {/* Key Advantages Checklist */}
          <div className="mt-6 space-y-2.5 pt-4 border-t border-[#3d3d3d]">
            <div className="flex items-center gap-2.5 text-xs text-[#d4d4d4]">
              <div className="h-5 w-5 rounded-full bg-[#9bf73c]/15 text-[#9bf73c] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Không cần mật khẩu, tránh rủi ro đánh cắp tài khoản</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-[#d4d4d4]">
              <div className="h-5 w-5 rounded-full bg-[#9bf73c]/15 text-[#9bf73c] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Tự động đồng bộ hóa thông tin hồ sơ và kênh phát sóng</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-[#d4d4d4]">
              <div className="h-5 w-5 rounded-full bg-[#9bf73c]/15 text-[#9bf73c] flex items-center justify-center shrink-0">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Hỗ trợ chuyển đổi liền mạch giữa Podcast và Livestream</span>
            </div>
          </div>
        </div>

        {/* Legal & Terms Footer in Right Column */}
        <div className="mt-8 pt-4 border-t border-[#3d3d3d] text-[11px] text-[#8a8a8a] text-center leading-relaxed">
          Bằng cách tiếp tục đăng nhập, bạn đồng ý với{' '}
          <Link href="/terms" className="text-[#ececec] underline hover:text-[#9bf73c] transition-colors">
            Điều khoản Dịch vụ
          </Link>{' '}
          và{' '}
          <Link href="/privacy" className="text-[#ececec] underline hover:text-[#9bf73c] transition-colors">
            Chính sách Quyền riêng tư
          </Link>{' '}
          của My-Cast.
        </div>
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
          <span>Đang chuẩn bị không gian làm việc Studio...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}