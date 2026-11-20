'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { videoService } from '@/services/video.service';
import { PlaylistRes } from '@/types/playlist';
import { PlaylistCard } from '@/components/playlist/playlist-card';
import { CreatePlaylistDialog } from '@/components/playlist/create-playlist-dialog';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    videoService
      .getMyPlaylists(1, 20)
      .then((res) => {
        if (!isMounted) return;
        setPlaylists(res.data);
      })
      .catch((err) => {
        console.error('Failed to load playlists:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreated = (newPlaylist: PlaylistRes) => {
    setPlaylists((prev) => [newPlaylist, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-[#ececec] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#3d3d3d]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9bf73c] mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Bộ sưu tập cá nhân
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Danh sách phát của bạn
            </h1>
            <p className="text-xs text-[#8a8a8a] mt-1">
              Quản lý các bộ sưu tập video, bài giảng và series theo chủ đề
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/history"
              className="px-4 py-2 text-xs font-semibold text-[#d4d4d4] bg-[#2d2d2d] border border-[#525252] rounded-xl hover:bg-[#3d3d3d] hover:text-white transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lịch sử xem
            </Link>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 text-xs font-bold bg-[#9bf73c] text-[#1c1c1c] rounded-xl hover:bg-[#b6fa6b] transition-all flex items-center gap-2 shadow-lg shadow-[#9bf73c]/10 cursor-pointer active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Tạo danh sách phát
            </button>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-2xl p-4 space-y-3 animate-pulse"
              >
                <div className="aspect-video bg-[#141414] rounded-xl" />
                <div className="h-4 bg-[#3d3d3d] rounded-md w-3/4" />
                <div className="h-3 bg-[#3d3d3d] rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <div className="py-20 text-center bg-[#2d2d2d] border border-[#3d3d3d] rounded-2xl p-8 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#1c1c1c] text-[#9bf73c] flex items-center justify-center mx-auto border border-[#3d3d3d]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">Chưa có danh sách phát nào</h3>
            <p className="text-xs text-[#8a8a8a] leading-relaxed">
              Tạo danh sách phát để lưu trữ và sắp xếp các video yêu thích theo sở thích của bạn.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 text-xs font-bold bg-[#9bf73c] text-[#1c1c1c] rounded-xl hover:bg-[#b6fa6b] transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Tạo danh sách phát đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.playlistId} playlist={playlist} />
            ))}
          </div>
        )}
      </div>

      {/* Modal create playlist */}
      <CreatePlaylistDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
