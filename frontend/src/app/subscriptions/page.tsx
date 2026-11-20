'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { YtNavbar } from '@/components/youtube/yt-navbar';
import { YtSidebar } from '@/components/youtube/yt-sidebar';

export default function SubscriptionsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#141414] text-[#ececec] selection:bg-[#9bf73c] selection:text-[#141414]">
      {/* 1. Header */}
      <YtNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Sidebar */}
        <YtSidebar collapsed={sidebarCollapsed} />

        {/* 3. Nội dung Kênh Đăng Ký */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Carousel Kênh Đăng Ký */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#ececec]">Kênh Đã Đăng Ký</h2>
              <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                <Link
                  href="/channel/tranhoangminh"
                  className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1c1c1c] border-2 border-[#9bf73c] p-0.5 group-hover:scale-105 transition-transform">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                      alt="Trần Hoàng Minh"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#ececec] max-w-[75px] truncate text-center group-hover:text-[#9bf73c]">
                    Trần Hoàng Minh
                  </span>
                </Link>

                <Link
                  href="/channel/mycasttech"
                  className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1c1c1c] border border-[#333] p-0.5 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-[#222] flex items-center justify-center font-bold text-xs text-[#3cc8f7]">
                      MC
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#aaa] max-w-[75px] truncate text-center group-hover:text-[#ececec]">
                    MyCast Tech
                  </span>
                </Link>

                <Link
                  href="/channel/studiodesign"
                  className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1c1c1c] border border-[#333] p-0.5 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-[#222] flex items-center justify-center font-bold text-xs text-[#f7c93c]">
                      SD
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#aaa] max-w-[75px] truncate text-center group-hover:text-[#ececec]">
                    Studio Design
                  </span>
                </Link>

                <Link
                  href="/channel/mediaengineering"
                  className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1c1c1c] border border-[#333] p-0.5 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-[#222] flex items-center justify-center font-bold text-xs text-[#ff6b6b]">
                      ME
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#aaa] max-w-[75px] truncate text-center group-hover:text-[#ececec]">
                    Media VN
                  </span>
                </Link>
              </div>
            </div>

            {/* Feed Video Mới Nhất Từ Kênh Theo Dõi */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#ececec]">Mới Nhất Từ Kênh Bạn Đăng Ký</h3>
                <span className="text-xs text-[#8a8a8a] font-mono">Thứ tự: Mới xuất bản</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                <Link
                  href="/watch/clean-architecture-ddd"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/60 transition-all group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80"
                      alt="Thumb 1"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-[#141414]/90 text-[10px] font-mono text-[#ececec]">42:10</span>
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#9bf73c] text-[10px] font-bold text-[#141414]">MỚI</span>
                  </div>
                  <div className="p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2 leading-snug">
                      Thiết Kế Clean Architecture & Gom Usecase Chuẩn Domain-Driven Design
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#8a8a8a]">
                      <span>Trần Hoàng Minh</span>
                      <span>• 3 giờ trước</span>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/watch/hls-bitrate-adaptive"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/60 transition-all cursor-pointer group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&q=80"
                      alt="Thumb 2"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-[#141414]/90 text-[10px] font-mono text-[#ececec]">55:00</span>
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#9bf73c] text-[10px] font-bold text-[#141414]">MỚI</span>
                  </div>
                  <div className="p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2 leading-snug">
                      Kiến Trúc Băng Thông Video Đa Bitrate & Thuật Toán Nén Thích Ứng HLS
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#8a8a8a]">
                      <span>Media Engineering VN</span>
                      <span>• Hôm qua</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
