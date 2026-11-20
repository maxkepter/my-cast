'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { YtNavbar } from '@/components/youtube/yt-navbar';
import { YtSidebar } from '@/components/youtube/yt-sidebar';

export default function ChannelProfilePage() {
  const params = useParams();
  const handle = (params?.handle as string) || 'tranhoangminh';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'playlists' | 'community' | 'about'>('videos');
  const [isSubscribed, setIsSubscribed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#141414] text-[#ececec] selection:bg-[#9bf73c] selection:text-[#141414]">
      {/* 1. Header */}
      <YtNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Sidebar */}
        <YtSidebar collapsed={sidebarCollapsed} />

        {/* 3. Nội dung Channel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Banner Kênh */}
            <div className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-[#222222] border border-[#2d2d2d] relative shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80"
                alt="Channel Banner"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent"></div>
            </div>

            {/* Header Profile Kênh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 px-4 relative z-10">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#1c1c1c] border-4 border-[#141414] overflow-hidden shadow-2xl shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80"
                    alt="Channel Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#ececec]">Trần Hoàng Minh</h1>
                    <svg className="w-5 h-5 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#8a8a8a]">
                    <span>@{handle}</span>
                    <span>•</span>
                    <span className="text-[#9bf73c]">45.8K người đăng ký</span>
                    <span>•</span>
                    <span>24 video</span>
                  </div>
                  <p className="text-xs text-[#d4d4d4] max-w-2xl leading-relaxed pt-1">
                    Kênh chia sẻ kinh nghiệm thực chiến về Kiến trúc hướng miền (DDD), Thiết kế hệ thống chịu tải cao và Xử lý video đa phương tiện.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isSubscribed
                      ? 'bg-[#222222] text-[#ececec] border border-[#333]'
                      : 'bg-[#9bf73c] text-[#141414] hover:bg-[#7ad81f]'
                  }`}
                >
                  {isSubscribed ? 'Đã đăng ký' : 'Đăng ký'}
                </button>
                <button className="px-4 py-2.5 rounded-xl bg-[#222222] hover:bg-[#2d2d2d] text-xs font-semibold text-[#ececec] border border-[#333] transition-all">
                  Cộng đồng thảo luận
                </button>
              </div>
            </div>

            {/* Tab Navigation Chuẩn YouTube */}
            <div className="flex items-center gap-6 border-b border-[#2d2d2d] text-xs font-semibold px-2">
              <button
                onClick={() => setActiveTab('videos')}
                className={`pb-3 transition-colors ${
                  activeTab === 'videos'
                    ? 'text-[#9bf73c] border-b-2 border-[#9bf73c]'
                    : 'text-[#8a8a8a] hover:text-[#ececec]'
                }`}
              >
                Video
              </button>
              <button
                onClick={() => setActiveTab('playlists')}
                className={`pb-3 transition-colors ${
                  activeTab === 'playlists'
                    ? 'text-[#9bf73c] border-b-2 border-[#9bf73c]'
                    : 'text-[#8a8a8a] hover:text-[#ececec]'
                }`}
              >
                Danh sách phát (4)
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`pb-3 transition-colors ${
                  activeTab === 'community'
                    ? 'text-[#9bf73c] border-b-2 border-[#9bf73c]'
                    : 'text-[#8a8a8a] hover:text-[#ececec]'
                }`}
              >
                Cộng đồng
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`pb-3 transition-colors ${
                  activeTab === 'about'
                    ? 'text-[#9bf73c] border-b-2 border-[#9bf73c]'
                    : 'text-[#8a8a8a] hover:text-[#ececec]'
                }`}
              >
                Giới thiệu
              </button>
            </div>

            {/* Tab: Videos */}
            {activeTab === 'videos' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/watch/clean-architecture-ddd"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80"
                      alt="Video"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-1 rounded bg-[#141414]/90 text-[9px] font-mono text-[#ececec]">42:10</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2">Clean Architecture & DDD Cho Video Platform</h4>
                    <span className="text-[10px] font-mono text-[#8a8a8a] block">8.4K lượt xem • 18 thảo luận</span>
                  </div>
                </Link>

                <Link
                  href="/watch/idempotency-outbox"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80"
                      alt="Video"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-1 rounded bg-[#141414]/90 text-[9px] font-mono text-[#ececec]">35:00</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2">Nguyên Lý Idempotency & Transactional Outbox</h4>
                    <span className="text-[10px] font-mono text-[#8a8a8a] block">12K lượt xem • 34 thảo luận</span>
                  </div>
                </Link>

                <Link
                  href="/watch/redis-sharding"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&q=80"
                      alt="Video"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-1 rounded bg-[#141414]/90 text-[9px] font-mono text-[#ececec]">52:10</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2">Tối Ưu Hóa Bộ Đệm Phân Tán Với Redis Sharding</h4>
                    <span className="text-[10px] font-mono text-[#8a8a8a] block">6.1K lượt xem • 21 thảo luận</span>
                  </div>
                </Link>

                <Link
                  href="/watch/api-contract-nestjs"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="relative aspect-video bg-[#141414]">
                    <img
                      src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&q=80"
                      alt="Video"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-1 rounded bg-[#141414]/90 text-[9px] font-mono text-[#ececec]">28:40</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2">Thiết Kế Hợp Đồng API Inter-Module Trong NestJS</h4>
                    <span className="text-[10px] font-mono text-[#8a8a8a] block">9.5K lượt xem • 16 thảo luận</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Tab: Playlists */}
            {activeTab === 'playlists' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <Link
                  href="/playlists/nestjs-clean-architecture"
                  className="rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] overflow-hidden hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="relative aspect-video bg-black">
                    <img
                      src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80"
                      alt="Playlist Cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-xs font-mono font-bold bg-[#141414]/90 px-3 py-1.5 rounded-lg text-[#9bf73c] border border-[#333]">
                        7 VIDEO
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="text-xs font-bold text-[#ececec] group-hover:text-[#9bf73c] truncate">Trọn Bộ Hướng Dẫn NestJS 11 & Clean Architecture</h4>
                    <span className="text-[10px] text-[#8a8a8a] block">Xem toàn bộ danh sách phát</span>
                  </div>
                </Link>
              </div>
            )}

            {/* Tab: Community */}
            {activeTab === 'community' && (
              <div className="space-y-4 max-w-2xl">
                <div className="p-5 rounded-2xl bg-[#1c1c1c] border border-[#2d2d2d] space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center font-bold text-xs text-[#9bf73c]">TM</div>
                    <div>
                      <span className="font-bold text-[#ececec] block">Trần Hoàng Minh</span>
                      <span className="text-[10px] text-[#8a8a8a]">1 ngày trước</span>
                    </div>
                  </div>
                  <p className="text-[#d4d4d4] leading-relaxed">
                    Khảo sát: Video tuần tới các bạn muốn mình đào sâu hơn về kiến trúc <strong>Transactional Outbox Pattern với Kafka/RabbitMQ</strong> hay kỹ thuật <strong>Adaptive Bitrate Streaming HLS đa luồng</strong>? Hãy để lại bình luận nhé!
                  </p>
                  <div className="flex items-center gap-4 pt-2 text-[#8a8a8a] border-t border-[#262626]">
                    <span className="hover:text-[#9bf73c] cursor-pointer">▲ 142 bình chọn</span>
                    <span className="hover:text-[#ececec] cursor-pointer">28 câu trả lời</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: About */}
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl text-xs">
                <div className="md:col-span-2 space-y-3">
                  <h3 className="font-bold text-sm text-[#ececec]">Mô tả kênh</h3>
                  <p className="text-[#d4d4d4] leading-relaxed">
                    Kênh chia sẻ kiến thức chuyên sâu và giải pháp kỹ thuật thực chiến trong lập trình backend, kiến trúc phần mềm phân tầng Clean Architecture, Domain-Driven Design (DDD) và nền tảng xử lý truyền thông video độ trễ thấp.
                  </p>
                </div>
                <div className="space-y-3 p-4 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d]">
                  <h3 className="font-bold text-sm text-[#ececec]">Thống kê</h3>
                  <div className="space-y-2 text-[#8a8a8a]">
                    <div>Tham gia: 15 thg 4, 2024</div>
                    <div>Tổng số lượt xem: 485,210</div>
                    <div>Vùng: Việt Nam</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
