'use client';

import React from 'react';
import Link from 'next/link';
import { MOCK_SHORTS } from './yt-mock-data';

export function YtShortsShelf() {
  return (
    <section className="my-8 pt-4 border-t border-[#2d2d2d]">
      {/* HEADER CỦA SHORTS SHELF */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff4444] text-white">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M17.77 10.32L10.3 5.96a2 2 0 00-3 1.74v8.6a2 2 0 003 1.74l7.47-4.36a2 2 0 000-3.48z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[#ececec] tracking-tight">MyCast Shorts</h2>
        </div>

        <Link
          href="/shorts"
          className="text-xs font-semibold text-[#9bf73c] hover:underline"
        >
          Xem tất cả
        </Link>
      </div>

      {/* DANH SÁCH THẺ DỌC 9:16 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {MOCK_SHORTS.map((short) => (
          <Link
            key={short.id}
            href={`/shorts/${short.id}`}
            className="group flex flex-col cursor-pointer"
          >
            <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-[#2d2d2d] border border-[#3d3d3d]/60">
              <img
                src={short.thumbnail}
                alt={short.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-3 left-3 right-3 text-left">
                <span className="text-[10px] font-bold text-[#9bf73c] uppercase tracking-wider block mb-1">
                  {short.tag}
                </span>
                <h4 className="text-xs font-semibold text-[#ececec] line-clamp-2 leading-snug">
                  {short.title}
                </h4>
                <p className="text-[11px] text-[#d4d4d4] mt-1 font-medium">
                  {short.views}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
