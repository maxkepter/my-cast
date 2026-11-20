'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface YtNavbarProps {
  onToggleSidebar?: () => void;
  onSearch?: (query: string) => void;
}

export function YtNavbar({ onToggleSidebar, onSearch }: YtNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 h-14 w-full bg-[#1c1c1c] border-b border-[#2d2d2d] px-4 flex items-center justify-between gap-4 select-none">
      {/* KHỐI TRÁI: Menu Hamburger & Logo */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-[#2d2d2d] text-[#ececec] transition-colors focus:outline-none"
          title="Mở rộng / Thu gọn menu"
          aria-label="Toggle navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-9 items-center justify-center rounded-xl bg-[#9bf73c] text-[#141414] shadow-sm shadow-[#9bf73c]/30 group-hover:scale-105 transition-transform">
            <svg className="h-4 w-4 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="flex items-baseline">
            <span className="text-lg font-black tracking-tight text-[#ececec]">MyCast</span>
            <span className="text-[10px] font-bold text-[#8a8a8a] ml-1 tracking-wider uppercase">VN</span>
          </div>
        </Link>
      </div>

      {/* KHỐI GIỮA: Thanh tìm kiếm chuẩn phong cách YouTube */}
      <div className="flex-1 max-w-2xl mx-auto flex items-center justify-center gap-2">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center max-w-xl">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm video, podcast, livestream..."
              className="w-full h-10 pl-4 pr-10 rounded-l-full bg-[#141414] border border-[#3d3d3d] focus:border-[#9bf73c] text-sm text-[#ececec] placeholder-[#8a8a8a] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#8a8a8a] hover:text-[#ececec]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="h-10 px-5 rounded-r-full bg-[#2d2d2d] border border-l-0 border-[#3d3d3d] hover:bg-[#3d3d3d] text-[#d4d4d4] hover:text-[#ececec] flex items-center justify-center transition-colors"
            title="Tìm kiếm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {/* Nút tìm kiếm bằng giọng nói */}
        <button
          type="button"
          className="h-10 w-10 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#ececec] hidden sm:flex items-center justify-center transition-colors shrink-0"
          title="Tìm kiếm bằng giọng nói"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 02-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
      </div>

      {/* KHỐI PHẢI: Actions & Đăng nhập */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Nút Tạo / Tải lên */}
        <Link
          href="/upload"
          className="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#ececec] text-xs font-semibold border border-[#3d3d3d] hover:border-[#525252] transition-colors"
        >
          <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tạo</span>
        </Link>

        {/* Chuông thông báo */}
        <button
          type="button"
          className="relative p-2 rounded-full hover:bg-[#2d2d2d] text-[#ececec] transition-colors"
          title="Thông báo"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff5c5c] text-[9px] font-bold text-white">
            3
          </span>
        </button>

        {/* Nút Đăng nhập */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#9bf73c]/50 text-[#9bf73c] hover:bg-[#9bf73c]/10 text-xs font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Đăng nhập</span>
        </Link>
      </div>
    </header>
  );
}
