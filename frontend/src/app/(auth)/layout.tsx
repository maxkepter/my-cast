import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#141414] text-[#ececec] relative overflow-hidden selection:bg-[#9bf73c] selection:text-[#141414]">
      {/* Background Studio Glow & Mesh Effects */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-[#9bf73c]/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 -left-48 w-[400px] h-[400px] bg-[#9bf73c]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-[#2d2d2d] blur-[140px] pointer-events-none rounded-full" />

      {/* Decorative Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ececec 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Studio Bar */}
      <header className="relative z-20 w-full border-b border-[#2d2d2d]/80 bg-[#141414]/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9bf73c] text-[#141414] shadow-md shadow-[#9bf73c]/20 group-hover:scale-105 transition-transform font-black">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#ececec]">My-Cast</span>
                <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#9bf73c]/15 text-[#9bf73c] border border-[#9bf73c]/30 uppercase">
                  Studio
                </span>
              </div>
              <span className="text-[10px] text-[#8a8a8a] hidden sm:inline-block">Livestream & Video Podcast Platform</span>
            </div>
          </Link>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1c1c1c] border border-[#3d3d3d] text-xs text-[#8a8a8a]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9bf73c] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9bf73c]"></span>
              </span>
              <span>Hệ thống trực tuyến</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#8a8a8a] hover:text-[#9bf73c] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#2d2d2d]/60 border border-transparent hover:border-[#3d3d3d]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Studio Footer */}
      <footer className="relative z-20 border-t border-[#2d2d2d]/80 bg-[#141414]/70 backdrop-blur-md px-6 py-4 text-xs text-[#8a8a8a]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span>© 2026 My-Cast Studio.</span>
            <span className="text-[#3d3d3d]">•</span>
            <span className="text-[#8a8a8a]">Phát sóng độ trễ siêu thấp & Âm thanh lossless đa luồng</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-[#8a8a8a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9bf73c]" />
              WebRTC & HLS v3
            </span>
            <span className="text-[#3d3d3d]">•</span>
            <span className="text-[#8a8a8a]">Bảo mật Google OAuth 2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}