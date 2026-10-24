'use client';

import React from 'react';

interface StorageNodeFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'healthy' | 'unhealthy';
  onStatusFilterChange: (status: 'all' | 'healthy' | 'unhealthy') => void;
  activeFilter: 'all' | 'active' | 'inactive';
  onActiveFilterChange: (active: 'all' | 'active' | 'inactive') => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenCreateModal: () => void;
}

export function StorageNodeFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  activeFilter,
  onActiveFilterChange,
  onRefresh,
  isRefreshing = false,
  onOpenCreateModal,
}: StorageNodeFilterBarProps) {
  return (
    <div className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8a8a8a]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên node, node ID, bucket..."
          className="w-full pl-9 pr-8 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c] transition-colors"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8a8a8a] hover:text-[#ececec]"
            title="Xóa tìm kiếm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter Tabs */}
        <div className="bg-[#1c1c1c] p-1 rounded-lg border border-[#525252]/40 flex items-center text-xs">
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#2d2d2d] text-[#ececec] shadow-sm'
                : 'text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('healthy')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              statusFilter === 'healthy'
                ? 'bg-[#2d2d2d] text-[#9bf73c] shadow-sm'
                : 'text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#9bf73c]" />
            Khỏe mạnh
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange('unhealthy')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors ${
              statusFilter === 'unhealthy'
                ? 'bg-[#2d2d2d] text-[#ff5c5c] shadow-sm'
                : 'text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5c5c]" />
            Gặp lỗi
          </button>
        </div>

        {/* Active Filter Dropdown */}
        <select
          value={activeFilter}
          onChange={(e) =>
            onActiveFilterChange(e.target.value as 'all' | 'active' | 'inactive')
          }
          className="bg-[#3d3d3d] border border-[#525252] text-xs font-medium text-[#ececec] rounded-lg px-3 py-2 focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c] cursor-pointer"
        >
          <option value="all">Mọi trạng thái hoạt động</option>
          <option value="active">Đang kích hoạt</option>
          <option value="inactive">Tạm dừng</option>
        </select>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 bg-[#3d3d3d] hover:bg-[#525252] border border-[#525252] rounded-lg text-[#ececec] transition-colors disabled:opacity-50"
          title="Làm mới dữ liệu"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9bf73c]' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* + Thêm Storage Node mới CTA Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#9bf73c] hover:bg-[#b6fa6b] text-[#1c1c1c] text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Thêm Storage Node</span>
        </button>
      </div>
    </div>
  );
}
