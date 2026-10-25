'use client';

import React, { useState, useEffect } from 'react';
import { videoService } from '@/services/video.service';
import { PlaylistRes } from '@/types/playlist';

interface AddToPlaylistModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (playlistId: string) => void;
}

export function AddToPlaylistModal({
  videoId,
  isOpen,
  onClose,
  onAdded,
}: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<PlaylistRes[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const [successPlaylistId, setSuccessPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    videoService
      .getMyPlaylists(1, 50)
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleAdd = async (playlist: PlaylistRes) => {
    const isAlreadyIn = playlist.videos.some((v) => v.videoId === videoId);
    if (isAlreadyIn) return; // Currently contract supports add

    setAddingId(playlist.playlistId);
    try {
      await videoService.addVideoToPlaylist(playlist.playlistId, videoId);
      setSuccessPlaylistId(playlist.playlistId);
      // Update local state
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.playlistId === playlist.playlistId) {
            return {
              ...p,
              videos: [
                ...p.videos,
                {
                  videoId,
                  authorId: '',
                  title: '',
                  views: 0,
                  likesCount: 0,
                  sharesCount: 0,
                },
              ],
            };
          }
          return p;
        })
      );
      onAdded?.(playlist.playlistId);
      setTimeout(() => setSuccessPlaylistId(null), 2000);
    } catch (err) {
      console.error('Failed to add video to playlist:', err);
    } finally {
      setAddingId(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || creating) return;

    setCreating(true);
    try {
      const created = await videoService.createPlaylist({
        playlistName: newPlaylistName.trim(),
        visibility: 'PUBLIC',
      });
      await videoService.addVideoToPlaylist(created.playlistId, videoId);
      setPlaylists((prev) => [created, ...prev]);
      setNewPlaylistName('');
      setShowCreateForm(false);
      setSuccessPlaylistId(created.playlistId);
      onAdded?.(created.playlistId);
    } catch (err) {
      console.error('Failed to create and add to playlist:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-sm bg-[#2d2d2d] border border-[#525252] rounded-2xl p-6 shadow-2xl relative text-[#ececec] animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#525252]">
          <h3 className="text-lg font-bold text-[#ececec]">Lưu vào danh sách phát</h3>
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

        {/* Playlist List */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-6 text-center text-xs text-[#8a8a8a]">Đang tải danh sách...</div>
          ) : playlists.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8a8a8a]">Bạn chưa có danh sách phát nào.</div>
          ) : (
            playlists.map((playlist) => {
              const isAdded =
                playlist.videos.some((v) => v.videoId === videoId) ||
                successPlaylistId === playlist.playlistId;
              const isWorking = addingId === playlist.playlistId;

              return (
                <div
                  key={playlist.playlistId}
                  onClick={() => !isAdded && handleToggleAdd(playlist)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isAdded
                      ? 'bg-[#9bf73c]/10 border-[#9bf73c]/40 text-[#9bf73c]'
                      : 'bg-[#1c1c1c] border-[#3d3d3d] hover:border-[#525252] text-[#d4d4d4]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${
                        isAdded
                          ? 'bg-[#9bf73c] border-[#9bf73c]'
                          : 'border-[#525252] bg-transparent'
                      }`}
                    >
                      {isAdded && (
                        <svg className="w-3 h-3 text-[#1c1c1c]" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">{playlist.playlistName}</span>
                  </div>
                  <span className="text-xs text-[#8a8a8a]">
                    {isWorking ? 'Đang thêm...' : isAdded ? 'Đã lưu' : `${playlist.videos.length} video`}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Create playlist shortcut */}
        <div className="mt-4 pt-4 border-t border-[#525252]">
          {showCreateForm ? (
            <form onSubmit={handleCreateAndAdd} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Nhập tên danh sách mới..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#525252] rounded-xl text-xs text-[#ececec] outline-hidden focus:border-[#9bf73c]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3 py-1.5 text-xs text-[#8a8a8a] hover:text-[#ececec] rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim() || creating}
                  className="px-3 py-1.5 text-xs font-bold bg-[#9bf73c] text-[#1c1c1c] rounded-lg hover:bg-[#b6fa6b] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {creating ? 'Đang tạo...' : 'Tạo và Lưu'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#9bf73c] hover:bg-[#9bf73c]/10 rounded-xl transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo danh sách phát mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
