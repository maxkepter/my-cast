import React from 'react';
import Link from 'next/link';

export function CtaSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#525252] bg-[#2d2d2d] px-8 py-14 md:px-16 md:py-16 text-center shadow-2xl shadow-black/50">
          {/* Decorative Circles */}
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#9bf73c]/10 blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#141414]/50 blur-[100px]" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#ececec] tracking-tight max-w-2xl mx-auto leading-tight">
              Sẵn sàng chia sẻ giọng nói và nội dung của bạn với thế giới?
            </h2>
            <p className="mt-4 text-[#8a8a8a] text-base sm:text-lg max-w-xl mx-auto">
              Tham gia cùng hàng ngàn Creator đang xây dựng cộng đồng của riêng mình trên My-Cast ngay hôm nay.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#9bf73c] px-8 py-3.5 text-base font-semibold text-[#1c1c1c] shadow-xl hover:bg-[#b6fa6b] active:bg-[#7ad81f] transition-colors"
              >
                Đăng ký tài khoản ngay
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-[#525252] bg-[#1c1c1c]/30 backdrop-blur-md px-8 py-3.5 text-base font-semibold text-[#ececec] hover:bg-[#3d3d3d] hover:text-[#9bf73c] transition-colors"
              >
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
