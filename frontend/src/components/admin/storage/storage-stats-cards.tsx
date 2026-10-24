'use client';

import React from 'react';
import { StorageNode } from '@/types/storage-admin';
import { formatBytes } from '@/services/storage-admin.service';

interface StorageStatsCardsProps {
  nodes: StorageNode[];
  isLoading?: boolean;
}

export function StorageStatsCards({ nodes, isLoading = false }: StorageStatsCardsProps) {
  const totalNodes = nodes.length;
  const healthyCount = nodes.filter((n) => n.isHealthy).length;
  const healthyPercent = totalNodes > 0 ? Math.round((healthyCount / totalNodes) * 100) : 0;
  const activeCount = nodes.filter((n) => n.isActive).length;

  const totalQuotaBytes = nodes.reduce((sum, n) => sum + (n.quotaBytes || 0), 0);
  const totalUsedBytes = nodes.reduce((sum, n) => sum + (n.usedBytes || 0), 0);
  const usageRatio = totalQuotaBytes > 0 ? totalUsedBytes / totalQuotaBytes : 0;
  const usagePercent = Math.min(100, Math.round(usageRatio * 100));

  // Threshold colors: <70% #9bf73c, 70-90% #f7c93c, >90% #ff5c5c
  const getProgressBarColor = (ratio: number) => {
    if (ratio > 0.9) return 'bg-[#ff5c5c]';
    if (ratio >= 0.7) return 'bg-[#f7c93c]';
    return 'bg-[#9bf73c]';
  };

  const getProgressTextColor = (ratio: number) => {
    if (ratio > 0.9) return 'text-[#ff5c5c]';
    if (ratio >= 0.7) return 'text-[#f7c93c]';
    return 'text-[#9bf73c]';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-5 animate-pulse"
          >
            <div className="h-4 w-28 bg-[#3d3d3d] rounded mb-3" />
            <div className="h-8 w-20 bg-[#3d3d3d] rounded mb-2" />
            <div className="h-3 w-36 bg-[#3d3d3d] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng số Node */}
      <div className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-5 shadow-sm hover:border-[#9bf73c]/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8a8a8a]">
            Tổng số Node
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#3d3d3d] flex items-center justify-center text-[#ececec]">
            <svg
              className="w-4 h-4 text-[#9bf73c]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="3" width="20" height="6" rx="2" strokeWidth="2" />
              <rect x="2" y="11" width="20" height="6" rx="2" strokeWidth="2" />
              <rect x="2" y="19" width="20" height="4" rx="1" strokeWidth="2" />
              <circle cx="6" cy="6" r="1" fill="currentColor" />
              <circle cx="6" cy="14" r="1" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#ececec]">{totalNodes}</span>
          <span className="text-xs text-[#8a8a8a]">cụm lưu trữ</span>
        </div>
        <p className="mt-2 text-xs text-[#8a8a8a]">Được đăng ký trong hệ thống</p>
      </div>

      {/* 2. Trạng thái Sức khỏe */}
      <div className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-5 shadow-sm hover:border-[#9bf73c]/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8a8a8a]">
            Trạng thái Sức khỏe
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#3d3d3d] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[#9bf73c]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#9bf73c]">{healthyPercent}%</span>
          <span className="text-xs text-[#8a8a8a]">
            ({healthyCount}/{totalNodes} healthy)
          </span>
        </div>
        <p className="mt-2 text-xs text-[#8a8a8a]">
          {totalNodes - healthyCount > 0 ? (
            <span className="text-[#ff5c5c] font-medium">
              {totalNodes - healthyCount} node gặp sự cố kết nối
            </span>
          ) : (
            <span className="text-[#9bf73c]">100% node phản hồi tốt</span>
          )}
        </p>
      </div>

      {/* 3. Node đang Hoạt động */}
      <div className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-5 shadow-sm hover:border-[#9bf73c]/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8a8a8a]">
            Đang hoạt động (Active)
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#3d3d3d] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[#3cc8f7]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" strokeWidth="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#ececec]">{activeCount}</span>
          <span className="text-xs text-[#8a8a8a]">/ {totalNodes} node</span>
        </div>
        <p className="mt-2 text-xs text-[#8a8a8a]">
          {activeCount === totalNodes
            ? 'Tất cả node sẵn sàng tiếp nhận dữ liệu'
            : `${totalNodes - activeCount} node đang tạm dừng`}
        </p>
      </div>

      {/* 4. Tổng Dung lượng Cụm */}
      <div className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-5 shadow-sm hover:border-[#9bf73c]/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8a8a8a]">
            Dung lượng Cụm
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#3d3d3d] flex items-center justify-center">
            <svg
              className="w-4 h-4 text-[#9bf73c]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 7v10c0 2 3.5 3 8 3s8-1 8-3V7M4 7c0 2 3.5 3 8 3s8-1 8-3M4 7c0-2 3.5-3 8-3s8 1 8 3m0 5c0 2-3.5 3-8 3s-8-1-8-3"
              />
            </svg>
          </div>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-semibold text-[#ececec]">
            {formatBytes(totalUsedBytes)} / {formatBytes(totalQuotaBytes)}
          </span>
          <span className={`text-xs font-bold ${getProgressTextColor(usageRatio)}`}>
            {usagePercent}%
          </span>
        </div>
        {/* Progress bar with color thresholds */}
        <div className="w-full bg-[#1c1c1c] h-2 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full transition-all duration-300 rounded-full ${getProgressBarColor(
              usageRatio
            )}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#8a8a8a]">
          Còn trống {formatBytes(Math.max(0, totalQuotaBytes - totalUsedBytes))}
        </p>
      </div>
    </div>
  );
}
