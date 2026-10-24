'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  title: string;
  href: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  badge?: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: ({ className = 'h-5 w-5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    title: 'Storage Nodes',
    href: '/admin/storage-nodes',
    icon: ({ className = 'h-5 w-5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Quản lý Video',
    href: '/admin/videos',
    disabled: true,
    badge: 'Sắp có',
    icon: ({ className = 'h-5 w-5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Người dùng',
    href: '/admin/users',
    disabled: true,
    badge: 'Sắp có',
    icon: ({ className = 'h-5 w-5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    title: 'Cài đặt',
    href: '/admin/settings',
    disabled: true,
    badge: 'Sắp có',
    icon: ({ className = 'h-5 w-5' }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] text-[#ececec]">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-3 md:px-5 border-b border-[#525252]/40 gap-3">
        <Link href="/admin" className="flex items-center gap-3 group min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9bf73c] text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20 group-hover:scale-105 transition-transform font-bold">
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
          <div className="hidden md:flex flex-col min-w-0">
            <span className="text-base font-bold tracking-tight text-[#ececec] flex items-center gap-1.5 truncate">
              MyCast
              <span className="inline-flex items-center rounded bg-[#2e5410] px-1.5 py-0.2 text-[10px] font-semibold text-[#9bf73c] border border-[#5aa616]/40 uppercase">
                Admin
              </span>
            </span>
            <span className="text-[11px] text-[#8a8a8a] font-medium -mt-0.5 truncate">
              Operations Hub
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 md:px-3 space-y-1.5 overflow-y-auto">
        <div className="hidden md:block px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a8a]">
          Quản trị hệ thống
        </div>
        {navItems.map((item) => {
          const active = isItemActive(item.href);
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#525252] cursor-not-allowed select-none justify-center md:justify-start"
                title={`${item.title} (Sắp ra mắt)`}
              >
                <Icon className="h-5 w-5 shrink-0 text-[#525252]" />
                <span className="hidden md:inline truncate">{item.title}</span>
                {item.badge && (
                  <span className="hidden md:inline-block ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#2d2d2d] text-[#8a8a8a] border border-[#525252]/30">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 justify-center md:justify-start ${
                active
                  ? 'bg-[#2d2d2d] text-[#ececec] shadow-sm'
                  : 'text-[#8a8a8a] hover:bg-[#2d2d2d]/50 hover:text-[#ececec]'
              }`}
            >
              {/* Active left indicator bar */}
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#9bf73c]" />
              )}
              <Icon
                className={`h-5 w-5 shrink-0 transition-colors ${
                  active ? 'text-[#9bf73c]' : 'text-[#8a8a8a] group-hover:text-[#ececec]'
                }`}
              />
              <span className="hidden md:inline truncate">{item.title}</span>
              {item.badge && (
                <span className="hidden md:inline-block ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#9bf73c]/10 text-[#9bf73c] border border-[#9bf73c]/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Portal Return */}
      <div className="p-2 md:p-3 border-t border-[#525252]/40">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8a8a8a] hover:bg-[#2d2d2d]/60 hover:text-[#ececec] transition-colors justify-center md:justify-start"
          title="Về trang chủ MyCast"
        >
          <svg
            className="h-5 w-5 shrink-0"
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
          <span className="hidden md:inline truncate">Về Trang chủ</span>
        </Link>
      </div>
    </div>
  );
}
