import {
  ShareVideoReq,
  ShareVideoRes,
  ToggleVideoLikeReq,
  UpdateVideoReq,
  VideoLikeRes,
  VideoRes,
} from '@/types/video';
import {
  AddVideoToPlaylistReq,
  CreatePlaylistReq,
  PaginatedPlaylistRes,
  PlaylistRes,
} from '@/types/playlist';
import { WatchHistoryRes, WatchVideoItem } from '@/types/history';

export const MockVideoData = {
  sampleVideo: {
    videoId: 'v-101',
    authorId: 'u-creator-1',
    title: 'Xây dựng Clean Architecture với NestJS và Next.js 15',
    description: 'Video hướng dẫn chi tiết cách phân tầng DDD và thiết kế fullstack monorepo chuẩn enterprise.',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    views: 12500,
    likesCount: 840,
    sharesCount: 142,
    config: {
      visibility: 'PUBLIC' as const,
      allowComments: true,
      scheduledAt: null,
    },
  },
  sampleReactionStatus: {
    videoId: 'v-101',
    isLiked: false,
    totalLikes: 840,
  },
  sampleShareResult: {
    videoId: 'v-101',
    shareUrl: 'http://localhost:3000/watch/v-101?ref=share',
    embedCode: '<iframe src="http://localhost:3000/embed/v-101" width="100%" height="480" frameborder="0" allowfullscreen></iframe>',
    totalShares: 143,
  },
  samplePlaylists: [
    {
      playlistId: 'pl-201',
      playlistName: 'Khóa học TypeScript Chuyên Sâu',
      playlistDescription: 'Tổng hợp từ cơ bản đến nâng cao cho Backend Dev',
      visibility: 'PUBLIC' as const,
      authorId: 'u-creator-1',
      videos: [
        {
          videoId: 'v-101',
          authorId: 'u-creator-1',
          title: 'Bài 1: Setup Architecture',
          description: 'Khởi tạo monorepo',
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
          videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          views: 12500,
          likesCount: 840,
          sharesCount: 142,
          durationSeconds: 720,
        },
        {
          videoId: 'v-102',
          authorId: 'u-creator-1',
          title: 'Bài 2: Domain-Driven Design & Aggregates',
          description: 'Mô hình hóa entity và value object',
          thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
          videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          views: 8900,
          likesCount: 620,
          sharesCount: 95,
          durationSeconds: 940,
        },
        {
          videoId: 'v-103',
          authorId: 'u-creator-1',
          title: 'Bài 3: NestJS Clean Architecture Wiring',
          description: 'Cấu hình module, controllers và usecase services',
          thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
          videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          views: 6400,
          likesCount: 480,
          sharesCount: 61,
          durationSeconds: 1100,
        },
      ],
    },
    {
      playlistId: 'pl-202',
      playlistName: 'Next.js 15 App Router & Tailwind CSS',
      playlistDescription: 'Xây dựng giao diện hiện đại với Lime & Charcoal theme',
      visibility: 'PUBLIC' as const,
      authorId: 'u-creator-1',
      videos: [
        {
          videoId: 'v-104',
          authorId: 'u-creator-1',
          title: 'Giao diện video player và sidebar danh sách phát',
          description: 'Thực hành flexbox và responsive layout',
          thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
          videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          views: 4300,
          likesCount: 310,
          sharesCount: 42,
          durationSeconds: 650,
        },
      ],
    },
  ],
  sampleWatchHistory: {
    data: [
      {
        videoId: 'v-101',
        authorId: 'u-creator-1',
        title: 'Xây dựng Clean Architecture với NestJS và Next.js 15',
        description: 'Video hướng dẫn chi tiết cách phân tầng DDD',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        views: 12500,
        likesCount: 840,
        sharesCount: 142,
        watchedAt: '2026-03-30T10:15:00.000Z',
        watchedSeconds: 450,
        durationSeconds: 720,
      },
      {
        videoId: 'v-102',
        authorId: 'u-creator-1',
        title: 'Bài 2: Domain-Driven Design & Aggregates',
        description: 'Mô hình hóa entity và value object',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        views: 8900,
        likesCount: 620,
        sharesCount: 95,
        watchedAt: '2026-03-29T16:40:00.000Z',
        watchedSeconds: 940,
        durationSeconds: 940,
      },
      {
        videoId: 'v-103',
        authorId: 'u-creator-1',
        title: 'Bài 3: NestJS Clean Architecture Wiring',
        description: 'Cấu hình module, controllers và usecase services',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
        videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        views: 6400,
        likesCount: 480,
        sharesCount: 61,
        watchedAt: '2026-03-25T08:20:00.000Z',
        watchedSeconds: 320,
        durationSeconds: 1100,
      },
    ],
    total: 3,
    req: { page: 1, size: 10 },
  },
};

// In-memory state storage for realistic mock interactive testing
let mockVideos: VideoRes[] = [
  { ...MockVideoData.sampleVideo },
  {
    videoId: 'v-102',
    authorId: 'u-creator-1',
    title: 'Bài 2: Domain-Driven Design & Aggregates',
    description: 'Mô hình hóa entity và value object',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    views: 8900,
    likesCount: 620,
    sharesCount: 95,
    config: { visibility: 'PUBLIC', allowComments: true, scheduledAt: null },
  },
  {
    videoId: 'v-103',
    authorId: 'u-creator-1',
    title: 'Bài 3: NestJS Clean Architecture Wiring',
    description: 'Cấu hình module, controllers và usecase services',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
    videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    views: 6400,
    likesCount: 480,
    sharesCount: 61,
    config: { visibility: 'PUBLIC', allowComments: true, scheduledAt: null },
  },
  {
    videoId: 'v-104',
    authorId: 'u-creator-1',
    title: 'Giao diện video player và sidebar danh sách phát',
    description: 'Thực hành flexbox và responsive layout',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
    videoFile: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    views: 4300,
    likesCount: 310,
    sharesCount: 42,
    config: { visibility: 'PUBLIC', allowComments: true, scheduledAt: null },
  },
];

const mockPlaylists: PlaylistRes[] = JSON.parse(JSON.stringify(MockVideoData.samplePlaylists));
const mockReactionStatus: Record<string, { isLiked: boolean; totalLikes: number }> = {
  'v-101': { isLiked: false, totalLikes: 840 },
  'v-102': { isLiked: true, totalLikes: 620 },
  'v-103': { isLiked: false, totalLikes: 480 },
  'v-104': { isLiked: false, totalLikes: 310 },
};
let mockWatchHistoryItems: WatchVideoItem[] = JSON.parse(
  JSON.stringify(MockVideoData.sampleWatchHistory.data)
);

export class MockVideoService {
  async getVideo(videoId: string): Promise<VideoRes> {
    const video = mockVideos.find((v) => v.videoId === videoId);
    if (!video) {
      return {
        ...MockVideoData.sampleVideo,
        videoId,
      };
    }
    return { ...video };
  }

  async updateVideo(videoId: string, req: UpdateVideoReq): Promise<VideoRes> {
    const index = mockVideos.findIndex((v) => v.videoId === videoId);
    if (index === -1) {
      const fallback: VideoRes = {
        ...MockVideoData.sampleVideo,
        videoId,
        title: req.title ?? MockVideoData.sampleVideo.title,
        description: req.description ?? MockVideoData.sampleVideo.description,
        config: {
          visibility: req.visibility ?? 'PUBLIC',
          allowComments: req.allowComments ?? true,
          scheduledAt: req.scheduleAt ?? null,
        },
      };
      mockVideos.push(fallback);
      return fallback;
    }
    const current = mockVideos[index];
    const updated: VideoRes = {
      ...current,
      title: req.title ?? current.title,
      description: req.description ?? current.description,
      config: {
        visibility: req.visibility ?? current.config?.visibility ?? 'PUBLIC',
        allowComments: req.allowComments ?? current.config?.allowComments ?? true,
        scheduledAt: req.scheduleAt ?? current.config?.scheduledAt ?? null,
      },
      updatedAt: new Date().toISOString(),
    };
    mockVideos[index] = updated;
    return updated;
  }

  async deleteVideo(videoId: string): Promise<void> {
    mockVideos = mockVideos.filter((v) => v.videoId !== videoId);
    mockPlaylists.forEach((pl) => {
      pl.videos = pl.videos.filter((v) => v.videoId !== videoId);
    });
    mockWatchHistoryItems = mockWatchHistoryItems.filter((item) => item.videoId !== videoId);
  }

  async toggleLike(req: ToggleVideoLikeReq): Promise<VideoLikeRes> {
    const current = mockReactionStatus[req.videoId] || {
      isLiked: false,
      totalLikes: 840,
    };
    const nextLiked = !current.isLiked;
    const nextTotal = nextLiked ? current.totalLikes + 1 : Math.max(0, current.totalLikes - 1);
    mockReactionStatus[req.videoId] = {
      isLiked: nextLiked,
      totalLikes: nextTotal,
    };
    return {
      videoId: req.videoId,
      isLiked: nextLiked,
      totalLikes: nextTotal,
    };
  }

  async getReactionStatus(videoId: string): Promise<VideoLikeRes> {
    const current = mockReactionStatus[videoId] || {
      isLiked: false,
      totalLikes: 840,
    };
    return {
      videoId,
      isLiked: current.isLiked,
      totalLikes: current.totalLikes,
    };
  }

  async shareVideo(req: ShareVideoReq): Promise<ShareVideoRes> {
    const platform = req.platform || 'DIRECT_LINK';
    const currentVideo = mockVideos.find((v) => v.videoId === req.videoId);
    const sharesCount = (currentVideo?.sharesCount || 142) + 1;
    if (currentVideo) {
      currentVideo.sharesCount = sharesCount;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return {
      videoId: req.videoId,
      shareUrl: `${origin}/watch/${req.videoId}?ref=${platform.toLowerCase()}`,
      embedCode: `<iframe src="${origin}/embed/${req.videoId}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`,
      totalShares: sharesCount,
    };
  }

  async createPlaylist(req: CreatePlaylistReq, authorId = 'u-creator-1'): Promise<PlaylistRes> {
    const newPlaylist: PlaylistRes = {
      playlistId: `pl-${Date.now()}`,
      playlistName: req.playlistName,
      playlistDescription: req.playlistDescription || '',
      visibility: req.visibility || 'PUBLIC',
      authorId,
      videos: [],
      createdAt: new Date().toISOString(),
    };
    mockPlaylists.unshift(newPlaylist);
    return newPlaylist;
  }

  async addVideoToPlaylist(req: AddVideoToPlaylistReq): Promise<PlaylistRes> {
    const pl = mockPlaylists.find((p) => p.playlistId === req.playlistId);
    if (!pl) {
      throw new Error('Playlist không tồn tại');
    }
    const alreadyExists = pl.videos.some((v) => v.videoId === req.videoId);
    if (alreadyExists) {
      return pl;
    }

    const videoSource = mockVideos.find((v) => v.videoId === req.videoId) || {
      ...MockVideoData.sampleVideo,
      videoId: req.videoId,
    };

    pl.videos.push({
      videoId: videoSource.videoId,
      authorId: videoSource.authorId,
      title: videoSource.title,
      description: videoSource.description,
      thumbnail: videoSource.thumbnail,
      videoFile: videoSource.videoFile,
      views: videoSource.views,
      likesCount: videoSource.likesCount,
      sharesCount: videoSource.sharesCount,
      durationSeconds: 600,
    });
    return pl;
  }

  async getPlaylist(playlistId: string): Promise<PlaylistRes> {
    const pl = mockPlaylists.find((p) => p.playlistId === playlistId);
    if (pl) {
      return pl;
    }
    // Fallback to sample
    return mockPlaylists[0] || {
      playlistId,
      playlistName: 'Danh sách phát mẫu',
      videos: [],
    };
  }

  async getPlaylists(authorId = 'u-creator-1', page = 1, size = 10): Promise<PaginatedPlaylistRes> {
    const filtered = authorId === 'me'
      ? mockPlaylists
      : mockPlaylists.filter((p) => !p.authorId || p.authorId === authorId);
    const start = (page - 1) * size;
    const paged = filtered.slice(start, start + size);
    return {
      data: paged,
      total: filtered.length,
      req: { page, size },
    };
  }

  async getWatchHistory(page = 1, size = 10): Promise<WatchHistoryRes> {
    const start = (page - 1) * size;
    const paged = mockWatchHistoryItems.slice(start, start + size);
    return {
      data: paged,
      total: mockWatchHistoryItems.length,
      req: { page, size },
    };
  }

  async removeFromWatchHistory(videoId: string): Promise<void> {
    mockWatchHistoryItems = mockWatchHistoryItems.filter((i) => i.videoId !== videoId);
  }

  async clearWatchHistory(): Promise<void> {
    mockWatchHistoryItems = [];
  }
}

export const mockVideoService = new MockVideoService();
