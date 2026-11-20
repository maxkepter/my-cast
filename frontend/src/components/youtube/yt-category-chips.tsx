'use client';

import React from 'react';
import { CATEGORIES } from './yt-mock-data';

interface YtCategoryChipsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function YtCategoryChips({
  selectedCategory,
  onSelectCategory,
}: YtCategoryChipsProps) {
  return (
    <div className="sticky top-14 z-40 bg-[#1c1c1c]/95 backdrop-blur-md py-3 px-4 sm:px-6 border-b border-[#2d2d2d] flex items-center gap-2.5 overflow-x-auto scrollbar-none select-none">
      {CATEGORIES.map((cat) => {
        const isActive = cat === selectedCategory;
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
              isActive
                ? 'bg-[#ececec] text-[#141414] shadow-sm'
                : 'bg-[#2d2d2d] text-[#ececec] hover:bg-[#3d3d3d] border border-transparent hover:border-[#525252]'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
