'use client';

import React, { useState } from 'react';
import { videoService } from '@/services/video.service';
import { CreatePlaylistReq, PlaylistRes, PlaylistVisibility } from '@/types/playlist';

interface CreatePlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (playlist: PlaylistRes) => void;
}

export function CreatePlaylistDialog({
  isOpen,
  onClose,
  onCreated,
}: CreatePlaylistDialogProps) {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [visibility, setVisibility] = useState<PlaylistVisibility>('PUBLIC');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const payload: CreatePlaylistReq = {
      playlistName: playlistName.trim(),
      playlistDescription: playlistDescription.trim() || undefined,
      visibility,
    };

    try {
      const created = await videoService.createPlaylist(payload);
      onCreated?.(created);
      setPlaylistName('');
      setPlaylistDescription('');
      setVisibility('PUBLIC');
      onClose();
    } catch (err: unknown) {
      console.error('Failed to create playlist:', err);
      const msg = err instanceof Error ? err.message : 'Tạo playlist thất bại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-[#2d2d2d] border border-[#525252] rounded-2xl p-6 shadow-2xl relative text-[#ececec] animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#525252]">
          <h3 className="text-lg font-bold text-[#ececec]">Tạo danh sách phát mới</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8a8a8a] hover:text-[#ececec] transition-colors p-1 rounded-lg hover:bg-[#3d3d3d]"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-[#ff5c5c]/10 border border-[#ff5c5c]/30 rounded-xl text-xs text-[#ff5c5c]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8a8a8a] mb-1.5">
              Tên danh sách phát <span className="text-[#ff5c5c]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ví dụ: Khóa học NestJS & Microservices"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#525252] rounded-xl text-sm text-[#ececec] outline-hidden focus:border-[#9bf73c]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8a8a8a] mb-1.5">Mô tả (tùy chọn)</label>
            <textarea
              rows={3}
              placeholder="Giới thiệu nội dung của danh sách phát này..."
              value={playlistDescription}
              onChange={(e) => setPlaylistDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#525252] rounded-xl text-sm text-[#ececec] outline-hidden focus:border-[#9bf73c] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8a8a8a] mb-1.5">
              Quyền riêng tư
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PlaylistVisibility)}
              className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#525252] rounded-xl text-sm text-[#ececec] outline-hidden focus:border-[#9bf73c]"
            >
              <option value="PUBLIC">Công khai (Mọi người đều có thể tìm và xem)</option>
              <option value="UNLISTED">Không công khai (Chỉ người có link mới xem được)</option>
              <option value="PRIVATE">Riêng tư (Chỉ bạn mới có quyền xem)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#525252]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#8a8a8a] hover:text-[#ececec] rounded-xl hover:bg-[#3d3d3d] transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !playlistName.trim()}
              className="px-5 py-2 text-xs font-bold bg-[#9bf73c] text-[#1c1c1c] rounded-xl hover:bg-[#b6fa6b] disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? 'Đang tạo...' : 'Tạo danh sách'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
