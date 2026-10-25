'use client';

import React from 'react';
import Link from 'next/link';
import { WatchVideoItem } from '@/types/history';

interface WatchHistoryItemProps {
  item: WatchVideoItem;
  onRemove: (videoId: string) => void;
}

export function WatchHistoryItem({ item, onRemove }: WatchHistoryItemProps) {
  const watchedSec = item.watchedSeconds || 0;
  const durationSec = item.durationSeconds || 600;
  const progressRatio = Math.min(100, Math.round((watchedSec / durationSec) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatWatchedDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-[#2d2d2d] border border-[#3d3d3d] hover:border-[#525252] rounded-2xl transition-all">
      {/* Thumbnail with Lime progress bar */}
      <Link
        href={`/watch/${item.videoId}`}
        className="relative w-full sm:w-56 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-[#3d3d3d] group-hover:border-[#525252] transition-colors"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            item.thumbnail ||
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'
          }
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-[10px] font-mono font-medium rounded-sm text-[#ececec]">
          {formatTime(durationSec)}
        </span>

        {/* Progress bar Lime #9bf73c at bottom of thumbnail */}
        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
          <div
            className="h-full bg-[#9bf73c] transition-all"
            style={{ width: `${progressRatio}%` }}
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <Link href={`/watch/${item.videoId}`}>
          <h4 className="text-sm font-bold text-[#ececec] group-hover:text-[#9bf73c] transition-colors line-clamp-2">
            {item.title}
          </h4>
        </Link>
        {item.description && (
          <p className="text-xs text-[#8a8a8a] line-clamp-1">{item.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8a8a8a] pt-1">
          <span>{item.views?.toLocaleString()} lượt xem</span>
          <span>•</span>
          <span>
            Đã xem {formatTime(watchedSec)} ({progressRatio}%)
          </span>
          {item.watchedAt && (
            <>
              <span>•</span>
              <span className="text-[#9bf73c]">{formatWatchedDate(item.watchedAt)}</span>
            </>
          )}
        </div>
      </div>

      {/* Action Remove button */}
      <div className="self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => onRemove(item.videoId)}
          title="Xóa khỏi lịch sử xem"
          className="p-2 text-[#8a8a8a] hover:text-[#ff5c5c] hover:bg-[#3d3d3d] rounded-xl transition-all cursor-pointer"
          aria-label="Xóa video khỏi lịch sử"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
