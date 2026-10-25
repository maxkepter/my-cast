'use client';

import React, { useState } from 'react';
import { videoService } from '@/services/video.service';

interface VideoLikeButtonProps {
  videoId: string;
  initialLiked?: boolean;
  initialLikesCount?: number;
  onLikeChanged?: (isLiked: boolean, totalLikes: number) => void;
  className?: string;
}

export function VideoLikeButton({
  videoId,
  initialLiked = false,
  initialLikesCount = 0,
  onLikeChanged,
  className = '',
}: VideoLikeButtonProps) {
  const [isLiked, setIsLiked] = useState<boolean>(initialLiked);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [prevVideoId, setPrevVideoId] = useState<string>(videoId);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync state when switching videos (standard React pattern without effect cascade)
  if (prevVideoId !== videoId) {
    setPrevVideoId(videoId);
    setIsLiked(initialLiked);
    setLikesCount(initialLikesCount);
  }

  const handleToggleLike = async () => {
    if (isLoading) return;

    // Optimistic UI update
    const previousLiked = isLiked;
    const previousCount = likesCount;

    const nextLiked = !previousLiked;
    const nextCount = nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    setIsLiked(nextLiked);
    setLikesCount(nextCount);
    setIsLoading(true);

    try {
      const res = await videoService.toggleLike(videoId);
      setIsLiked(res.isLiked);
      setLikesCount(res.totalLikes);
      onLikeChanged?.(res.isLiked, res.totalLikes);
    } catch (error) {
      // Rollback on failure
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };

  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={isLoading}
      aria-label={isLiked ? 'Bỏ thích video' : 'Thích video'}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        isLiked
          ? 'border-[#9bf73c] bg-[#9bf73c]/10 text-[#9bf73c]'
          : 'border-[#525252] bg-[#2d2d2d] text-[#d4d4d4] hover:border-[#8a8a8a] hover:bg-[#3d3d3d]'
      } ${className}`}
    >
      <svg
        className={`w-5 h-5 transition-transform duration-200 ${isLiked ? 'scale-110 fill-[#9bf73c]' : 'fill-none stroke-current'}`}
        viewBox="0 0 24 24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      <span className="text-sm font-semibold tracking-wide">
        {formatCount(likesCount)}
      </span>
    </button>
  );
}
