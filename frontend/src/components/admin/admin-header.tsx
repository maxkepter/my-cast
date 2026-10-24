'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getBreadcrumbs = (): BreadcrumbSegment[] => {
    const base: BreadcrumbSegment[] = [{ label: 'Admin', href: '/admin' }];

    if (pathname === '/admin' || pathname === '/admin/') {
      return [...base, { label: 'Dashboard' }];
    }

    if (pathname.startsWith('/admin/storage-nodes')) {
      return [
        ...base,
        { label: 'Storage Management', href: '/admin/storage-nodes' },
        { label: 'Nodes' },
      ];
    }

    if (pathname.startsWith('/admin/videos')) {
      return [...base, { label: 'Media Management' }, { label: 'Videos' }];
    }

    if (pathname.startsWith('/admin/users')) {
      return [...base, { label: 'Accounts' }, { label: 'Users' }];
    }

    if (pathname.startsWith('/admin/settings')) {
      return [...base, { label: 'Configuration' }, { label: 'Settings' }];
    }

    const customSegment = pathname.replace('/admin/', '').split('/')[0];
    return [...base, { label: customSegment || 'Section' }];
  };

  const breadcrumbs = getBreadcrumbs();
  const displayName = user?.profile?.displayName || user?.username || 'Administrator';
  const displayRole = user?.role || 'ADMIN';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-[#525252]/40 bg-[#1c1c1c]/90 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs sm:text-sm">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;

            return (
              <React.Fragment key={`${crumb.label}-${idx}`}>
                {idx > 0 && (
                  <span className="text-[#525252] select-none">/</span>
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="text-[#8a8a8a] hover:text-[#9bf73c] transition-colors truncate max-w-[120px] sm:max-w-none"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={`truncate max-w-[140px] sm:max-w-none ${
                      isLast ? 'font-semibold text-[#ececec]' : 'text-[#8a8a8a]'
                    }`}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right Section: System Status & Profile Pill */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Cluster Status Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full border border-[#5aa616]/40 bg-[#2e5410]/30 px-2.5 py-1 text-xs font-medium text-[#9bf73c]"
            title="Tất cả dịch vụ cụm đang hoạt động ổn định"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9bf73c] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9bf73c]" />
            </span>
            <span className="hidden sm:inline">Cluster: Operational</span>
            <span className="sm:hidden">Cluster: OK</span>
          </div>

          {/* Admin Profile Pill */}
          <div className="flex items-center gap-2 rounded-xl border border-[#525252]/40 bg-[#2d2d2d] px-2.5 py-1.5 shadow-sm">
            {/* Avatar */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3d3d3d] text-xs font-bold text-[#9bf73c] border border-[#525252]/50">
              {initial}
            </div>

            {/* Name & Role */}
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-[#ececec] truncate max-w-[120px]">
                {displayName}
              </span>
              <span className="text-[10px] text-[#8a8a8a] font-mono">
                {user?.email || 'ops@mycast.vn'}
              </span>
            </div>

            {/* Role Badge */}
            <span className="inline-flex items-center rounded bg-[#2e5410] px-1.5 py-0.5 text-[10px] font-bold text-[#9bf73c] border border-[#5aa616]/40">
              {displayRole}
            </span>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="ml-1 rounded-lg p-1 text-[#8a8a8a] hover:bg-[#3d3d3d] hover:text-[#ff5c5c] transition-colors"
              title="Đăng xuất khỏi Staff Portal"
              aria-label="Đăng xuất"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
