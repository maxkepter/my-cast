export interface WatchVideoItem {
  videoId: string;
  authorId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  videoFile?: string;
  views: number;
  likesCount: number;
  sharesCount: number;
  watchedAt?: string;
  watchedSeconds?: number;
  durationSeconds?: number;
}

export interface WatchHistoryQueryReq {
  page?: number;
  size?: number;
}

export interface WatchHistoryRes {
  data: WatchVideoItem[];
  total: number;
  req?: {
    page: number;
    size: number;
  };
}
