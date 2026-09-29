import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#525252] bg-[#141414] py-12 text-[#8a8a8a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9bf73c] text-[#1c1c1c] font-bold text-sm">
                M
              </div>
              <span className="text-lg font-bold text-[#ececec]">My-Cast</span>
            </div>
            <p className="text-sm text-[#8a8a8a]">
              Nền tảng truyền phát trực tiếp và sản xuất Video Podcast thế hệ mới, tối ưu độ trễ siêu thấp cho Creator.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#ececec] uppercase tracking-wider mb-4">Sản phẩm</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-[#9bf73c] transition-colors">
                  Livestream Studio
                </a>
              </li>
              <li>
                <a href="#live-preview" className="hover:text-[#9bf73c] transition-colors">
                  Podcast Audio Wave
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-[#9bf73c] transition-colors">
                  Kho lưu trữ VOD S3
                </a>
              </li>
              <li>
                <a href="#stats" className="hover:text-[#9bf73c] transition-colors">
                  Analytics & Tương tác
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#ececec] uppercase tracking-wider mb-4">Hỗ trợ & Tài nguyên</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register" className="hover:text-[#9bf73c] transition-colors">
                  Tạo kênh cá nhân
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#9bf73c] transition-colors">
                  Đăng nhập Studio
                </Link>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#9bf73c] transition-colors">
                  Bảng giá dịch vụ
                </a>
              </li>
              <li>
                <span className="hover:text-[#9bf73c] cursor-pointer">
                  Tài liệu API RTMP/HLS
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#ececec] uppercase tracking-wider mb-4">Pháp lý & Bảo mật</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="hover:text-[#9bf73c] cursor-pointer">
                  Điều khoản dịch vụ
                </span>
              </li>
              <li>
                <span className="hover:text-[#9bf73c] cursor-pointer">
                  Chính sách quyền riêng tư
                </span>
              </li>
              <li>
                <span className="hover:text-[#9bf73c] cursor-pointer">
                  Bảo vệ bản quyền Creator
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[#525252] pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#8a8a8a]">
          <p>© {new Date().getFullYear()} My-Cast Inc. Toàn bộ quyền được bảo lưu.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="hover:text-[#9bf73c] cursor-pointer">Hệ thống phân tán đa vùng</span>
            <span>•</span>
            <span className="hover:text-[#9bf73c] cursor-pointer">Độ khả dụng 99.9%</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
