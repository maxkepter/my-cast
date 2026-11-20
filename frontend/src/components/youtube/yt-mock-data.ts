export interface YtVideo {
  id: string;
  title: string;
  channelName: string;
  channelAvatar: string;
  verified: boolean;
  thumbnail: string;
  views: string;
  timestamp: string;
  duration: string;
  category: string;
  badge?: '4K' | 'LIVE' | 'MỚI';
  liveViewers?: string;
}

export interface YtShort {
  id: string;
  title: string;
  views: string;
  thumbnail: string;
  tag: string;
}

export const CATEGORIES = [
  'Tất cả',
  'Podcasts',
  'Trực tiếp',
  'Âm nhạc',
  'Lập trình',
  'Trò chơi',
  'Tin tức',
  'Vừa tải lên',
  'AI & Công nghệ',
  'Đã xem',
  'Đề xuất mới',
];

export const MOCK_VIDEOS: YtVideo[] = [
  {
    id: 'v-yt-1',
    title: 'Xây Dựng Hệ Thống Video Streaming Siêu Quy Mô Với NestJS 11 & Next.js 16',
    channelName: 'MyCast Tech Hub',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    verified: true,
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
    views: '124K lượt xem',
    timestamp: '2 ngày trước',
    duration: '28:45',
    category: 'Lập trình',
    badge: '4K',
  },
  {
    id: 'v-yt-2',
    title: 'Podcast #48: Tương Lai Của AI Agentic Coding & Xu Hướng OpenDesign',
    channelName: 'The Creative Developer',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    verified: true,
    thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
    views: '89K lượt xem',
    timestamp: '4 ngày trước',
    duration: '1:12:30',
    category: 'Podcasts',
    badge: '4K',
  },
  {
    id: 'v-yt-3',
    title: 'TRỰC TIẾP: Chung Kết Giải Đấu Thể Thao Điện Tử MyCast Gaming Cup 2026',
    channelName: 'MyCast Esports Official',
    channelAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&auto=format&fit=crop&q=80',
    verified: true,
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    views: '15.8K người đang xem',
    timestamp: 'Đang phát sóng',
    duration: 'LIVE',
    category: 'Trực tiếp',
    badge: 'LIVE',
    liveViewers: '15.8K',
  },
  {
    id: 'v-yt-4',
    title: 'Học Thiết Kế UI/UX Chuẩn Hệ Màu Lime & Charcoal Cùng OpenDesign',
    channelName: 'Studio Design Lab',
    channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    verified: false,
    thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
    views: '45K lượt xem',
    timestamp: '1 tuần trước',
    duration: '18:15',
    category: 'AI & Công nghệ',
    badge: 'MỚI',
  },
  {
    id: 'v-yt-5',
    title: 'Tuyển Tập Nhạc Lofi Chill Cho Lập Trình Viên Đêm Muộn (Code & Relax)',
    channelName: 'Night Owls Beat',
    channelAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    verified: true,
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    views: '412K lượt xem',
    timestamp: '2 tuần trước',
    duration: '3:05:10',
    category: 'Âm nhạc',
  },
  {
    id: 'v-yt-6',
    title: 'Bí Quyết Xây Dựng Kênh Podcast Từ Số 0 Đạt 100.000 Người Đăng Ký',
    channelName: 'Audio Master VN',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    verified: true,
    thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
    views: '67K lượt xem',
    timestamp: '3 ngày trước',
    duration: '22:04',
    category: 'Podcasts',
  },
  {
    id: 'v-yt-7',
    title: 'Trải Nghiệm Đồ Họa 8K Siêu Thực Trên Unreal Engine 5.5',
    channelName: 'NextGen Graphics',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    verified: false,
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    views: '230K lượt xem',
    timestamp: '5 ngày trước',
    duration: '14:50',
    category: 'Trò chơi',
    badge: '4K',
  },
  {
    id: 'v-yt-8',
    title: 'Bản Tin Công Nghệ Tuần 46: Google Ra Mắt Thế Hệ AI Mới Nhất 2026',
    channelName: 'TechDaily News',
    channelAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    verified: true,
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    views: '98K lượt xem',
    timestamp: '1 ngày trước',
    duration: '16:35',
    category: 'Tin tức',
    badge: 'MỚI',
  },
];

export const MOCK_SHORTS: YtShort[] = [
  {
    id: 's-1',
    title: 'Phím tắt VS Code cực đỉnh ít người biết! ⚡',
    views: '1.4 Tr lượt xem',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&auto=format&fit=crop&q=80',
    tag: '#dev #coding',
  },
  {
    id: 's-2',
    title: 'Setup góc làm việc tối giản với tông màu Lime 🖥️',
    views: '860K lượt xem',
    thumbnail: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80',
    tag: '#workspace #desk',
  },
  {
    id: 's-3',
    title: 'Mic thu âm podcast chuẩn studio dưới 2 triệu đồng 🎙️',
    views: '540K lượt xem',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&auto=format&fit=crop&q=80',
    tag: '#podcast #audio',
  },
  {
    id: 's-4',
    title: 'Cú lật kèo ngoạn mục tại giải đấu eSports hôm nay! 🎮',
    views: '2.1 Tr lượt xem',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=80',
    tag: '#gaming #esports',
  },
  {
    id: 's-5',
    title: 'Tự động hóa Figma sang Code bằng AI trong 30 giây ✨',
    views: '920K lượt xem',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=400&auto=format&fit=crop&q=80',
    tag: '#ai #design',
  },
];
