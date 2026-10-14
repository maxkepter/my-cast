import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#1c1c1c] px-4 py-12 relative overflow-hidden selection:bg-[#9bf73c] selection:text-[#1c1c1c]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#9bf73c]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#2d2d2d] blur-[100px] pointer-events-none rounded-full" />

      {/* Brand Header */}
      <div className="mb-8 text-center z-10">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9bf73c] text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20 group-hover:scale-105 transition-transform font-bold">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#ececec]">My-Cast</span>
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md z-10">{children}</div>

      {/* Footer link */}
      <div className="mt-8 text-center text-xs text-[#8a8a8a] z-10">
        <Link href="/" className="hover:text-[#ececec] transition-colors">
          ← Quay lại trang chủ My-Cast
        </Link>
      </div>
    </div>
  );
}
