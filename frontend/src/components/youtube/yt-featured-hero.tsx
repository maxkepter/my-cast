'use client';

import React from 'react';
import Link from 'next/link';

export function YtFeaturedHero() {
  return (
    <div className="relative mb-6 rounded-3xl overflow-hidden border border-[#2d2d2d] bg-gradient-to-r from-[#141414] via-[#222222] to-[#1c1c1c] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl select-none">
      {/* Background glow subtle */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#9bf73c]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Nội dung bên trái */}
      <div className="relative z-10 max-w-xl space-y-3 text-left">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#9bf73c]/15 text-[#9bf73c] text-xs font-mono font-semibold border border-[#9bf73c]/30">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>VIDEO THẢO LUẬN TIÊU ĐIỂM</span>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#ececec] tracking-tight leading-tight">
          Toàn Diện Về Microservices: Khi Nào Nên Tách Service Và Khi Nào Giữ Monolith?
        </h1>

        <p className="text-xs sm:text-sm text-[#8a8a8a] line-clamp-2">
          Video phân tích chuyên sâu với 68 bình luận thảo luận chất lượng cao đã được tổng hợp và ghim mốc thời gian rõ ràng.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/watch/clean-architecture-ddd"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9bf73c] text-[#141414] text-xs font-bold hover:bg-[#7ad81f] transition-colors shadow-md shadow-[#9bf73c]/20"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Xem & Thảo luận</span>
          </Link>

          <span className="text-xs text-[#8a8a8a] font-mono">12K lượt xem • 68 thảo luận</span>
        </div>
      </div>

      {/* Preview Card bên phải */}
      <Link
        href="/watch/clean-architecture-ddd"
        className="relative z-10 w-full md:w-80 shrink-0 aspect-video rounded-2xl overflow-hidden border border-[#333] shadow-2xl group cursor-pointer"
      >
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80"
          alt="Video Preview"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#9bf73c] text-[#141414] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
