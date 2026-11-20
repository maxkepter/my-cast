'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

interface YtNavbarProps {
  onToggleSidebar?: () => void;
  onSearch?: (query: string) => void;
}

export function YtNavbar({ onToggleSidebar, onSearch }: YtNavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Đóng dropdown menu người dùng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const displayName = user?.profile?.displayName || user?.username || 'Người dùng';
  const initial = displayName.charAt(0).toUpperCase();

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

      {/* KHỐI PHẢI: Actions & Trạng thái Đăng nhập / User Profile */}
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

        {/* Trạng thái xác thực */}
        {isLoading ? (
          <div className="h-9 w-9 rounded-full bg-[#2d2d2d] border border-[#3d3d3d] animate-pulse" />
        ) : isAuthenticated && user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-[#9bf73c]/50 transition-all focus:outline-none"
              title={displayName}
            >
              {user.profile?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile.avatar}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover border border-[#9bf73c]/40"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2d2d2d] border border-[#9bf73c]/50 text-xs font-bold text-[#9bf73c]">
                  {initial}
                </div>
              )}
            </button>

            {/* Dropdown Menu tài khoản */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[#3d3d3d] bg-[#222222] p-2 shadow-2xl shadow-black/80 z-50 text-left">
                {/* Header User Info */}
                <div className="flex items-center gap-3 p-3 border-b border-[#333]">
                  {user.profile?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profile.avatar}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover border border-[#9bf73c]"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2d2d2d] border border-[#9bf73c] text-sm font-bold text-[#9bf73c]">
                      {initial}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-[#ececec] truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-[#8a8a8a] truncate">
                      {user.email || `@${user.username}`}
                    </span>
                    {user.role === 'ADMIN' && (
                      <span className="mt-1 inline-flex items-center w-fit rounded-full bg-[#9bf73c]/10 px-2 py-0.5 text-[10px] font-bold text-[#9bf73c] border border-[#9bf73c]/30">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>

                {/* Danh sách hành động */}
                <div className="py-1 text-xs">
                  <Link
                    href={`/channel/${user.username || 'me'}`}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#ececec] hover:bg-[#2d2d2d] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Kênh của bạn</span>
                  </Link>

                  <Link
                    href="/library"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#ececec] hover:bg-[#2d2d2d] transition-colors"
                  >
                    <svg className="w-4 h-4 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Thư viện cá nhân</span>
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin/storage-nodes"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9bf73c] hover:bg-[#2d2d2d] transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Trang Quản trị Staff Portal</span>
                    </Link>
                  )}
                </div>

                <div className="pt-1 mt-1 border-t border-[#333]">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#ff5c5c] hover:bg-[#ff5c5c]/10 transition-colors text-xs font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Nút Đăng nhập */
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#9bf73c]/50 text-[#9bf73c] hover:bg-[#9bf73c]/10 text-xs font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </header>
  );
}
