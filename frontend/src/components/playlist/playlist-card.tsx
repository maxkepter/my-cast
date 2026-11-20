'use client';

import React from 'react';
import Link from 'next/link';
import { PlaylistRes } from '@/types/playlist';

interface PlaylistCardProps {
  playlist: PlaylistRes;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const firstVideo = playlist.videos[0];
  const videoCount = playlist.videos.length;
  const thumbnail = firstVideo?.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';

  const getVisibilityBadge = (visibility = 'PUBLIC') => {
    switch (visibility) {
      case 'PRIVATE':
        return {
          label: 'Riêng tư',
          className: 'bg-red-500/10 text-[#ff5c5c] border-red-500/20',
        };
      case 'UNLISTED':
        return {
          label: 'Không công khai',
          className: 'bg-amber-500/10 text-[#f7c93c] border-amber-500/20',
        };
      case 'PUBLIC':
      default:
        return {
          label: 'Công khai',
          className: 'bg-[#9bf73c]/10 text-[#9bf73c] border-[#9bf73c]/20',
        };
    }
  };

  const badge = getVisibilityBadge(playlist.visibility);

  return (
    <Link
      href={`/playlists/${playlist.playlistId}`}
      className="group block relative bg-[#2d2d2d] border border-[#3d3d3d] hover:border-[#525252] rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
    >
      {/* Thumbnail Stack Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#141414]">
        {/* Layer 2 (Stacked back card effect) */}
        <div className="absolute top-0 inset-x-2 h-2 bg-[#3d3d3d]/50 rounded-t-xl -translate-y-1 opacity-70 group-hover:-translate-y-2 transition-transform duration-300" />

        {/* Main Thumbnail Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={playlist.playlistName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Video count overlay sidebar on right edge */}
        <div className="absolute inset-y-0 right-0 w-24 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white px-2 text-center border-l border-white/10">
          <svg className="w-6 h-6 mb-1 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-xs font-bold leading-tight">{videoCount}</span>
          <span className="text-[10px] text-[#8a8a8a]">video</span>
        </div>

        {/* Play button hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-[#9bf73c] text-[#1c1c1c] flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform shadow-lg">
            <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-[#ececec] truncate group-hover:text-[#9bf73c] transition-colors">
            {playlist.playlistName}
          </h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${badge.className}`}>
            {badge.label}
          </span>
        </div>

        {playlist.playlistDescription && (
          <p className="text-xs text-[#8a8a8a] line-clamp-2 leading-relaxed">
            {playlist.playlistDescription}
          </p>
        )}

        <div className="pt-2 flex items-center justify-between text-[11px] text-[#8a8a8a] border-t border-[#3d3d3d]">
          <span>Xem toàn bộ danh sách</span>
          <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
