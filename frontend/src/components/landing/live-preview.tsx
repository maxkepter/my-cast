'use client';

import React from 'react';

const chatMessages = [
  { user: 'Creator_Studio', message: 'Chào mọi người!', color: 'text-[#9bf73c]' },
  { user: 'Thảo Nguyên', message: 'Chất lượng âm thanh quá tốt', color: 'text-[#d2fda0]' },
  { user: 'Minh Hoàng', message: 'Độ trễ thấp quá!', color: 'text-[#3cc8f7]' },
  { user: 'Tech Voice', message: 'Mic mới test thử nghe đỉnh quá', color: 'text-[#f7c93c]' },
  { user: 'Linh Đỗ', message: 'Setup phòng thu đẹp quá', color: 'text-[#b48cff]' },
];

const audioBars = [14, 22, 30, 18, 36, 26, 12, 34, 24, 38, 20, 28, 16, 32, 22, 36, 14, 26, 30, 18, 34, 24, 12, 28];

export function LivePreview() {
  return (
    <section id="live-preview" className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#525252] bg-[#2d2d2d] backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Studio Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#525252] bg-[#1c1c1c]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2e5410] border border-[#5aa616]/40 px-2 py-0.5 text-[11px] font-bold text-[#9bf73c]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9bf73c] animate-pulse" />
                TRỰC TIẾP
              </span>
              <span className="text-xs text-[#8a8a8a] font-medium hidden sm:inline">
                Kênh: Tech Podcast Studio
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#ececec] font-medium">
              <svg className="h-4 w-4 text-[#9bf73c]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              2,480 đang xem
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3">
            {/* Main Preview (16:9 aspect) */}
            <div className="lg:col-span-2 relative bg-[#1c1c1c] aspect-video flex flex-col items-center justify-center overflow-hidden">
              {/* Podcast Audio Visualizer */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(155,247,60,0.08),transparent_60%)]" />
              <div className="flex items-end gap-1.5 h-24 mb-6 z-10">
                {audioBars.map((height, index) => (
                  <div
                    key={index}
                    className="w-2 rounded-full bg-gradient-to-t from-[#7ad81f] to-[#9bf73c] animate-pulse"
                    style={{
                      height: `${height * 2}px`,
                      animationDelay: `${index * 0.12}s`,
                      animationDuration: '1.2s',
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-[#ececec] font-medium z-10">
                # EP.42 — Bí quyết xây dựng Studio tại gia
              </p>
              <p className="text-xs text-[#8a8a8a] mt-1 z-10">Đang phát: 00:24:18 / 01:05:00</p>

              {/* Control Bar Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex gap-2">
                  <div className="h-9 w-9 rounded-full bg-[#2d2d2d] flex items-center justify-center text-[#ececec] border border-[#525252] hover:bg-[#3d3d3d] cursor-pointer">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-[#2d2d2d] flex items-center justify-center text-[#ececec] border border-[#525252] hover:bg-[#3d3d3d] cursor-pointer">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072M19.07 4.93a10 10 0 010 14.14M11 5a7.002 7.002 0 00-4.95 2.05" />
                    </svg>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-[#9bf73c] flex items-center justify-center text-[#1c1c1c] shadow-lg shadow-[#9bf73c]/30 hover:bg-[#b6fa6b] cursor-pointer font-bold">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <span className="rounded-md bg-[#2d2d2d]/90 backdrop-blur-md px-2 py-1 text-[11px] text-[#9bf73c] font-semibold border border-[#525252]">
                  4K • 60FPS
                </span>
              </div>
            </div>

            {/* Live Chat Panel */}
            <div className="border-t lg:border-t-0 lg:border-l border-[#525252] bg-[#141414] flex flex-col h-80 lg:h-auto">
              <div className="px-4 py-3 border-b border-[#525252] bg-[#1c1c1c]">
                <h4 className="text-sm font-semibold text-[#ececec]">Trò chuyện trực tiếp</h4>
              </div>
              <div className="flex-1 overflow-hidden px-4 py-3 space-y-2.5">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className="text-xs leading-relaxed">
                    <span className={`font-semibold ${msg.color}`}>{msg.user}: </span>
                    <span className="text-[#ececec]">{msg.message}</span>
                  </div>
                ))}
                <div className="text-xs text-[#8a8a8a] italic pt-1 animate-pulse">Đang nhập...</div>
              </div>
              <div className="p-3 border-t border-[#525252] bg-[#1c1c1c]">
                <div className="rounded-lg bg-[#2d2d2d] border border-[#525252] px-3 py-2 text-xs text-[#8a8a8a]">
                  Tham gia trò chuyện...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
