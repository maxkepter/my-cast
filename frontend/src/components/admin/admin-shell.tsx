'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/admin/admin-guard';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

interface AdminShellProps {
  children: React.ReactNode;
  fallbackUrl?: string;
}

export function AdminShell({ children, fallbackUrl = '/admin/login' }: AdminShellProps) {
  const pathname = usePathname();
  const isFallbackPage = pathname ? pathname.startsWith(fallbackUrl) : false;

  return (
    <AdminGuard fallbackUrl={fallbackUrl}>
      {isFallbackPage ? (
        children
      ) : (
        <div className="min-h-screen bg-[#141414] text-[#ececec] flex flex-col md:flex-row">
          {/* Left Column: Fixed / Sticky Responsive Sidebar */}
          <aside className="w-16 md:w-64 shrink-0 border-r border-[#525252]/40 bg-[#141414] flex flex-col transition-all duration-200 sticky top-0 h-screen z-40">
            <AdminSidebar />
          </aside>

          {/* Right Column: Header & Scrollable Content Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#1c1c1c]">
            <AdminHeader />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
