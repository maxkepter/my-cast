'use client';

import React from 'react';
import { PlaylistRes, PlaylistVideoItem } from '@/types/playlist';

interface PlaylistPlayerSidebarProps {
  playlist: PlaylistRes;
  currentIndex: number;
  onSelectVideo: (index: number) => void;
  className?: string;
}

export function PlaylistPlayerSidebar({
  playlist,
  currentIndex,
  onSelectVideo,
  className = '',
}: PlaylistPlayerSidebarProps) {
  const total = playlist.videos.length;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '10:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className={`w-full bg-[#141414] border border-[#3d3d3d] rounded-2xl flex flex-col overflow-hidden ${className}`}
    >
      {/* Header Info */}
      <div className="p-4 bg-[#1c1c1c] border-b border-[#3d3d3d] space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9bf73c]">
            Danh sách phát
          </span>
          <span className="text-xs font-mono text-[#8a8a8a]">
            {currentIndex + 1} / {total}
          </span>
        </div>
        <h3 className="text-sm font-bold text-[#ececec] truncate">
          {playlist.playlistName}
        </h3>
        {playlist.playlistDescription && (
          <p className="text-xs text-[#8a8a8a] truncate">
            {playlist.playlistDescription}
          </p>
        )}
      </div>

      {/* Video Items List */}
      <div className="overflow-y-auto divide-y divide-[#2d2d2d] max-h-[600px] flex-1">
        {playlist.videos.map((video: PlaylistVideoItem, index: number) => {
          const isPlaying = index === currentIndex;

          return (
            <div
              key={video.videoId || index}
              onClick={() => onSelectVideo(index)}
              className={`flex items-center gap-3 p-3 transition-colors cursor-pointer select-none ${
                isPlaying
                  ? 'bg-[#2d2d2d] border-l-4 border-l-[#9bf73c]'
                  : 'hover:bg-[#1c1c1c] text-[#8a8a8a]'
              }`}
            >
              {/* Index or Playing indicator */}
              <div className="w-5 text-center shrink-0">
                {isPlaying ? (
                  <div className="flex items-center justify-center gap-0.5">
                    <span className="w-1 h-3 bg-[#9bf73c] animate-pulse rounded-full" />
                    <span className="w-1 h-4 bg-[#9bf73c] animate-pulse rounded-full delay-75" />
                    <span className="w-1 h-2 bg-[#9bf73c] animate-pulse rounded-full delay-150" />
                  </div>
                ) : (
                  <span className="text-xs font-mono text-[#8a8a8a]">{index + 1}</span>
                )}
              </div>

              {/* Thumbnail */}
              <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-[#3d3d3d]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    video.thumbnail ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'
                  }
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-[9px] font-mono rounded-sm text-[#ececec]">
                  {formatDuration(video.durationSeconds)}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1">
                <h4
                  className={`text-xs font-semibold line-clamp-2 leading-snug ${
                    isPlaying ? 'text-[#9bf73c]' : 'text-[#d4d4d4]'
                  }`}
                >
                  {video.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8a8a8a]">
                  <span>{video.views?.toLocaleString() || 0} lượt xem</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
