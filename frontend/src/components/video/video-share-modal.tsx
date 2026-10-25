'use client';

import React, { useState, useEffect } from 'react';
import { videoService } from '@/services/video.service';
import { SharePlatform } from '@/types/video';

interface VideoShareModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  videoTitle?: string;
}

export function VideoShareModal({
  videoId,
  isOpen,
  onClose,
  videoTitle = 'Video MyCast',
}: VideoShareModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'embed'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    videoService
      .shareVideo(videoId, 'DIRECT_LINK')
      .then((res) => {
        if (!isMounted) return;
        setShareUrl(res.shareUrl);
        setEmbedCode(res.embedCode);
      })
      .catch((err) => {
        console.error('Failed to get share info:', err);
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        setShareUrl(`${origin}/watch/${videoId}?ref=direct_link`);
        setEmbedCode(
          `<iframe src="${origin}/embed/${videoId}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, videoId]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareSocial = (platform: SharePlatform) => {
    videoService.shareVideo(videoId, platform).catch(() => {});
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(videoTitle);

    let targetUrl = '';
    if (platform === 'FACEBOOK') {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    } else if (platform === 'TWITTER') {
      targetUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-[#2d2d2d] border border-[#525252] rounded-2xl p-6 shadow-2xl relative text-[#ececec] animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#525252]">
          <h3 className="text-lg font-bold text-[#ececec]">Chia sẻ video</h3>
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

        {/* Tab switch */}
        <div className="flex gap-2 mt-4 p-1 bg-[#1c1c1c] rounded-xl border border-[#3d3d3d]">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'link'
                ? 'bg-[#9bf73c] text-[#1c1c1c]'
                : 'text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            Liên kết chia sẻ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'embed'
                ? 'bg-[#9bf73c] text-[#1c1c1c]'
                : 'text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            Mã nhúng (Embed)
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'link' ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 p-2 bg-[#1c1c1c] border border-[#525252] rounded-xl">
              <input
                type="text"
                readOnly
                value={isLoading ? 'Đang tạo link...' : shareUrl}
                className="w-full bg-transparent text-sm text-[#d4d4d4] outline-hidden px-2 font-mono truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                  copiedLink
                    ? 'bg-[#9bf73c] text-[#1c1c1c]'
                    : 'bg-[#3d3d3d] text-[#ececec] hover:bg-[#525252]'
                }`}
              >
                {copiedLink ? (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Đã sao chép
                  </>
                ) : (
                  'Sao chép'
                )}
              </button>
            </div>

            {/* Social Share Buttons */}
            <div>
              <p className="text-xs text-[#8a8a8a] mb-2 font-medium">Chia sẻ lên mạng xã hội</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleShareSocial('FACEBOOK')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#1877f2]/10 hover:bg-[#1877f2]/20 text-[#1877f2] border border-[#1877f2]/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => handleShareSocial('TWITTER')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white/10 hover:bg-white/20 text-[#ececec] border border-[#525252] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X (Twitter)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <textarea
              readOnly
              rows={4}
              value={embedCode}
              className="w-full bg-[#1c1c1c] border border-[#525252] rounded-xl p-2.5 text-xs font-mono text-[#d4d4d4] resize-none outline-hidden focus:border-[#9bf73c]"
            />
            <button
              type="button"
              onClick={handleCopyEmbed}
              className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                copiedEmbed
                  ? 'bg-[#9bf73c] text-[#1c1c1c]'
                  : 'bg-[#3d3d3d] text-[#ececec] hover:bg-[#525252]'
              }`}
            >
              {copiedEmbed ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Đã sao chép mã nhúng
                </>
              ) : (
                'Sao chép mã nhúng iframe'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
