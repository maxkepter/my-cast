'use client';

import React, { useState } from 'react';
import { StorageNode } from '@/types/storage-admin';
import { getStorageErrorMessage, storageAdminService } from '@/services/storage-admin.service';

interface DeleteStorageNodeDialogProps {
  isOpen: boolean;
  node: StorageNode | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteStorageNodeDialog({
  isOpen,
  node,
  onClose,
  onSuccess,
}: DeleteStorageNodeDialogProps) {
  const [confirmId, setConfirmId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !node) return null;

  const isConfirmed = confirmId.trim() === node.nodeId;

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmId('');
    setError(null);
    onClose();
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;

    try {
      setIsDeleting(true);
      setError(null);
      await storageAdminService.remove(node.nodeId);
      setConfirmId('');
      onSuccess();
    } catch (err: unknown) {
      setError(getStorageErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-lg bg-[#2d2d2d] border border-[#ff5c5c]/40 rounded-2xl shadow-2xl overflow-hidden transition-all text-[#ececec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Danger Accent */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#525252]/60 bg-[#1c1c1c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ff5c5c]/10 text-[#ff5c5c] flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#ececec]">Xác Nhận Xóa Storage Node</h3>
              <p className="text-xs text-[#8a8a8a]">Thao tác nguy hiểm không thể hoàn tác</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="text-[#8a8a8a] hover:text-[#ececec] p-1.5 rounded-lg hover:bg-[#3d3d3d] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-[#ff5c5c]/10 border border-[#ff5c5c]/40 rounded-xl text-xs text-[#ff5c5c] flex items-start gap-2.5">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1 font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleDelete} className="p-6 space-y-4">
          <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#525252]/40 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">Tên cụm lưu trữ:</span>
              <span className="font-semibold text-[#ececec]">{node.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">Node ID:</span>
              <span className="font-mono text-[#9bf73c] font-medium">{node.nodeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">Bucket:</span>
              <span className="text-[#ececec]">{node.bucket}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8a8a]">Dữ liệu hiện tại:</span>
              <span className={node.usedBytes > 0 ? 'text-[#ff5c5c] font-semibold' : 'text-[#9bf73c]'}>
                {node.usedBytes > 0 ? `${node.usedBytes} Bytes (Đang có file)` : '0 Bytes (Trống)'}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#d4d4d4] leading-relaxed">
            Hành động này sẽ xóa vĩnh viễn cấu hình Node khỏi cụm phân phối lưu trữ MyCast.
            Nếu Node này đang lưu trữ các phân đoạn video/audio, backend sẽ từ chối xóa để bảo toàn dữ liệu.
          </p>

          <div>
            <label className="block text-xs font-medium text-[#d4d4d4] mb-1.5">
              Để xác nhận, vui lòng nhập chính xác mã <span className="font-mono text-[#ff5c5c] font-bold">{node.nodeId}</span>:
            </label>
            <input
              type="text"
              value={confirmId}
              onChange={(e) => setConfirmId(e.target.value)}
              placeholder={node.nodeId}
              autoFocus
              className="w-full px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm font-mono text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#ff5c5c] focus:ring-1 focus:ring-[#ff5c5c]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#525252]/60">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 bg-[#3d3d3d] hover:bg-[#525252] text-[#ececec] text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#ff5c5c] hover:bg-[#ff7070] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isDeleting ? 'Đang xóa...' : 'Xóa Vĩnh Viễn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
