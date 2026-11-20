'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface YtSidebarProps {
  collapsed?: boolean;
}

export function YtSidebar({ collapsed = false }: YtSidebarProps) {
  const pathname = usePathname();

  if (collapsed) {
    return (
      <aside className="w-18 shrink-0 bg-[#141414] border-r border-[#222222] hidden md:flex flex-col items-center py-3 gap-5 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto select-none">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-[10px] w-14 transition-colors ${
            pathname === '/' ? 'text-[#9bf73c] bg-[#222222] font-bold' : 'text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#1f1f1f]'
          }`}
          title="Trang chủ"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span>Trang chủ</span>
        </Link>

        <Link
          href="/subscriptions"
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-[10px] w-14 transition-colors relative ${
            pathname === '/subscriptions' ? 'text-[#9bf73c] bg-[#222222] font-bold' : 'text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#1f1f1f]'
          }`}
          title="Kênh đăng ký"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <span>Đăng ký</span>
          <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-[#9bf73c]"></span>
        </Link>

        <Link
          href="/library"
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-[10px] w-14 transition-colors ${
            pathname === '/library' ? 'text-[#9bf73c] bg-[#222222] font-bold' : 'text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#1f1f1f]'
          }`}
          title="Bạn / Thư viện"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>Bạn</span>
        </Link>

        <Link
          href="/playlists"
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-[10px] w-14 transition-colors ${
            pathname?.startsWith('/playlists') ? 'text-[#9bf73c] bg-[#222222] font-bold' : 'text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#1f1f1f]'
          }`}
          title="Danh sách phát"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          <span>Playlist</span>
        </Link>
      </aside>
    );
  }

  return (
    <aside className="w-60 shrink-0 bg-[#141414] border-r border-[#222222] hidden lg:flex flex-col px-3 py-3 gap-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto select-none">
      {/* SECTION 1: Điều hướng chính */}
      <div className="space-y-1 text-xs">
        <Link
          href="/"
          className={`flex items-center gap-4 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
            pathname === '/' ? 'bg-[#222222] text-[#9bf73c]' : 'text-[#aaa] hover:bg-[#1f1f1f] hover:text-[#ececec]'
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span>Trang chủ</span>
        </Link>

        <Link
          href="/subscriptions"
          className={`flex items-center gap-4 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
            pathname === '/subscriptions' ? 'bg-[#222222] text-[#9bf73c]' : 'text-[#aaa] hover:bg-[#1f1f1f] hover:text-[#ececec]'
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <span>Kênh đăng ký</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-[#9bf73c]"></span>
        </Link>
      </div>

      <hr className="border-[#222222]" />

      {/* SECTION 2: Bạn / Người dùng */}
      <div className="space-y-1 text-xs">
        <Link
          href="/library"
          className="flex items-center justify-between px-3 py-1 font-bold text-[#ececec] hover:text-[#9bf73c] transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span>Bạn</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
          </span>
        </Link>

        <Link
          href="/channel/tranhoangminh"
          className={`flex items-center gap-4 px-3 py-2 rounded-xl transition-colors ${
            pathname?.startsWith('/channel') ? 'bg-[#222222] text-[#9bf73c]' : 'text-[#aaa] hover:bg-[#1f1f1f] hover:text-[#ececec]'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span>Kênh của bạn</span>
        </Link>

        <Link
          href="/history"
          className={`flex items-center gap-4 px-3 py-2 rounded-xl transition-colors ${
            pathname === '/history' ? 'bg-[#222222] text-[#9bf73c]' : 'text-[#aaa] hover:bg-[#1f1f1f] hover:text-[#ececec]'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Lịch sử xem</span>
        </Link>

        <Link
          href="/playlists"
          className={`flex items-center gap-4 px-3 py-2 rounded-xl transition-colors ${
            pathname === '/playlists' ? 'bg-[#222222] text-[#9bf73c]' : 'text-[#aaa] hover:bg-[#1f1f1f] hover:text-[#ececec]'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          <span>Danh sách phát</span>
        </Link>

        <Link
          href="/library#discussions"
          className="flex items-center gap-4 px-3 py-2 rounded-xl text-[#aaa] hover:bg-[#1f1f1f] hover:text-[#ececec] transition-colors"
        >
          <svg className="w-4 h-4 shrink-0 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <span>Thảo luận của bạn</span>
        </Link>
      </div>

      <hr className="border-[#222222]" />

      {/* SECTION 3: Kênh đã đăng ký */}
      <div className="space-y-2">
        <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#717171]">Kênh Đăng Ký</span>
        <div className="space-y-0.5 text-xs">
          <Link
            href="/channel/tranhoangminh"
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-[#1f1f1f] transition-colors group"
          >
            <div className="w-6 h-6 rounded-full bg-[#222] border border-[#333] flex items-center justify-center font-bold text-[10px] text-[#9bf73c] shrink-0">
              TM
            </div>
            <span className="truncate text-[#d4d4d4] group-hover:text-[#ececec]">Trần Hoàng Minh</span>
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#9bf73c]"></span>
          </Link>

          <Link
            href="/channel/mycasttech"
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-[#1f1f1f] transition-colors group"
          >
            <div className="w-6 h-6 rounded-full bg-[#222] border border-[#333] flex items-center justify-center font-bold text-[10px] text-[#3cc8f7] shrink-0">
              MC
            </div>
            <span className="truncate text-[#d4d4d4] group-hover:text-[#ececec]">MyCast Tech</span>
          </Link>

          <Link
            href="/channel/studiodesign"
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-[#1f1f1f] transition-colors group"
          >
            <div className="w-6 h-6 rounded-full bg-[#222] border border-[#333] flex items-center justify-center font-bold text-[10px] text-[#f7c93c] shrink-0">
              SD
            </div>
            <span className="truncate text-[#d4d4d4] group-hover:text-[#ececec]">Studio Design Lab</span>
          </Link>
        </div>
      </div>

      <hr className="border-[#222222]" />

      {/* Footer Info */}
      <div className="px-3 text-[10px] text-[#555] leading-relaxed mt-auto">
        MyCast 2026 • Thảo luận mở & Video<br />
        OpenDesign System
      </div>
    </aside>
  );
}
