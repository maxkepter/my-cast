import React from 'react';

const features = [
  {
    title: 'Ultra-Low Latency Streaming',
    description: 'Giao thức RTMP/WebRTC tối ưu hóa, tương tác độ trễ dưới 1 giây trên toàn cầu, nâng cao trải nghiệm Livestream thời gian thực.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Studio-Quality Audio & Video',
    description: 'Xử lý âm thanh đa luồng, hỗ trợ ghi hình độ phân giải cao 4K, chất lượng 320kbps như phòng thu chuyên nghiệp.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    ),
  },
  {
    title: 'Creator Studio & Storage CDN',
    description: 'Tích hợp hệ thống lưu trữ S3/MinIO, xuất bản video theo yêu cầu (VOD), phân phối nội dung toàn cầu an toàn.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
        />
      </svg>
    ),
  },
  {
    title: 'Real-time Analytics',
    description: 'Đo lường mức độ tương tác, số người xem đồng thời, phân tích doanh thu chi tiết theo thời gian thực.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[#9bf73c] uppercase tracking-widest mb-3">
            Tại sao chọn My-Cast
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#ececec] tracking-tight">
            Mọi công cụ Creator cần, gói gọn trong một Studio
          </h2>
          <p className="mt-4 text-[#8a8a8a] max-w-2xl mx-auto text-base sm:text-lg">
            Từ Livestream tương tác, sản xuất Podcast, đến lưu trữ và phân tích dữ liệu — My-Cast giúp bạn tập trung vào nội dung.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-[#525252] bg-[#2d2d2d] p-6 hover:bg-[#3d3d3d] hover:border-[#9bf73c]/50 hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="h-12 w-12 rounded-xl bg-[#1c1c1c] border border-[#525252] flex items-center justify-center text-[#9bf73c] shadow-lg mb-5 group-hover:scale-110 group-hover:border-[#9bf73c] transition-all"
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#ececec] mb-2">{feature.title}</h3>
              <p className="text-sm text-[#8a8a8a] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
