'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { tokenService } from '@/lib/token';
import { AdminAuthStatus, AdminGuardProps } from '@/types/admin-auth';

export { type AdminGuardProps };
export { AdminShell } from './admin-shell';

export function useAdminAuth(): AdminAuthStatus {
  const { user, isAuthenticated, isLoading } = useAuth();
  return {
    isAdmin: user?.role === 'ADMIN',
    isAuthenticated,
    isLoading,
    user,
  };
}

function AdminGuardContent({ children, fallbackUrl = '/admin/login' }: AdminGuardProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isRoleAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (pathname && !pathname.startsWith(fallbackUrl)) {
        const query = searchParams?.toString();
        const fullPath = query ? `${pathname}?${query}` : pathname;
        router.replace(`${fallbackUrl}?redirect=${encodeURIComponent(fullPath)}`);
      }
    }
  }, [isLoading, isAuthenticated, pathname, searchParams, fallbackUrl, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#141414] text-[#ececec]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3d3d3d] border-t-[#9bf73c]" />
          <p className="text-sm text-[#8a8a8a]">Đang xác thực quyền quản trị...</p>
        </div>
      </div>
    );
  }

  // Bypass on fallbackUrl (e.g. /admin/login)
  if (pathname && pathname.startsWith(fallbackUrl)) {
    return <>{children}</>;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#141414] text-[#ececec]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3d3d3d] border-t-[#9bf73c]" />
          <p className="text-sm text-[#8a8a8a]">Đang chuyển hướng đến cổng đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Authenticated but NOT ADMIN (403 Forbidden)
  if (!isRoleAdmin) {
    const handleSwitchAccount = () => {
      tokenService.clearTokens();
      logout();
      window.location.href = fallbackUrl;
    };

    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#141414] p-4 text-[#ececec]">
        <div className="w-full max-w-md rounded-2xl border border-[#525252] bg-[#2d2d2d] p-8 shadow-2xl shadow-black/60 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#ff5c5c]/40 bg-[#ff5c5c]/10 text-[#ff5c5c]">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="mb-2 inline-flex items-center rounded-full border border-[#ff5c5c]/30 bg-[#ff5c5c]/10 px-3 py-1 text-xs font-semibold text-[#ff5c5c]">
            403 Forbidden
          </div>

          <h1 className="mt-2 text-xl font-bold text-[#ececec]">Quyền truy cập bị từ chối</h1>
          <p className="mt-2 text-sm text-[#8a8a8a]">
            Tài khoản không có quyền truy cập Staff Portal.
          </p>

          <div className="my-5 rounded-xl border border-[#3d3d3d] bg-[#1c1c1c] p-3 text-left text-xs space-y-1">
            <div className="text-[#8a8a8a]">
              Tài khoản hiện tại: <span className="font-medium text-[#ececec]">{user?.username}</span>
            </div>
            <div className="text-[#8a8a8a]">
              Vai trò: <span className="font-semibold text-[#f7c93c]">{user?.role || 'UNKNOWN'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#9bf73c] py-2.5 text-sm font-semibold text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20 hover:bg-[#b6fa6b] active:bg-[#7ad81f] transition-colors"
            >
              Đăng xuất / Đổi tài khoản
            </button>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl border border-[#525252] bg-[#3d3d3d] py-2.5 text-sm font-medium text-[#ececec] hover:bg-[#525252] transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and is ADMIN
  return <>{children}</>;
}

export function AdminGuard(props: AdminGuardProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#141414] text-[#ececec]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3d3d3d] border-t-[#9bf73c]" />
            <p className="text-sm text-[#8a8a8a]">Đang khởi tạo...</p>
          </div>
        </div>
      }
    >
      <AdminGuardContent {...props} />
    </Suspense>
  );
}
