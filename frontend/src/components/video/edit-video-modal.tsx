'use client';

import React, { useState } from 'react';
import { videoService } from '@/services/video.service';
import { UpdateVideoReq, VideoRes, VideoVisibility } from '@/types/video';

interface EditVideoModalProps {
  video: VideoRes;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updated: VideoRes) => void;
}

export function EditVideoModal({
  video,
  isOpen,
  onClose,
  onUpdated,
}: EditVideoModalProps) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || '');
  const [visibility, setVisibility] = useState<VideoVisibility>(
    video.config?.visibility || 'PUBLIC'
  );
  const [allowComments, setAllowComments] = useState(
    video.config?.allowComments ?? true
  );
  const [scheduleAt, setScheduleAt] = useState(
    video.config?.scheduledAt
      ? new Date(video.config.scheduledAt).toISOString().slice(0, 16)
      : ''
  );
  const [prevVideoId, setPrevVideoId] = useState(video.videoId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state without effect cascading render
  if (prevVideoId !== video.videoId) {
    setPrevVideoId(video.videoId);
    setTitle(video.title);
    setDescription(video.description || '');
    setVisibility(video.config?.visibility || 'PUBLIC');
    setAllowComments(video.config?.allowComments ?? true);
    setScheduleAt(
      video.config?.scheduledAt
        ? new Date(video.config.scheduledAt).toISOString().slice(0, 16)
        : ''
    );
    setError(null);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    if (visibility === 'SCHEDULED' && !scheduleAt) {
      setError('Vui lòng chọn thời gian phát sóng dự kiến cho chế độ lên lịch.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: UpdateVideoReq = {
      title: title.trim(),
      description: description.trim(),
      visibility,
      allowComments,
      scheduleAt: visibility === 'SCHEDULED' && scheduleAt ? new Date(scheduleAt).toISOString() : null,
    };

    try {
      const updated = await videoService.updateVideo(video.videoId, payload);
      onUpdated?.(updated);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to update video:', err);
      const msg = err instanceof Error ? err.message : 'Cập nhật video thất bại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-[#2d2d2d] border border-[#525252] rounded-2xl p-6 shadow-2xl relative text-[#ececec] animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#525252]">
          <h3 className="text-lg font-bold text-[#ececec]">Chỉnh sửa chi tiết video</h3>
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#8a8a8a] mb-1.5">
              Tiêu đề video <span className="text-[#ff5c5c]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#525252] rounded-xl text-sm text-[#ececec] outline-hidden focus:border-[#9bf73c]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#8a8a8a] mb-1.5">Mô tả</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#525252] rounded-xl text-sm text-[#ececec] outline-hidden focus:border-[#9bf73c] resize-none"
            />
          </div>

          {/* Visibility Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8a8a8a] mb-1.5">
                Chế độ hiển thị
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as VideoVisibility)}
                className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#525252] rounded-xl text-sm text-[#ececec] outline-hidden focus:border-[#9bf73c]"
              >
                <option value="PUBLIC">Công khai (Public)</option>
                <option value="UNLISTED">Không công khai (Unlisted)</option>
                <option value="PRIVATE">Riêng tư (Private)</option>
                <option value="SCHEDULED">Lên lịch phát (Scheduled)</option>
              </select>
            </div>

            {/* Scheduled Date Picker */}
            {visibility === 'SCHEDULED' && (
              <div>
                <label className="block text-xs font-semibold text-[#8a8a8a] mb-1.5">
                  Thời gian phát sóng
                </label>
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#525252] rounded-xl text-sm text-[#ececec] outline-hidden focus:border-[#9bf73c]"
                />
              </div>
            )}
          </div>

          {/* Allow Comments Switch */}
          <div className="flex items-center justify-between p-3 bg-[#1c1c1c] border border-[#3d3d3d] rounded-xl">
            <span className="text-xs font-semibold text-[#d4d4d4]">Cho phép bình luận trên video</span>
            <input
              type="checkbox"
              checked={allowComments}
              onChange={(e) => setAllowComments(e.target.checked)}
              className="w-4 h-4 accent-[#9bf73c] cursor-pointer"
            />
          </div>

          {/* Action buttons */}
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
              disabled={submitting || !title.trim()}
              className="px-5 py-2 text-xs font-bold bg-[#9bf73c] text-[#1c1c1c] rounded-xl hover:bg-[#b6fa6b] disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
