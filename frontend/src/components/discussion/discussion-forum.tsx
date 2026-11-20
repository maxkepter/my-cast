'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export interface CommentItem {
  id: string;
  authorName: string;
  authorAvatar?: string;
  timestampSec: number;
  timestampText: string;
  content: string;
  upvotes: number;
  hasUpvoted?: boolean;
  creatorReply?: {
    authorName: string;
    content: string;
  };
}

export interface DiscussionForumProps {
  videoId: string;
  initialComments?: CommentItem[];
  onSeekTimestamp?: (seconds: number) => void;
}

const DEFAULT_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    authorName: 'Lê Trung Kiên',
    timestampSec: 495,
    timestampText: 'Mốc 08:15',
    content: 'Làm thế nào để xử lý rollback trạng thái khi có một Domain Event phát sinh ngoại lệ giữa chừng?',
    upvotes: 42,
    hasUpvoted: true,
    creatorReply: {
      authorName: 'Trần Hoàng Minh (Người đăng)',
      content: 'Nên dùng Transactional Outbox Pattern kết hợp de-duplication ID trên Consumer để đảm bảo Idempotency.',
    },
  },
  {
    id: 'c2',
    authorName: 'Phạm Đức Duy',
    timestampSec: 940,
    timestampText: 'Mốc 15:40',
    content: 'Việc gom nhiều usecase interface vào 1 class Service có làm vi phạm Single Responsibility Principle (SRP) không?',
    upvotes: 28,
    hasUpvoted: false,
    creatorReply: {
      authorName: 'Trần Hoàng Minh (Người đăng)',
      content: 'SRP trong ngữ cảnh DDD nên xem xét theo Bounded Context và Aggregate. Gom các nghiệp vụ có chung phụ thuộc và cùng vòng đời dữ liệu vào 1 service giúp code sạch và dễ quản trị transaction hơn là phân mảnh quá nhỏ.',
    },
  },
];

export function DiscussionForum({
  initialComments = DEFAULT_COMMENTS,
  onSeekTimestamp,
}: DiscussionForumProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [newTimestamp, setNewTimestamp] = useState('08:15');
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');

  const displayName = user?.profile?.displayName || user?.username || 'Bạn';
  const initial = displayName.charAt(0).toUpperCase();

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const item: CommentItem = {
      id: `c_${Date.now()}`,
      authorName: user?.profile?.displayName ? `Bạn (${user.profile.displayName})` : displayName,
      authorAvatar: user?.profile?.avatar,
      timestampSec: 495,
      timestampText: `Mốc ${newTimestamp}`,
      content: newComment.trim(),
      upvotes: 1,
      hasUpvoted: true,
    };

    setComments([item, ...comments]);
    setNewComment('');
  };

  const handleVote = (id: string) => {
    setComments(
      comments.map((c) => {
        if (c.id === id) {
          const upvoted = !c.hasUpvoted;
          return {
            ...c,
            hasUpvoted: upvoted,
            upvotes: upvoted ? c.upvotes + 1 : c.upvotes - 1,
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="rounded-2xl border border-[#2d2d2d] bg-[#1a1a1a] p-4 sm:p-5 space-y-5 select-none">
      {/* Header Diễn đàn */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#9bf73c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
          <h3 className="text-xs font-bold text-[#ececec]">
            Bình luận & Thảo luận ({comments.length} chủ đề)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#8a8a8a]">Sắp xếp:</span>
          <button
            onClick={() => setSortBy('top')}
            className={`font-mono transition-colors ${
              sortBy === 'top' ? 'text-[#9bf73c] font-bold' : 'text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            Hàng đầu
          </button>
          <span className="text-[#333]">•</span>
          <button
            onClick={() => setSortBy('newest')}
            className={`font-mono transition-colors ${
              sortBy === 'newest' ? 'text-[#9bf73c] font-bold' : 'text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            Mới nhất
          </button>
        </div>
      </div>

      {/* Form Tạo Thảo Luận Mới Gắn Timestamp */}
      <form onSubmit={handleAddComment} className="space-y-2.5">
        <div className="flex items-start gap-3">
          {user?.profile?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile.avatar}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border border-[#9bf73c]/40 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#3d3d3d] flex items-center justify-center font-bold text-xs text-[#9bf73c] shrink-0">
              {initial}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Đặt câu hỏi phản biện hoặc đóng góp góc nhìn kỹ thuật..."
              rows={2}
              className="w-full p-2.5 rounded-xl bg-[#141414] border border-[#2d2d2d] focus:border-[#9bf73c] text-xs text-[#ececec] placeholder-[#717171] focus:outline-none resize-none transition-colors"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#8a8a8a] text-[11px]">Gắn mốc:</span>
                <input
                  type="text"
                  value={newTimestamp}
                  onChange={(e) => setNewTimestamp(e.target.value)}
                  className="w-16 px-2 py-0.5 rounded bg-[#141414] border border-[#333] text-[11px] font-mono text-[#9bf73c] text-center focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-[#9bf73c] text-[#141414] font-bold text-xs hover:bg-[#7ad81f] disabled:opacity-40 disabled:hover:bg-[#9bf73c] transition-all"
              >
                Gửi thảo luận
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Danh Sách Các Thread Thảo Luận */}
      <div className="space-y-3 pt-2">
        {comments.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl bg-[#222222] border border-[#2d2d2d] hover:border-[#3d3d3d] space-y-2.5 text-xs transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#ececec]">{item.authorName}</span>
                <button
                  type="button"
                  onClick={() => onSeekTimestamp && onSeekTimestamp(item.timestampSec)}
                  title="Nhấn để tua đến mốc này"
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#181818] text-[#9bf73c] border border-[#333] hover:border-[#9bf73c] transition-colors"
                >
                  {item.timestampText}
                </button>
              </div>

              {/* Upvote Button */}
              <button
                onClick={() => handleVote(item.id)}
                className={`flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-lg border transition-colors ${
                  item.hasUpvoted
                    ? 'bg-[#9bf73c]/15 text-[#9bf73c] border-[#9bf73c]/40 font-bold'
                    : 'bg-[#181818] text-[#8a8a8a] border-[#333] hover:text-[#ececec]'
                }`}
              >
                <span>▲</span>
                <span>{item.upvotes}</span>
              </button>
            </div>

            <p className="text-[#d4d4d4] font-medium leading-relaxed">
              {item.content}
            </p>

            {/* Phản hồi chính thức từ Chủ kênh */}
            {item.creatorReply && (
              <div className="p-2.5 rounded-lg bg-[#181818] border-l-2 border-[#9bf73c] text-[11px] text-[#aaa] space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#9bf73c]"></span>
                  <strong className="text-[#ececec]">{item.creatorReply.authorName}:</strong>
                </div>
                <p className="leading-relaxed pl-3 text-[#d4d4d4]">
                  {item.creatorReply.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
