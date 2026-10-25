'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { videoService } from '@/services/video.service';
import { PlaylistRes, PlaylistVideoItem } from '@/types/playlist';
import { VideoRes } from '@/types/video';
import { PlaylistPlayerSidebar } from '@/components/playlist/playlist-player-sidebar';
import { VideoLikeButton } from '@/components/video/video-like-button';
import { VideoShareModal } from '@/components/video/video-share-modal';
import { AddToPlaylistModal } from '@/components/video/add-to-playlist-modal';
import { EditVideoModal } from '@/components/video/edit-video-modal';
import { DeleteVideoDialog } from '@/components/video/delete-video-dialog';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WatchPlaylistPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const playlistId = resolvedParams.id;

  const [playlist, setPlaylist] = useState<PlaylistRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Modals state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    videoService
      .getPlaylist(playlistId)
      .then((res) => {
        if (!isMounted) return;
        setPlaylist(res);
      })
      .catch((err) => {
        console.error('Failed to load playlist:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-[#ececec] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#9bf73c] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#8a8a8a]">Đang tải danh sách phát...</span>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-[#ececec] flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <h2 className="text-lg font-bold text-white">Không tìm thấy danh sách phát</h2>
          <p className="text-xs text-[#8a8a8a]">
            Danh sách phát này không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Link
            href="/playlists"
            className="inline-block px-4 py-2 bg-[#9bf73c] text-[#1c1c1c] text-xs font-bold rounded-xl"
          >
            Về danh sách phát
          </Link>
        </div>
      </div>
    );
  }

  const currentVideo: PlaylistVideoItem | undefined = playlist.videos[currentIndex];

  const handleVideoEnded = () => {
    if (currentIndex < playlist.videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleVideoDeleted = (deletedVideoId: string) => {
    setPlaylist((prev) => {
      if (!prev) return null;
      const updatedVideos = prev.videos.filter((v) => v.videoId !== deletedVideoId);
      return {
        ...prev,
        videos: updatedVideos,
      };
    });
    if (currentIndex >= playlist.videos.length - 1) {
      setCurrentIndex(Math.max(0, playlist.videos.length - 2));
    }
  };

  const currentVideoResForEdit: VideoRes | null = currentVideo
    ? {
        videoId: currentVideo.videoId,
        authorId: currentVideo.authorId,
        title: currentVideo.title,
        description: currentVideo.description,
        thumbnail: currentVideo.thumbnail,
        videoFile: currentVideo.videoFile,
        views: currentVideo.views,
        likesCount: currentVideo.likesCount,
        sharesCount: currentVideo.sharesCount,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-[#ececec] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#8a8a8a]">
          <Link href="/playlists" className="hover:text-[#9bf73c] transition-colors">
            Danh sách phát
          </Link>
          <span>/</span>
          <span className="text-[#d4d4d4] font-medium truncate max-w-xs">
            {playlist.playlistName}
          </span>
        </div>

        {/* 2 Columns Layout: Player (Left) + Playlist Sidebar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Video Player Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {currentVideo ? (
              <>
                {/* HTML5 Video Player */}
                <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-[#3d3d3d] shadow-2xl">
                  <video
                    key={currentVideo.videoId}
                    controls
                    autoPlay
                    onEnded={handleVideoEnded}
                    poster={currentVideo.thumbnail}
                    className="w-full h-full object-contain"
                  >
                    <source
                      src={
                        currentVideo.videoFile ||
                        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                      }
                      type="video/mp4"
                    />
                    Trình duyệt của bạn không hỗ trợ thẻ video.
                  </video>
                </div>

                {/* Video Metadata Header */}
                <div className="space-y-3">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                    {currentVideo.title}
                  </h1>

                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#3d3d3d]">
                    <div className="flex items-center gap-3 text-xs text-[#8a8a8a]">
                      <span className="font-semibold text-[#d4d4d4]">
                        {currentVideo.views?.toLocaleString() || 0} lượt xem
                      </span>
                      <span>•</span>
                      <span>Video {currentIndex + 1} trên {playlist.videos.length}</span>
                    </div>

                    {/* Action buttons bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Like button (Optimistic UI) */}
                      <VideoLikeButton
                        videoId={currentVideo.videoId}
                        initialLiked={false}
                        initialLikesCount={currentVideo.likesCount || 0}
                      />

                      {/* Share button */}
                      <button
                        type="button"
                        onClick={() => setIsShareOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#525252] bg-[#2d2d2d] text-[#d4d4d4] hover:border-[#8a8a8a] hover:bg-[#3d3d3d] transition-all text-xs font-semibold cursor-pointer active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Chia sẻ
                      </button>

                      {/* Add to playlist button */}
                      <button
                        type="button"
                        onClick={() => setIsAddOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#525252] bg-[#2d2d2d] text-[#d4d4d4] hover:border-[#8a8a8a] hover:bg-[#3d3d3d] transition-all text-xs font-semibold cursor-pointer active:scale-95"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Lưu
                      </button>

                      {/* Creator actions: Edit & Delete */}
                      <button
                        type="button"
                        onClick={() => setIsEditOpen(true)}
                        title="Chỉnh sửa video"
                        className="p-2 rounded-full border border-[#525252] bg-[#2d2d2d] text-[#8a8a8a] hover:text-[#9bf73c] hover:border-[#9bf73c] transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDeleteOpen(true)}
                        title="Xóa video"
                        className="p-2 rounded-full border border-[#525252] bg-[#2d2d2d] text-[#8a8a8a] hover:text-[#ff5c5c] hover:border-[#ff5c5c] transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Video Description Box */}
                  {currentVideo.description && (
                    <div className="p-4 bg-[#2d2d2d] border border-[#3d3d3d] rounded-2xl text-xs text-[#d4d4d4] leading-relaxed whitespace-pre-line">
                      {currentVideo.description}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="aspect-video w-full bg-[#2d2d2d] border border-[#3d3d3d] rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3">
                <svg className="w-12 h-12 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <h3 className="text-sm font-bold text-white">Danh sách phát này chưa có video nào</h3>
                <p className="text-xs text-[#8a8a8a]">
                  Hãy thêm video vào danh sách để bắt đầu thưởng thức.
                </p>
                <Link
                  href="/playlists"
                  className="px-4 py-2 bg-[#9bf73c] text-[#1c1c1c] text-xs font-bold rounded-xl"
                >
                  Quay lại danh sách
                </Link>
              </div>
            )}
          </div>

          {/* Playlist Sidebar Column (4 cols) */}
          <div className="lg:col-span-4">
            <PlaylistPlayerSidebar
              playlist={playlist}
              currentIndex={currentIndex}
              onSelectVideo={(idx) => setCurrentIndex(idx)}
            />
          </div>
        </div>
      </div>

      {/* Modals & Dialogs */}
      {currentVideo && (
        <>
          <VideoShareModal
            videoId={currentVideo.videoId}
            videoTitle={currentVideo.title}
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
          />

          <AddToPlaylistModal
            videoId={currentVideo.videoId}
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
          />

          {currentVideoResForEdit && (
            <EditVideoModal
              video={currentVideoResForEdit}
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              onUpdated={(updated) => {
                setPlaylist((prev) => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    videos: prev.videos.map((v) =>
                      v.videoId === updated.videoId
                        ? { ...v, title: updated.title, description: updated.description }
                        : v
                    ),
                  };
                });
              }}
            />
          )}

          <DeleteVideoDialog
            videoId={currentVideo.videoId}
            videoTitle={currentVideo.title}
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onDeleted={handleVideoDeleted}
          />
        </>
      )}
    </div>
  );
}
