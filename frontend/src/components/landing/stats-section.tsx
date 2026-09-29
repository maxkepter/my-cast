import React from 'react';

const stats = [
  { value: '10M+', label: 'Lượt xem hàng tháng' },
  { value: '99.9%', label: 'Uptime máy chủ truyền phát' },
  { value: '< 800ms', label: 'Độ trễ luồng phát toàn cầu' },
  { value: '50,000+', label: 'Giờ podcast được xuất bản' },
];

export function StatsSection() {
  return (
    <section id="stats" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#525252] bg-[#2d2d2d] backdrop-blur-xl px-8 py-12 md:px-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#ececec] tracking-tight">
              Được tin dùng bởi cộng đồng Creator Việt Nam
            </h2>
            <p className="mt-3 text-[#8a8a8a] text-sm sm:text-base">
              Hạ tầng truyền phát phân tán đa vùng, sẵn sàng cho mọi quy mô khán giả.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#9bf73c]">
                  {stat.value}
                </p>
                <p className="text-sm text-[#8a8a8a] font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
