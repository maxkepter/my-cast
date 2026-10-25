'use client';

import React, { useState } from 'react';
import { StorageNode } from '@/types/storage-admin';
import { formatBytes, getStorageNodeWebhookUrl } from '@/services/storage-admin.service';

interface StorageNodeDetailDrawerProps {
  isOpen: boolean;
  node: StorageNode | null;
  onClose: () => void;
  onProbe: (nodeId: string) => Promise<void> | void;
  isProbing?: boolean;
  onOpenWebhookGuide?: (node: StorageNode) => void;
}

export function StorageNodeDetailDrawer({
  isOpen,
  node,
  onClose,
  onProbe,
  isProbing = false,
  onOpenWebhookGuide,
}: StorageNodeDetailDrawerProps) {
  const [isCopiedWebhook, setIsCopiedWebhook] = useState(false);

  if (!isOpen || !node) return null;

  const webhookUrl = getStorageNodeWebhookUrl(node.nodeId);

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setIsCopiedWebhook(true);
      setTimeout(() => setIsCopiedWebhook(false), 2000);
    } catch {
      // fallback
    }
  };

  const quota = node.quotaBytes || 0;
  const used = node.usedBytes || 0;
  const available = Math.max(0, quota - used);
  const ratio = quota > 0 ? used / quota : 0;
  const percent = Math.min(100, Math.round(ratio * 100));

  const getProgressBarColor = (r: number) => {
    if (r > 0.9) return 'bg-[#ff5c5c]';
    if (r >= 0.7) return 'bg-[#f7c93c]';
    return 'bg-[#9bf73c]';
  };

  const getProgressTextColor = (r: number) => {
    if (r > 0.9) return 'text-[#ff5c5c]';
    if (r >= 0.7) return 'text-[#f7c93c]';
    return 'text-[#9bf73c]';
  };

  const formattedDate = node.createdAt
    ? new Date(node.createdAt).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Không xác định';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md md:max-w-lg bg-[#2d2d2d] border-l border-[#525252] h-full shadow-2xl flex flex-col text-[#ececec] overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#525252]/60 bg-[#1c1c1c] sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-semibold tracking-wider text-[#9bf73c]">
                Chi Tiết Storage Node
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#ececec]">{node.name}</h3>
            <p className="font-mono text-xs text-[#8a8a8a]">{node.nodeId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8a8a8a] hover:text-[#ececec] p-2 rounded-lg hover:bg-[#3d3d3d] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Status Badges & Quick Action */}
          <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#525252]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {node.isHealthy ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#9bf73c]/10 text-[#9bf73c] border border-[#9bf73c]/30">
                  <span className="w-2 h-2 rounded-full bg-[#9bf73c] animate-pulse" />
                  Khỏe mạnh
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ff5c5c]/10 text-[#ff5c5c] border border-[#ff5c5c]/30">
                  <span className="w-2 h-2 rounded-full bg-[#ff5c5c]" />
                  Mất kết nối
                </span>
              )}

              {node.isActive ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#3cc8f7]/10 text-[#3cc8f7] border border-[#3cc8f7]/30">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#525252]/40 text-[#8a8a8a] border border-[#525252]">
                  Inactive
                </span>
              )}
            </div>

            {/* Probe Button inside Drawer */}
            <button
              type="button"
              onClick={() => onProbe(node.nodeId)}
              disabled={isProbing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3d3d3d] hover:bg-[#525252] text-[#ececec] hover:text-[#9bf73c] text-xs font-medium rounded-lg border border-[#525252] transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin text-[#9bf73c]' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{isProbing ? 'Đang probe...' : 'Kiểm tra kết nối'}</span>
            </button>
          </div>

          {/* Section 1: Dung lượng & Quota */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9bf73c]">
              Dung Lượng & Khả Năng Lưu Trữ
            </h4>
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#525252]/40 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#8a8a8a]">Tiến độ sử dụng:</span>
                  <span className={`font-bold ${getProgressTextColor(ratio)}`}>
                    {percent}%
                  </span>
                </div>
                <div className="w-full bg-[#2d2d2d] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(
                      ratio
                    )}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#525252]/40 text-xs">
                <div>
                  <span className="text-[#8a8a8a] block">Đã sử dụng:</span>
                  <span className="text-sm font-semibold text-[#ececec]">
                    {formatBytes(used)}
                  </span>
                  <span className="block text-[10px] font-mono text-[#8a8a8a]">
                    ({used.toLocaleString()} B)
                  </span>
                </div>
                <div>
                  <span className="text-[#8a8a8a] block">Hạn mức Quota:</span>
                  <span className="text-sm font-semibold text-[#ececec]">
                    {formatBytes(quota)}
                  </span>
                  <span className="block text-[10px] font-mono text-[#8a8a8a]">
                    ({quota.toLocaleString()} B)
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-[#525252]/20">
                  <span className="text-[#8a8a8a] block">Dung lượng còn trống:</span>
                  <span className="text-sm font-semibold text-[#9bf73c]">
                    {formatBytes(available)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Cấu hình S3 & Mạng */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9bf73c]">
              Thông Số Kỹ Thuật S3
            </h4>
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#525252]/40 space-y-3 text-xs">
              <div>
                <span className="text-[#8a8a8a] block mb-0.5">S3 Endpoint URL:</span>
                <span className="font-mono text-[#ececec] break-all bg-[#2d2d2d] px-2.5 py-1.5 rounded block border border-[#525252]/40">
                  {node.endpoint}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#8a8a8a] block mb-0.5">Bucket Name:</span>
                  <span className="font-semibold text-[#ececec]">{node.bucket}</span>
                </div>
                <div>
                  <span className="text-[#8a8a8a] block mb-0.5">Region:</span>
                  <span className="px-2 py-0.5 rounded bg-[#2d2d2d] text-[#ececec] inline-block font-mono">
                    {node.region}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Cấu hình Webhook Event Notification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9bf73c]">
                Cấu Hình Webhook Event Notification
              </h4>
              {onOpenWebhookGuide && (
                <button
                  type="button"
                  onClick={() => onOpenWebhookGuide(node)}
                  className="text-xs text-[#9bf73c] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem hướng dẫn tích hợp</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              )}
            </div>
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#525252]/40 space-y-3 text-xs">
              <p className="text-[#8a8a8a] text-[11px] leading-relaxed">
                Đăng ký URL này vào MinIO Webhook target, AWS SNS HTTP Subscription hoặc Cloudflare Worker để tự động cập nhật trạng thái video khi tệp upload hoàn tất.
              </p>
              <div>
                <span className="text-[#8a8a8a] block mb-1">Webhook Callback URL:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 bg-[#2d2d2d] text-[#ececec] font-mono text-xs px-2.5 py-2 rounded-lg border border-[#525252]/40 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="px-3 py-2 bg-[#9bf73c] hover:bg-[#b6fa6b] text-[#1c1c1c] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {isCopiedWebhook ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Metadata Hệ Thống */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9bf73c]">
              Thông Tin Vận Hành
            </h4>
            <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#525252]/40 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8a8a8a]">Ngày khởi tạo:</span>
                <span className="text-[#ececec]">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a8a8a]">Kiến trúc:</span>
                <span className="text-[#ececec]">Distributed Object Storage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#525252]/60 bg-[#1c1c1c] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#3d3d3d] hover:bg-[#525252] text-[#ececec] text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
