'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { YtVideo } from './yt-mock-data';

interface YtVideoCardProps {
  video: YtVideo;
}

export function YtVideoCard({ video }: YtVideoCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex flex-col group cursor-pointer relative">
      {/* KHỐI THUMBNAIL (16:9) */}
      <Link href={`/watch/${video.id}`} className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#2d2d2d] border border-[#3d3d3d]/50">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badge góc trên (4K hoặc MỚI) */}
        {video.badge && video.badge !== 'LIVE' && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#141414]/80 text-[#9bf73c] border border-[#9bf73c]/30 backdrop-blur-sm">
            {video.badge}
          </span>
        )}

        {/* Badge thời lượng hoặc LIVE ở góc dưới phải */}
        {video.badge === 'LIVE' ? (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ff4444] text-white text-[11px] font-bold shadow-md">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span>TRỰC TIẾP</span>
          </div>
        ) : (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-[#141414]/85 text-[#ececec] text-xs font-semibold backdrop-blur-sm">
            {video.duration}
          </span>
        )}

        {/* Hover overlay preview line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#9bf73c] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
      </Link>

      {/* THÔNG TIN VIDEO & KÊNH */}
      <div className="flex gap-3 pt-3">
        {/* Avatar kênh */}
        <Link href={`/channel/${video.channelName}`} className="shrink-0">
          <img
            src={video.channelAvatar}
            alt={video.channelName}
            className="w-9 h-9 rounded-full object-cover border border-[#3d3d3d] hover:border-[#9bf73c] transition-colors"
          />
        </Link>

        {/* Tiêu đề & Metadata */}
        <div className="flex-1 min-w-0 pr-2">
          <Link href={`/watch/${video.id}`}>
            <h3 className="text-sm font-semibold text-[#ececec] line-clamp-2 leading-snug group-hover:text-[#9bf73c] transition-colors">
              {video.title}
            </h3>
          </Link>

          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8a8a8a]">
            <Link
              href={`/channel/${video.channelName}`}
              className="hover:text-[#d4d4d4] truncate transition-colors"
            >
              {video.channelName}
            </Link>
            {video.verified && (
              <svg className="w-3.5 h-3.5 text-[#8a8a8a] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#8a8a8a] mt-0.5">
            <span>{video.views}</span>
            <span>•</span>
            <span>{video.timestamp}</span>
          </div>
        </div>

        {/* Menu 3 chấm */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full text-[#8a8a8a] hover:text-[#ececec] hover:bg-[#2d2d2d] opacity-0 group-hover:opacity-100 transition-opacity"
            title="Tùy chọn khác"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 z-30 w-48 rounded-xl bg-[#2d2d2d] border border-[#525252] shadow-2xl py-1.5 text-xs text-[#ececec]">
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 hover:bg-[#3d3d3d] flex items-center gap-2.5"
              >
                <svg className="w-4 h-4 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Lưu vào Xem sau</span>
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 hover:bg-[#3d3d3d] flex items-center gap-2.5"
              >
                <svg className="w-4 h-4 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Thêm vào danh sách phát</span>
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 hover:bg-[#3d3d3d] flex items-center gap-2.5 text-[#9bf73c]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Chia sẻ video</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
