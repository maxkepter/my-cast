import React from 'react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9bf73c]/10 blur-[140px] -z-10 pointer-events-none rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#5aa616]/40 bg-[#2e5410]/50 px-4 py-1.5 text-xs font-semibold text-[#9bf73c] mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9bf73c] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9bf73c]"></span>
          </span>
          MY-CAST STUDIO V2.0 — PHÁT SÓNG ĐỘ TRỄ CỰC THẤP
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#ececec] max-w-4xl mx-auto leading-[1.15]">
          Nền Tảng Livestream &amp;{' '}
          <span className="text-[#9bf73c]">
            Video Podcast
          </span>{' '}
          Đẳng Cấp Cho Creator
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-[#8a8a8a] max-w-2xl mx-auto leading-relaxed font-normal">
          Truyền phát trực tiếp 4K, ghi âm podcast chất lượng phòng thu, biên tập và phân phối đa nền tảng chỉ trong một cú nhấp chuột.
        </p>

        {/* Dual Call-to-Action */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#9bf73c] px-8 py-4 text-base font-semibold text-[#1c1c1c] shadow-xl shadow-[#9bf73c]/20 hover:bg-[#b6fa6b] active:bg-[#7ad81f] transition-all transform hover:-translate-y-0.5"
          >
            Tạo kênh miễn phí
            <svg
              className="ml-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <a
            href="#live-preview"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#525252] bg-[#2d2d2d] backdrop-blur-md px-8 py-4 text-base font-semibold text-[#ececec] hover:bg-[#3d3d3d] hover:text-[#9bf73c] transition-colors"
          >
            Khám phá phòng thu
          </a>
        </div>

        {/* Social Proof Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[#8a8a8a]">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#9bf73c]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Hơn 10,000+ Streamer tin dùng</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#9bf73c]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Độ trễ truyền phát &lt; 800ms</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#9bf73c]" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Chất lượng âm thanh 320kbps</span>
          </div>
        </div>
      </div>
    </section>
  );
}
