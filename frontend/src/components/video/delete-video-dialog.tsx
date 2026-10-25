'use client';

import React, { useState } from 'react';
import { videoService } from '@/services/video.service';

interface DeleteVideoDialogProps {
  videoId: string;
  videoTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: (videoId: string) => void;
}

export function DeleteVideoDialog({
  videoId,
  videoTitle = 'video này',
  isOpen,
  onClose,
  onDeleted,
}: DeleteVideoDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await videoService.deleteVideo(videoId);
      onDeleted?.(videoId);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to delete video:', err);
      const msg = err instanceof Error ? err.message : 'Xóa video thất bại';
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-[#2d2d2d] border border-[#ff5c5c]/40 rounded-2xl p-6 shadow-2xl relative text-[#ececec] animate-in fade-in duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 pb-3 border-b border-[#525252]">
          <div className="w-10 h-10 rounded-full bg-[#ff5c5c]/10 text-[#ff5c5c] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#ececec]">Xóa video vĩnh viễn?</h3>
            <p className="text-xs text-[#8a8a8a]">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-[#ff5c5c]/10 border border-[#ff5c5c]/30 rounded-xl text-xs text-[#ff5c5c]">
            {error}
          </div>
        )}

        <p className="mt-4 text-xs leading-relaxed text-[#d4d4d4]">
          Bạn có chắc chắn muốn xóa video <span className="font-semibold text-white">&quot;{videoTitle}&quot;</span>?
          Toàn bộ lượt tương tác, bình luận và liên kết danh sách phát sẽ bị dọn dẹp.
        </p>

        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-[#525252]">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold text-[#8a8a8a] hover:text-[#ececec] border border-[#525252] rounded-xl hover:bg-[#3d3d3d] transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 text-xs font-bold bg-[#ff5c5c] text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-[#ff5c5c]/20"
          >
            {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
          </button>
        </div>
      </div>
    </div>
  );
}
