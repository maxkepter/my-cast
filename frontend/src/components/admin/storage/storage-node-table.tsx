'use client';

import React from 'react';
import { StorageNode } from '@/types/storage-admin';
import { formatBytes } from '@/services/storage-admin.service';

interface StorageNodeTableProps {
  nodes: StorageNode[];
  isLoading?: boolean;
  onProbe: (nodeId: string) => Promise<void> | void;
  probingNodeId?: string | null;
  onToggleActive: (node: StorageNode) => Promise<void> | void;
  togglingNodeId?: string | null;
  onViewDetail: (node: StorageNode) => void;
  onEdit: (node: StorageNode) => void;
  onDelete: (node: StorageNode) => void;
}

export function StorageNodeTable({
  nodes,
  isLoading = false,
  onProbe,
  probingNodeId = null,
  onToggleActive,
  togglingNodeId = null,
  onViewDetail,
  onEdit,
  onDelete,
}: StorageNodeTableProps) {
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
      <div className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#525252] border-t-[#9bf73c] mb-3" />
        <p className="text-sm text-[#8a8a8a]">Đang tải danh sách Storage Node...</p>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#3d3d3d] flex items-center justify-center text-[#8a8a8a]">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="6" rx="2" strokeWidth="2" />
            <rect x="2" y="11" width="20" height="6" rx="2" strokeWidth="2" />
            <rect x="2" y="19" width="20" height="4" rx="1" strokeWidth="2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-[#ececec] mb-1">
          Không tìm thấy Storage Node nào
        </h3>
        <p className="text-sm text-[#8a8a8a] max-w-sm mx-auto">
          Chưa có cụm lưu trữ nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ================= DESKTOP TABLE VIEW ================= */}
      <div className="hidden md:block overflow-hidden bg-[#2d2d2d] border border-[#525252]/60 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#ececec]">
            <thead className="bg-[#1c1c1c] text-xs uppercase tracking-wider text-[#8a8a8a] border-b border-[#525252]/60">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Node Info
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Endpoint & Bucket
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Dung lượng (Used / Quota)
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium text-center">
                  Sức khỏe
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium text-center">
                  Kích hoạt
                </th>
                <th scope="col" className="px-5 py-3.5 font-medium text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#525252]/40">
              {nodes.map((node) => {
                const quota = node.quotaBytes || 0;
                const used = node.usedBytes || 0;
                const ratio = quota > 0 ? used / quota : 0;
                const percent = Math.min(100, Math.round(ratio * 100));
                const isProbing = probingNodeId === node.nodeId;
                const isToggling = togglingNodeId === node.nodeId;

                return (
                  <tr
                    key={node.nodeId}
                    className="hover:bg-[#3d3d3d]/50 transition-colors group"
                  >
                    {/* Node Info */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#ececec] group-hover:text-[#9bf73c] transition-colors">
                        {node.name}
                      </div>
                      <div className="font-mono text-xs text-[#8a8a8a] mt-0.5">
                        {node.nodeId}
                      </div>
                    </td>

                    {/* S3 Endpoint & Bucket */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-[#d4d4d4] truncate max-w-[200px]" title={node.endpoint}>
                          {node.endpoint}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#8a8a8a] flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-[#8a8a8a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          {node.bucket}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#3d3d3d] text-[#8a8a8a] border border-[#525252]/40">
                          {node.region}
                        </span>
                      </div>
                    </td>

                    {/* Quota Progress */}
                    <td className="px-5 py-4 min-w-[200px]">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[#ececec] font-medium">
                          {formatBytes(used)} / {formatBytes(quota)}
                        </span>
                        <span className={`font-semibold ${getProgressTextColor(ratio)}`}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(
                            ratio
                          )}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    {/* Health Badge & Quick Probe */}
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        {node.isHealthy ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#9bf73c]/10 text-[#9bf73c] border border-[#9bf73c]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9bf73c] animate-pulse" />
                            Khỏe mạnh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#ff5c5c]/10 text-[#ff5c5c] border border-[#ff5c5c]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5c5c]" />
                            Mất kết nối
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onProbe(node.nodeId)}
                          disabled={isProbing}
                          title="Probe Health Check ngay"
                          className="p-1 rounded-md text-[#8a8a8a] hover:text-[#9bf73c] hover:bg-[#3d3d3d] transition-colors disabled:opacity-50"
                        >
                          <svg
                            className={`w-4 h-4 ${isProbing ? 'animate-spin text-[#9bf73c]' : ''}`}
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
                        </button>
                      </div>
                    </td>

                    {/* Active Toggle */}
                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={node.isActive}
                        disabled={isToggling}
                        onClick={() => onToggleActive(node)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#9bf73c] disabled:opacity-50 ${
                          node.isActive ? 'bg-[#9bf73c]' : 'bg-[#525252]'
                        }`}
                        title={node.isActive ? 'Đang kích hoạt (Bấm để tắt)' : 'Đang tạm dừng (Bấm để bật)'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#1c1c1c] shadow ring-0 transition duration-200 ease-in-out ${
                            node.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Drawer Detail */}
                        <button
                          type="button"
                          onClick={() => onViewDetail(node)}
                          className="p-1.5 text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#3d3d3d] rounded-lg transition-colors"
                          title="Xem chi tiết kỹ thuật"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEdit(node)}
                          className="p-1.5 text-[#8a8a8a] hover:text-[#9bf73c] hover:bg-[#3d3d3d] rounded-lg transition-colors"
                          title="Chỉnh sửa cấu hình"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDelete(node)}
                          className="p-1.5 text-[#8a8a8a] hover:text-[#ff5c5c] hover:bg-[#3d3d3d] rounded-lg transition-colors"
                          title="Xóa node lưu trữ"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MOBILE CARD VIEW ================= */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {nodes.map((node) => {
          const quota = node.quotaBytes || 0;
          const used = node.usedBytes || 0;
          const ratio = quota > 0 ? used / quota : 0;
          const percent = Math.min(100, Math.round(ratio * 100));
          const isProbing = probingNodeId === node.nodeId;
          const isToggling = togglingNodeId === node.nodeId;

          return (
            <div
              key={node.nodeId}
              className="bg-[#2d2d2d] border border-[#525252]/60 rounded-xl p-4 shadow-sm space-y-3"
            >
              {/* Header: Name + Badges */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-[#ececec] text-base">{node.name}</h4>
                  <p className="font-mono text-xs text-[#8a8a8a]">{node.nodeId}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {node.isHealthy ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#9bf73c]/10 text-[#9bf73c] border border-[#9bf73c]/30">
                      Healthy
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ff5c5c]/10 text-[#ff5c5c] border border-[#ff5c5c]/30">
                      Error
                    </span>
                  )}
                </div>
              </div>

              {/* Endpoint & Bucket */}
              <div className="bg-[#1c1c1c] p-2.5 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between text-[#8a8a8a]">
                  <span>Endpoint:</span>
                  <span className="font-mono text-[#d4d4d4] truncate max-w-[200px]" title={node.endpoint}>
                    {node.endpoint}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8a8a8a]">
                  <span>Bucket / Region:</span>
                  <span className="text-[#ececec]">
                    {node.bucket} ({node.region})
                  </span>
                </div>
              </div>

              {/* Capacity Progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8a8a8a]">Dung lượng:</span>
                  <span className="font-medium text-[#ececec]">
                    {formatBytes(used)} / {formatBytes(quota)} ({percent}%)
                  </span>
                </div>
                <div className="w-full bg-[#1c1c1c] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getProgressBarColor(ratio)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Footer: Active Switch + Actions */}
              <div className="pt-2 border-t border-[#525252]/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8a8a8a]">Kích hoạt:</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={node.isActive}
                    disabled={isToggling}
                    onClick={() => onToggleActive(node)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                      node.isActive ? 'bg-[#9bf73c]' : 'bg-[#525252]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#1c1c1c] shadow ring-0 transition duration-200 ease-in-out ${
                        node.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onProbe(node.nodeId)}
                    disabled={isProbing}
                    className="p-2 text-[#8a8a8a] hover:text-[#9bf73c] bg-[#3d3d3d] rounded-lg text-xs"
                    title="Probe Health"
                  >
                    <svg
                      className={`w-4 h-4 ${isProbing ? 'animate-spin text-[#9bf73c]' : ''}`}
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
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewDetail(node)}
                    className="p-2 text-[#8a8a8a] hover:text-[#ececec] bg-[#3d3d3d] rounded-lg text-xs"
                    title="Chi tiết"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(node)}
                    className="p-2 text-[#8a8a8a] hover:text-[#9bf73c] bg-[#3d3d3d] rounded-lg text-xs"
                    title="Sửa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(node)}
                    className="p-2 text-[#8a8a8a] hover:text-[#ff5c5c] bg-[#3d3d3d] rounded-lg text-xs"
                    title="Xóa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
