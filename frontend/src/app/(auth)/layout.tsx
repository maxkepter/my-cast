import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#141414] text-[#ececec] relative overflow-hidden selection:bg-[#9bf73c] selection:text-[#141414]">
      {/* Background ambient lighting subtle */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#9bf73c]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-[#2d2d2d]/30 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Header - YouTube Brand Style */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-9 w-10 items-center justify-center rounded-xl bg-[#9bf73c] text-[#141414] shadow-md shadow-[#9bf73c]/20 group-hover:scale-105 transition-transform">
            <svg className="h-4 w-4 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-[#ececec]">MyCast</span>
            <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#9bf73c] border border-[#3d3d3d] uppercase">
              Studio
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#8a8a8a] hover:text-[#9bf73c] transition-colors py-1.5 px-3 rounded-full hover:bg-[#2d2d2d] border border-transparent hover:border-[#3d3d3d]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Quay lại MyCast</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* Footer YouTube / Google Style */}
      <footer className="relative z-20 px-6 py-4 text-xs text-[#8a8a8a]">
        <div className="max-w-md mx-auto flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-[#8a8a8a] hover:text-[#ececec] cursor-pointer">Tiếng Việt (Việt Nam)</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-[#ececec] transition-colors">
              Trợ giúp
            </Link>
            <Link href="/privacy" className="hover:text-[#ececec] transition-colors">
              Bảo mật
            </Link>
            <Link href="/terms" className="hover:text-[#ececec] transition-colors">
              Điều khoản
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
