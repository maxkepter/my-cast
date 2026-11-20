'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { YtNavbar } from '@/components/youtube/yt-navbar';
import { YtSidebar } from '@/components/youtube/yt-sidebar';

export default function UserLibraryPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#141414] text-[#ececec] selection:bg-[#9bf73c] selection:text-[#141414]">
      {/* 1. Header */}
      <YtNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Sidebar */}
        <YtSidebar collapsed={sidebarCollapsed} />

        {/* 3. Nội dung Thư viện Bạn (User Library / You) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Profile Header Người Dùng */}
            <div className="p-6 rounded-2xl bg-[#1c1c1c] border border-[#2d2d2d] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-[#262626] border-2 border-[#9bf73c] flex items-center justify-center font-bold text-2xl text-[#9bf73c] shrink-0">
                  NV
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-[#ececec]">Nguyễn Văn An</h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#8a8a8a]">
                    <span>@nguyenvanan</span>
                    <span>•</span>
                    <span className="text-[#9bf73c]">Tài khoản Google liên kết</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#aaa] pt-2">
                    <span><strong>14</strong> Danh sách phát</span>
                    <span>•</span>
                    <span><strong>86</strong> Video đã xem</span>
                    <span>•</span>
                    <span><strong>32</strong> Thảo luận</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/channel/tranhoangminh"
                  className="px-4 py-2 rounded-xl bg-[#222222] hover:bg-[#2d2d2d] text-xs font-semibold text-[#ececec] border border-[#333] transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  <span>Xem trang kênh của bạn</span>
                </Link>
              </div>
            </div>

            {/* Section 1: Lịch sử xem gần đây (Watch History) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#ececec] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Lịch Sử Xem Gần Đây</span>
                </h3>
                <Link href="/history" className="text-xs text-[#9bf73c] hover:underline">
                  Xem tất cả lịch sử →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/watch/clean-architecture-ddd"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80"
                      alt="History 1"
                      className="w-full h-full object-cover"
                    />
                    {/* Progress bar xem dở */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#262626]">
                      <div className="h-full bg-[#9bf73c] w-3/4"></div>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] truncate">
                      Clean Architecture & Gom Usecase Chuẩn DDD
                    </h4>
                    <span className="text-[10px] text-[#8a8a8a] block">Trần Hoàng Minh • Đã xem 75%</span>
                  </div>
                </Link>

                <Link
                  href="/watch/nestjs-enterprise"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80"
                      alt="History 2"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#262626]">
                      <div className="h-full bg-[#9bf73c] w-1/2"></div>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] truncate">
                      NestJS 11 Phân Tầng Enterprise
                    </h4>
                    <span className="text-[10px] text-[#8a8a8a] block">MyCast Tech • Đã xem 50%</span>
                  </div>
                </Link>

                <Link
                  href="/watch/opendesign-spec"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80"
                      alt="History 3"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#262626]">
                      <div className="h-full bg-[#9bf73c] w-full"></div>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] truncate">
                      OpenDesign & Định Dạng DESIGN.md
                    </h4>
                    <span className="text-[10px] text-[#8a8a8a] block">Studio Design Lab • Đã xem xong</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Section 2: Thảo luận của bạn (My Discussions) */}
            <div id="discussions" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#ececec] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <span>Thảo Luận Gần Đây Của Bạn (32 đóng góp)</span>
                </h3>
                <span className="text-xs text-[#8a8a8a]">Được cộng đồng đánh giá cao</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#8a8a8a]">
                    <span className="text-[#ececec] font-semibold">
                      Trên video: <Link href="/watch/clean-architecture-ddd" className="text-[#9bf73c] hover:underline">Kiến Trúc Phân Tầng Clean Architecture</Link>
                    </span>
                    <span className="font-mono text-[10px]">Hôm qua • 42 lượt ủng hộ</span>
                  </div>
                  <p className="text-[#d4d4d4] italic">
                    &quot;Làm thế nào để xử lý rollback trạng thái khi có một Domain Event phát sinh ngoại lệ giữa chừng?&quot;
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#222222] border-l-2 border-[#9bf73c] text-[11px] text-[#aaa]">
                    <strong className="text-[#ececec]">Trần Hoàng Minh (Chủ kênh):</strong> Đã phản hồi bình luận của bạn.
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Danh sách phát của bạn (Personal Playlists) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#ececec] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                  <span>Danh Sách Phát Của Bạn (14)</span>
                </h3>
                <button className="px-3 py-1 rounded-lg bg-[#222] hover:bg-[#2c2c2c] text-xs font-semibold text-[#9bf73c] border border-[#333]">
                  + Tạo danh sách mới
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  href="/playlists/nestjs-clean-architecture"
                  className="p-3.5 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#9bf73c]/50 transition-all space-y-2 group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <img
                      src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80"
                      alt="Playlist 1"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-[#9bf73c]">7 video</div>
                  </div>
                  <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] truncate">
                    Tài liệu nghiên cứu Backend NestJS
                  </h4>
                  <span className="text-[10px] text-[#8a8a8a] block">Riêng tư • Cập nhật 2 ngày trước</span>
                </Link>

                <Link
                  href="/playlists/streaming-distributed"
                  className="p-3.5 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#9bf73c]/50 transition-all space-y-2 group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <img
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"
                      alt="Playlist 2"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-[#9bf73c]">12 video</div>
                  </div>
                  <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] truncate">
                    Xem sau: Kiến trúc phân tán & Streaming
                  </h4>
                  <span className="text-[10px] text-[#8a8a8a] block">Riêng tư • Cập nhật tuần trước</span>
                </Link>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
