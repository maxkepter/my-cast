export type VideoVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED' | 'SCHEDULED';
export type VideoReactionType = 'LIKE' | 'DISLIKE';
export type SharePlatform = 'DIRECT_LINK' | 'FACEBOOK' | 'TWITTER' | 'EMBED';

export interface VideoConfig {
  visibility: VideoVisibility;
  allowComments: boolean;
  scheduledAt?: string | null;
}

export interface VideoRes {
  videoId: string;
  authorId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  videoFile?: string;
  views: number;
  likesCount: number;
  sharesCount: number;
  config?: VideoConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateVideoReq {
  title?: string;
  description?: string;
  visibility?: VideoVisibility;
  allowComments?: boolean;
  scheduleAt?: string | null;
}

export interface ToggleVideoLikeReq {
  videoId: string;
}

export interface VideoLikeRes {
  videoId: string;
  isLiked: boolean;
  totalLikes: number;
}

export interface ShareVideoReq {
  videoId: string;
  platform?: SharePlatform;
}

export interface ShareVideoRes {
  videoId: string;
  shareUrl: string;
  embedCode: string;
  totalShares: number;
}
