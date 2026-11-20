import { apiClient } from '@/lib/api-client';
import {
  SharePlatform,
  ShareVideoRes,
  UpdateVideoReq,
  VideoLikeRes,
  VideoRes,
} from '@/types/video';
import {
  CreatePlaylistReq,
  PaginatedPlaylistRes,
  PlaylistRes,
} from '@/types/playlist';
import { WatchHistoryRes } from '@/types/history';
import { mockVideoService } from './video.mock';

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_VIDEO === 'true' ||
  process.env.NODE_ENV === 'test' ||
  false;

export interface VideoServiceContract {
  getVideo(videoId: string): Promise<VideoRes>;
  updateVideo(videoId: string, req: UpdateVideoReq): Promise<VideoRes>;
  deleteVideo(videoId: string): Promise<void>;
  toggleLike(videoId: string): Promise<VideoLikeRes>;
  getReactionStatus(videoId: string): Promise<VideoLikeRes>;
  shareVideo(videoId: string, platform?: SharePlatform): Promise<ShareVideoRes>;
  createPlaylist(req: CreatePlaylistReq): Promise<PlaylistRes>;
  addVideoToPlaylist(playlistId: string, videoId: string): Promise<PlaylistRes>;
  getPlaylist(playlistId: string): Promise<PlaylistRes>;
  getPlaylistsByAuthor(authorId: string, page?: number, size?: number): Promise<PaginatedPlaylistRes>;
  getMyPlaylists(page?: number, size?: number): Promise<PaginatedPlaylistRes>;
  getWatchHistory(page?: number, size?: number): Promise<WatchHistoryRes>;
  removeFromWatchHistory(videoId: string): Promise<void>;
  clearWatchHistory(): Promise<void>;
}

class VideoService implements VideoServiceContract {
  async getVideo(videoId: string): Promise<VideoRes> {
    if (USE_MOCK) {
      return mockVideoService.getVideo(videoId);
    }
    try {
      const res = await apiClient.get<VideoRes>(`/api/videos/${videoId}`);
      return res.data;
    } catch (error) {
      // Fallback gracefully to mock in development if backend is offline
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.getVideo(videoId);
      }
      throw error;
    }
  }

  async updateVideo(videoId: string, req: UpdateVideoReq): Promise<VideoRes> {
    if (USE_MOCK) {
      return mockVideoService.updateVideo(videoId, req);
    }
    try {
      const res = await apiClient.patch<VideoRes>(`/api/videos/${videoId}`, req);
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.updateVideo(videoId, req);
      }
      throw error;
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    if (USE_MOCK) {
      return mockVideoService.deleteVideo(videoId);
    }
    try {
      await apiClient.delete(`/api/videos/${videoId}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.deleteVideo(videoId);
      }
      throw error;
    }
  }

  async toggleLike(videoId: string): Promise<VideoLikeRes> {
    if (USE_MOCK) {
      return mockVideoService.toggleLike({ videoId });
    }
    try {
      const res = await apiClient.post<VideoLikeRes>(`/api/videos/${videoId}/like`, { videoId });
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.toggleLike({ videoId });
      }
      throw error;
    }
  }

  async getReactionStatus(videoId: string): Promise<VideoLikeRes> {
    if (USE_MOCK) {
      return mockVideoService.getReactionStatus(videoId);
    }
    try {
      const res = await apiClient.get<VideoLikeRes>(`/api/videos/${videoId}/reaction-status`);
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.getReactionStatus(videoId);
      }
      throw error;
    }
  }

  async shareVideo(videoId: string, platform: SharePlatform = 'DIRECT_LINK'): Promise<ShareVideoRes> {
    if (USE_MOCK) {
      return mockVideoService.shareVideo({ videoId, platform });
    }
    try {
      const res = await apiClient.post<ShareVideoRes>(`/api/videos/${videoId}/share`, {
        videoId,
        platform,
      });
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.shareVideo({ videoId, platform });
      }
      throw error;
    }
  }

  async createPlaylist(req: CreatePlaylistReq): Promise<PlaylistRes> {
    if (USE_MOCK) {
      return mockVideoService.createPlaylist(req);
    }
    try {
      const res = await apiClient.post<PlaylistRes>('/api/playlists', req);
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.createPlaylist(req);
      }
      throw error;
    }
  }

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<PlaylistRes> {
    if (USE_MOCK) {
      return mockVideoService.addVideoToPlaylist({ playlistId, videoId });
    }
    try {
      const res = await apiClient.post<PlaylistRes>(`/api/playlists/${playlistId}/videos`, {
        playlistId,
        videoId,
      });
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.addVideoToPlaylist({ playlistId, videoId });
      }
      throw error;
    }
  }

  async getPlaylist(playlistId: string): Promise<PlaylistRes> {
    if (USE_MOCK) {
      return mockVideoService.getPlaylist(playlistId);
    }
    try {
      const res = await apiClient.get<PlaylistRes>(`/api/playlists/${playlistId}`);
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.getPlaylist(playlistId);
      }
      throw error;
    }
  }

  async getPlaylistsByAuthor(
    authorId: string,
    page = 1,
    size = 10
  ): Promise<PaginatedPlaylistRes> {
    if (USE_MOCK) {
      return mockVideoService.getPlaylists(authorId, page, size);
    }
    try {
      const res = await apiClient.get<PaginatedPlaylistRes>(`/api/playlists/author/${authorId}`, {
        params: { page, size },
      });
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.getPlaylists(authorId, page, size);
      }
      throw error;
    }
  }

  async getMyPlaylists(page = 1, size = 10): Promise<PaginatedPlaylistRes> {
    return this.getPlaylistsByAuthor('me', page, size);
  }

  async getWatchHistory(page = 1, size = 10): Promise<WatchHistoryRes> {
    if (USE_MOCK) {
      return mockVideoService.getWatchHistory(page, size);
    }
    try {
      const res = await apiClient.get<WatchHistoryRes>('/api/videos/history/me', {
        params: { page, size },
      });
      return res.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.getWatchHistory(page, size);
      }
      throw error;
    }
  }

  async removeFromWatchHistory(videoId: string): Promise<void> {
    if (USE_MOCK) {
      return mockVideoService.removeFromWatchHistory(videoId);
    }
    try {
      await apiClient.delete(`/api/videos/history/me/${videoId}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.removeFromWatchHistory(videoId);
      }
      throw error;
    }
  }

  async clearWatchHistory(): Promise<void> {
    if (USE_MOCK) {
      return mockVideoService.clearWatchHistory();
    }
    try {
      await apiClient.delete('/api/videos/history/me');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockVideoService.clearWatchHistory();
      }
      throw error;
    }
  }
}

export const videoService = new VideoService();
