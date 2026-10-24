'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Tự động chuyển hướng về trang Quản lý Storage Nodes
    router.replace('/admin/storage-nodes');
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#ececec]">
            Trung tâm Điều hành Hệ thống
          </h1>
          <p className="text-sm text-[#8a8a8a] mt-1">
            Tổng quan hạ tầng phân tán, quản trị tài nguyên lưu trữ và luồng phân phối video MyCast.
          </p>
        </div>

        <Link
          href="/admin/storage-nodes"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9bf73c] px-4 py-2.5 text-sm font-semibold text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/20 hover:bg-[#b6fa6b] transition-colors"
        >
          <span>Đến Quản lý Storage Nodes</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>

      {/* Quick Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Storage Nodes Card */}
        <div className="rounded-2xl border border-[#525252]/40 bg-[#2d2d2d] p-5 shadow-sm hover:border-[#9bf73c]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Lưu trữ & Phân phối
            </span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#9bf73c]" />
          </div>
          <div className="mt-3">
            <h2 className="text-lg font-bold text-[#ececec]">Storage Nodes</h2>
            <p className="text-xs text-[#8a8a8a] mt-1">
              Quản lý các cụm S3/MinIO, kiểm soát quota và kiểm tra sức khỏe bucket.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#525252]/40 flex items-center justify-between">
            <span className="text-xs font-medium text-[#9bf73c]">Trạng thái: Hoạt động</span>
            <Link
              href="/admin/storage-nodes"
              className="text-xs font-semibold text-[#ececec] hover:text-[#9bf73c] transition-colors"
            >
              Truy cập ngay →
            </Link>
          </div>
        </div>

        {/* Video Processing Card (Coming Soon) */}
        <div className="rounded-2xl border border-[#525252]/40 bg-[#2d2d2d]/60 p-5 shadow-sm opacity-75">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Mã hóa & HLS
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#3d3d3d] text-[#8a8a8a]">
              Sắp có
            </span>
          </div>
          <div className="mt-3">
            <h2 className="text-lg font-bold text-[#ececec]">Video Transcoder</h2>
            <p className="text-xs text-[#8a8a8a] mt-1">
              Hàng đợi xử lý RabbitMQ / FFmpeg đa độ phân giải thích ứng bitrate (ABR).
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#525252]/40">
            <span className="text-xs text-[#8a8a8a]">Đang kết nối worker transcode...</span>
          </div>
        </div>

        {/* Operations & Security */}
        <div className="rounded-2xl border border-[#525252]/40 bg-[#2d2d2d]/60 p-5 shadow-sm opacity-75">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Bảo mật & Người dùng
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#3d3d3d] text-[#8a8a8a]">
              Sắp có
            </span>
          </div>
          <div className="mt-3">
            <h2 className="text-lg font-bold text-[#ececec]">Access & Roles</h2>
            <p className="text-xs text-[#8a8a8a] mt-1">
              Phân quyền nhân viên kỹ thuật, theo dõi phiên hoạt động và nhật ký audit log.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-[#525252]/40">
            <span className="text-xs text-[#8a8a8a]">Admin RoleGuard kích hoạt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
