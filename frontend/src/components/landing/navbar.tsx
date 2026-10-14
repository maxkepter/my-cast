'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#525252] bg-[#1c1c1c]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9bf73c] text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20 group-hover:scale-105 transition-transform font-bold">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#ececec] flex items-center gap-1.5">
              My-Cast
              <span className="inline-flex items-center rounded-full bg-[#2e5410] px-1.5 py-0.5 text-[10px] font-semibold text-[#9bf73c] border border-[#5aa616]/40">
                LIVE
              </span>
            </span>
            <span className="text-[11px] text-[#8a8a8a] font-medium -mt-1">Studio Platform</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8a8a8a]">
          <a href="#features" className="hover:text-[#9bf73c] transition-colors">
            Tính năng
          </a>
          <a href="#live-preview" className="hover:text-[#9bf73c] transition-colors">
            Phòng thu Livestream
          </a>
          <a href="#stats" className="hover:text-[#9bf73c] transition-colors">
            Chỉ số
          </a>
          <a href="#pricing" className="hover:text-[#9bf73c] transition-colors">
            Bảng giá
          </a>
        </nav>

        {/* Auth CTA or User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-[#3d3d3d] flex items-center justify-center text-[#9bf73c] font-semibold text-sm border border-[#525252]">
                  {user.profile?.displayName
                    ? user.profile.displayName.charAt(0).toUpperCase()
                    : user.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-[#ececec] leading-tight">
                    {user.profile?.displayName || user.username}
                  </span>
                  <span className="text-[11px] text-[#8a8a8a] leading-tight capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-[#525252] px-3 py-1.5 text-xs font-medium text-[#ececec] hover:bg-[#3d3d3d] hover:text-[#9bf73c] transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-[#ececec] hover:text-[#9bf73c] transition-colors px-3 py-2"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#9bf73c] px-4 py-2 text-sm font-semibold text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20 hover:bg-[#b6fa6b] active:bg-[#7ad81f] transition-colors"
              >
                Bắt đầu phát sóng
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#8a8a8a] hover:text-[#ececec] p-2"
            aria-label="Toggle Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#525252] bg-[#1c1c1c] px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-[#8a8a8a]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#9bf73c] transition-colors"
            >
              Tính năng
            </a>
            <a
              href="#live-preview"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#9bf73c] transition-colors"
            >
              Phòng thu Livestream
            </a>
            <a
              href="#stats"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-[#9bf73c] transition-colors"
            >
              Chỉ số
            </a>
          </nav>
          <div className="pt-3 border-t border-[#525252]">
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-3">
                <span className="text-sm text-[#8a8a8a]">
                  Tài khoản: <strong className="text-[#ececec]">{user.profile?.displayName || user.username}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-center rounded-lg border border-[#525252] py-2 text-sm font-medium text-[#ececec] hover:bg-[#3d3d3d]"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-lg border border-[#525252] py-2 text-sm font-medium text-[#ececec] hover:bg-[#3d3d3d]"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center rounded-lg bg-[#9bf73c] py-2 text-sm font-semibold text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20"
                >
                  Bắt đầu phát sóng
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
