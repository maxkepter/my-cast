'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/auth';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail } = useAuth();

  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(900);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email cần xác thực.');
      return;
    }

    if (code.length !== 6) {
      setErrorMsg('Mã xác thực phải gồm đúng 6 chữ số.');
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyEmail({ email: email.trim(), code });
      setSuccessMsg('Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.data) {
        const data = err.response.data as ApiErrorResponse;
        if (Array.isArray(data.message)) {
          setErrorMsg(data.message.join(', '));
        } else if (data.message) {
          setErrorMsg(data.message);
        } else {
          setErrorMsg('Mã xác thực không hợp lệ hoặc đã hết hạn.');
        }
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#525252] bg-[#2d2d2d] backdrop-blur-xl p-8 shadow-2xl shadow-black/50">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9bf73c]/10 text-[#9bf73c] border border-[#9bf73c]/30">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#ececec]">Xác thực Email</h1>
        <p className="mt-1.5 text-xs text-[#8a8a8a]">
          Nhập mã OTP gồm 6 chữ số vừa được gửi đến hòm thư của bạn.
        </p>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-xl border border-[#9bf73c]/40 bg-[#9bf73c]/10 p-3 text-xs text-[#9bf73c]">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[#9bf73c] shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-[#ff5c5c] bg-[#ff5c5c]/10 p-3 text-xs text-[#ff5c5c]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#ececec] mb-1.5">
            Email xác thực
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#525252] bg-[#3d3d3d] px-3.5 py-2.5 text-sm text-[#ececec] placeholder-[#8a8a8a] focus:border-[#9bf73c] focus:outline-none focus:ring-1 focus:ring-[#9bf73c] transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="code" className="block text-xs font-medium text-[#ececec]">
              Mã xác thực (6 số)
            </label>
            <span className="text-[11px] text-[#8a8a8a] font-mono">
              Hiệu lực: <strong className="text-[#9bf73c]">{formatTime(timeLeft)}</strong>
            </span>
          </div>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold rounded-xl border border-[#525252] bg-[#3d3d3d] py-3 text-[#ececec] placeholder-[#8a8a8a] focus:border-[#9bf73c] focus:outline-none focus:ring-1 focus:ring-[#9bf73c] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || code.length !== 6 || timeLeft === 0}
          className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-[#9bf73c] py-3 text-sm font-semibold text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20 hover:bg-[#b6fa6b] active:bg-[#7ad81f] disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-[#1c1c1c]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang xác minh...
            </span>
          ) : (
            'Xác nhận mã OTP'
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-xs text-[#8a8a8a]">
        <Link href="/register" className="hover:text-[#ececec] transition-colors">
          ← Đổi email khác
        </Link>
        <Link href="/login" className="font-semibold text-[#9bf73c] hover:text-[#b6fa6b]">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[#525252] bg-[#2d2d2d] p-8 text-center text-[#8a8a8a] text-sm">
          Đang tải thông tin xác thực...
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
