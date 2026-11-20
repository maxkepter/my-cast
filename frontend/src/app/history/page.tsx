'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { videoService } from '@/services/video.service';
import { WatchVideoItem } from '@/types/history';
import { WatchHistoryItem } from '@/components/history/watch-history-item';

export default function WatchHistoryPage() {
  const [historyItems, setHistoryItems] = useState<WatchVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    let isMounted = true;

    videoService
      .getWatchHistory(1, 30)
      .then((res) => {
        if (!isMounted) return;
        setHistoryItems(res.data);
      })
      .catch((err) => {
        console.error('Failed to load watch history:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemoveItem = async (videoId: string) => {
    try {
      await videoService.removeFromWatchHistory(videoId);
      setHistoryItems((prev) => prev.filter((item) => item.videoId !== videoId));
    } catch (err) {
      console.error('Failed to remove item from history:', err);
    }
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await videoService.clearWatchHistory();
      setHistoryItems([]);
      setShowConfirmClear(false);
    } catch (err) {
      console.error('Failed to clear watch history:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-[#ececec] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#3d3d3d]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9bf73c] mb-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nhật ký phát lại
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Lịch sử xem video
            </h1>
            <p className="text-xs text-[#8a8a8a] mt-1">
              Theo dõi và tiếp tục thưởng thức các nội dung bạn đã từng xem
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/playlists"
              className="px-4 py-2 text-xs font-semibold text-[#d4d4d4] bg-[#2d2d2d] border border-[#525252] rounded-xl hover:bg-[#3d3d3d] hover:text-white transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Danh sách phát
            </Link>

            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="px-4 py-2 text-xs font-semibold text-[#ff5c5c] bg-[#ff5c5c]/10 border border-[#ff5c5c]/30 rounded-xl hover:bg-[#ff5c5c]/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa toàn bộ lịch sử
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 bg-[#2d2d2d] border border-[#3d3d3d] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-20 text-center bg-[#2d2d2d] border border-[#3d3d3d] rounded-2xl p-8 space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#1c1c1c] text-[#9bf73c] flex items-center justify-center mx-auto border border-[#3d3d3d]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white">Chưa có lịch sử xem</h3>
            <p className="text-xs text-[#8a8a8a] leading-relaxed">
              Các video bạn xem sẽ được lưu lại tại đây kèm tiến độ để bạn có thể xem tiếp bất cứ lúc nào.
            </p>
            <Link
              href="/playlists"
              className="px-5 py-2.5 text-xs font-bold bg-[#9bf73c] text-[#1c1c1c] rounded-xl hover:bg-[#b6fa6b] transition-all inline-flex items-center gap-2"
            >
              Khám phá video ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <WatchHistoryItem
                key={item.videoId}
                item={item}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm Clear All Dialog */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-md bg-[#2d2d2d] border border-[#ff5c5c]/40 rounded-2xl p-6 shadow-2xl relative text-[#ececec] animate-in fade-in duration-200"
            role="alertdialog"
            aria-modal="true"
          >
            <h3 className="text-base font-bold text-white mb-2">
              Xóa toàn bộ lịch sử xem?
            </h3>
            <p className="text-xs text-[#d4d4d4] leading-relaxed mb-6">
              Toàn bộ nhật ký và tiến độ xem video của bạn trên MyCast sẽ bị xóa vĩnh viễn khỏi tài khoản.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#525252]">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                disabled={clearing}
                className="px-4 py-2 text-xs font-semibold text-[#8a8a8a] hover:text-[#ececec] border border-[#525252] rounded-xl hover:bg-[#3d3d3d] transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearing}
                className="px-5 py-2 text-xs font-bold bg-[#ff5c5c] text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all cursor-pointer"
              >
                {clearing ? 'Đang xóa...' : 'Xác nhận xóa tất cả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
