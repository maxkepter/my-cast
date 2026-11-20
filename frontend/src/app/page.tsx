'use client';

import React, { useState, useMemo } from 'react';
import { YtNavbar } from '@/components/youtube/yt-navbar';
import { YtSidebar } from '@/components/youtube/yt-sidebar';
import { YtCategoryChips } from '@/components/youtube/yt-category-chips';
import { YtFeaturedHero } from '@/components/youtube/yt-featured-hero';
import { YtVideoCard } from '@/components/youtube/yt-video-card';
import { YtShortsShelf } from '@/components/youtube/yt-shorts-shelf';
import { MOCK_VIDEOS } from '@/components/youtube/yt-mock-data';

export default function HomePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Lọc video theo danh mục & từ khóa tìm kiếm
  const filteredVideos = useMemo(() => {
    return MOCK_VIDEOS.filter((v) => {
      const matchCat =
        selectedCategory === 'Tất cả' || v.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.channelName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#1c1c1c] text-[#ececec] selection:bg-[#9bf73c] selection:text-[#1c1c1c]">
      {/* 1. Header chuẩn YouTube với Search Bar lớn và nút Actions */}
      <YtNavbar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onSearch={(q) => setSearchQuery(q)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Sidebar điều hướng phân tầng đa cấp (Trang chủ, Shorts, Kênh đăng ký, Lịch sử) */}
        <YtSidebar collapsed={sidebarCollapsed} />

        {/* 3. Nội dung Feed chính */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Category Chips Bar ngang */}
          <YtCategoryChips
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />

          <div className="p-4 sm:p-6 max-w-[2000px] mx-auto w-full">
            {/* Banner Tiêu điểm (Hero Livestream / Podcast Spotlight) */}
            {selectedCategory === 'Tất cả' && !searchQuery && <YtFeaturedHero />}

            {/* Video Grid Feed: Phân chia 1, 2, 3 hoặc 4 cột tùy độ phân giải */}
            {filteredVideos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {filteredVideos.slice(0, 4).map((video) => (
                    <YtVideoCard key={video.id} video={video} />
                  ))}
                </div>

                {/* Shorts Shelf hàng ngang giống YouTube */}
                {selectedCategory === 'Tất cả' && !searchQuery && <YtShortsShelf />}

                {/* Hàng video tiếp theo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 mt-6">
                  {filteredVideos.slice(4).map((video) => (
                    <YtVideoCard key={video.id} video={video} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#2d2d2d] flex items-center justify-center text-[#8a8a8a]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#ececec]">Không tìm thấy video phù hợp</h3>
                <p className="text-sm text-[#8a8a8a]">
                  Hãy thử từ khóa khác hoặc chuyển sang danh mục &quot;Tất cả&quot;.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('Tất cả');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-full bg-[#2d2d2d] text-xs font-semibold text-[#9bf73c] hover:bg-[#3d3d3d] transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
