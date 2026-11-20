'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { YtNavbar } from '@/components/youtube/yt-navbar';
import { YtSidebar } from '@/components/youtube/yt-sidebar';
import { DiscussionForum } from '@/components/discussion/discussion-forum';

export default function WatchVideoPage() {
  const params = useParams();
  const videoId = (params?.id as string) || 'clean-architecture-ddd';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likesCount, setLikesCount] = useState(342);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = () => {
    if (hasLiked) {
      setLikesCount(likesCount - 1);
      setHasLiked(false);
    } else {
      setLikesCount(likesCount + 1);
      setHasLiked(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#141414] text-[#ececec] selection:bg-[#9bf73c] selection:text-[#141414]">
      {/* 1. Header chuẩn YouTube */}
      <YtNavbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Sidebar Collapsed by default trên trang xem để mở rộng diện tích video */}
        <YtSidebar collapsed={sidebarCollapsed} />

        {/* 3. Nội dung Watch Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CỘT CHÍNH (8 CỘT): Player + Thông tin Video + Diễn Đàn Thảo Luận */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Khung Video Player */}
              <div className="rounded-2xl border border-[#2d2d2d] bg-[#1a1a1a] overflow-hidden shadow-2xl">
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&q=80"
                    alt="Video thumbnail"
                    className="w-full h-full object-cover opacity-85"
                  />
                  <button
                    className="absolute w-14 h-14 rounded-full bg-[#141414]/90 border border-[#3d3d3d] text-[#9bf73c] flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                    aria-label="Phát video"
                  >
                    <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded bg-[#141414]/90 border border-[#333] text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#9bf73c]"></span>
                    <span>08:15 / 42:10 (Đang phát)</span>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4 sm:p-5 space-y-4">
                  <h1 className="text-base sm:text-lg font-bold text-[#ececec] leading-snug">
                    Kiến Trúc Phân Tầng Clean Architecture & Domain-Driven Design Cho Nền Tảng Video
                  </h1>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#262626]">
                    {/* Kênh */}
                    <div className="flex items-center gap-3">
                      <Link href="/channel/tranhoangminh" className="w-10 h-10 rounded-full bg-[#222222] border border-[#3d3d3d] flex items-center justify-center font-bold text-xs text-[#9bf73c] shrink-0">
                        TM
                      </Link>
                      <div>
                        <Link href="/channel/tranhoangminh" className="font-semibold text-sm text-[#ececec] hover:text-[#9bf73c] transition-colors block">
                          Trần Hoàng Minh
                        </Link>
                        <span className="text-[11px] text-[#8a8a8a] block">45.8K người đăng ký</span>
                      </div>
                      <button
                        onClick={() => setIsSubscribed(!isSubscribed)}
                        className={`ml-3 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSubscribed
                            ? 'bg-[#222222] text-[#ececec] border border-[#333]'
                            : 'bg-[#9bf73c] text-[#141414] hover:bg-[#7ad81f]'
                        }`}
                      >
                        {isSubscribed ? 'Đã đăng ký' : 'Đăng ký'}
                      </button>
                    </div>

                    {/* Actions: Like, Share, Save */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                          hasLiked
                            ? 'bg-[#9bf73c]/15 text-[#9bf73c] border-[#9bf73c]/40'
                            : 'bg-[#222222] text-[#ececec] border-[#333] hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <svg className="w-4 h-4" fill={hasLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span>{likesCount}</span>
                      </button>

                      <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-[#ececec] text-xs font-semibold border border-[#333] transition-colors">
                        <svg className="w-4 h-4 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>Chia sẻ</span>
                      </button>

                      <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-[#ececec] text-xs font-semibold border border-[#333] transition-colors">
                        <svg className="w-4 h-4 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>Lưu</span>
                      </button>
                    </div>
                  </div>

                  {/* Mô tả video */}
                  <div className="p-3.5 rounded-xl bg-[#222222] text-xs text-[#d4d4d4] leading-relaxed space-y-1.5">
                    <div className="flex items-center gap-3 font-mono text-[#8a8a8a] text-[11px]">
                      <span>8.4K lượt xem</span>
                      <span>•</span>
                      <span>Đã xuất bản 2 ngày trước</span>
                    </div>
                    <p>
                      Phân tích chi tiết mô hình 4 tầng Clean Architecture kết hợp nguyên lý Bounded Context trong Domain-Driven Design (DDD). Giải quyết bài toán gom usecase interface và quản trị dependency không bị phân mảnh.
                    </p>
                  </div>
                </div>
              </div>

              {/* Diễn đàn Thảo luận & Phản biện (Discussion-First) */}
              <DiscussionForum videoId={videoId} />
            </div>

            {/* CỘT PHẢI (4 CỘT): Video Tiếp Theo (Up Next) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#2d2d2d]">
                <h3 className="text-xs font-bold text-[#ececec] uppercase tracking-wider">Video Tiếp Theo</h3>
                <span className="text-[10px] text-[#9bf73c] font-mono">Tự động phát</span>
              </div>

              <div className="space-y-3">
                <Link
                  href="/watch/bullmq-transcode"
                  className="flex gap-3 p-2 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="w-32 aspect-video rounded-lg overflow-hidden bg-[#141414] shrink-0 relative">
                    <img
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&q=80"
                      alt="Rec 1"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-[#141414]/90 text-[9px] font-mono text-[#ececec]">35:10</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2 leading-snug">
                      Xây Dựng Background Worker Transcode Video Với BullMQ
                    </h4>
                    <span className="text-[10px] text-[#8a8a8a] block mt-1">Trần Hoàng Minh</span>
                    <span className="text-[10px] font-mono text-[#9bf73c]">1.2K lượt xem • 12 thảo luận</span>
                  </div>
                </Link>

                <Link
                  href="/watch/redis-cache-sharding"
                  className="flex gap-3 p-2 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="w-32 aspect-video rounded-lg overflow-hidden bg-[#141414] shrink-0 relative">
                    <img
                      src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&q=80"
                      alt="Rec 2"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-[#141414]/90 text-[9px] font-mono text-[#ececec]">48:00</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2 leading-snug">
                      Tối Ưu Hóa Bộ Đệm Cache Đa Lớp Redis & Database Sharding
                    </h4>
                    <span className="text-[10px] text-[#8a8a8a] block mt-1">Trần Hoàng Minh</span>
                    <span className="text-[10px] font-mono text-[#9bf73c]">2.5K lượt xem • 29 thảo luận</span>
                  </div>
                </Link>

                <Link
                  href="/watch/two-phase-auditor"
                  className="flex gap-3 p-2 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#9bf73c]/50 transition-all group"
                >
                  <div className="w-32 aspect-video rounded-lg overflow-hidden bg-[#141414] shrink-0 relative">
                    <img
                      src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&q=80"
                      alt="Rec 3"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 px-1 rounded bg-[#141414]/90 text-[9px] font-mono text-[#ececec]">22:45</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[#ececec] group-hover:text-[#9bf73c] line-clamp-2 leading-snug">
                      Kiểm Thử Hai Pha: Module Nội Bộ Mock & Tích Hợp Toàn Bộ Hệ Thống
                    </h4>
                    <span className="text-[10px] text-[#8a8a8a] block mt-1">Dev Engineering</span>
                    <span className="text-[10px] font-mono text-[#9bf73c]">890 lượt xem • 7 thảo luận</span>
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
