import { VideoVisibility } from '../domain/enums/video-visibility.enum';
import { VideoStatus } from '../domain/enums/video-status.enum';

export class VideoConfigRes {
  visibility!: VideoVisibility;
  allowComments!: boolean;
  scheduledAt?: Date;

  static of(
    visibility: VideoVisibility,
    allowComments: boolean,
    scheduledAt?: Date,
  ): VideoConfigRes {
    const res = new VideoConfigRes();
    res.visibility = visibility;
    res.allowComments = allowComments;
    res.scheduledAt = scheduledAt;
    return res;
  }
}

export class VideoRes {
  videoId!: string;
  authorId!: string;
  description!: string;
  title!: string;
  thumbnail!: string;
  videoFile!: string;
  views!: number;
  likesCount?: number;
  sharesCount?: number;
  config!: VideoConfigRes;
  status?: VideoStatus;
  failureReason?: string | null;

  static of(
    videoId: string,
    authorId: string,
    description: string,
    title: string,
    thumbnail: string,
    videoFile: string,
    views: number,
    config: VideoConfigRes,
    likesCount = 0,
    sharesCount = 0,
    status?: VideoStatus,
    failureReason?: string | null,
  ): VideoRes {
    const res = new VideoRes();
    res.videoId = videoId;
    res.authorId = authorId;
    res.description = description;
    res.title = title;
    res.thumbnail = thumbnail;
    res.videoFile = videoFile;
    res.views = views;
    res.likesCount = likesCount;
    res.sharesCount = sharesCount;
    res.config = config;
    if (status !== undefined) {
      res.status = status;
    }
    if (failureReason !== undefined) {
      res.failureReason = failureReason;
    }
    return res;
  }
}

export class InitiateVideoUploadRes {
  videoId!: string;
  storageKey!: string;
  videoKey!: string;
  uploadUrl!: string;
  thumbnailKey?: string;
  thumbnailUploadUrl?: string;
  status!: VideoStatus;
  expiresInSeconds?: number;

  static of(props: {
    videoId: string;
    storageKey: string;
    videoKey: string;
    uploadUrl: string;
    status: VideoStatus;
    thumbnailKey?: string;
    thumbnailUploadUrl?: string;
    expiresInSeconds?: number;
  }): InitiateVideoUploadRes {
    const res = new InitiateVideoUploadRes();
    res.videoId = props.videoId;
    res.storageKey = props.storageKey;
    res.videoKey = props.videoKey;
    res.uploadUrl = props.uploadUrl;
    res.status = props.status;
    res.thumbnailKey = props.thumbnailKey;
    res.thumbnailUploadUrl = props.thumbnailUploadUrl;
    res.expiresInSeconds = props.expiresInSeconds;
    return res;
  }
}

export class CompleteVideoUploadRes {
  videoId!: string;
  status!: VideoStatus;
  storageKey!: string;
  etag?: string;
  message?: string;

  static of(props: {
    videoId: string;
    status: VideoStatus;
    storageKey: string;
    etag?: string;
    message?: string;
  }): CompleteVideoUploadRes {
    const res = new CompleteVideoUploadRes();
    res.videoId = props.videoId;
    res.status = props.status;
    res.storageKey = props.storageKey;
    res.etag = props.etag;
    res.message = props.message;
    return res;
  }
}

export type VideoStatusSseEventType =
  | 'status'
  | 'processing'
  | 'completed'
  | 'failed';

export class VideoStatusEventDto {
  videoId!: string;
  status!: VideoStatus;
  event?: VideoStatusSseEventType;
  message?: string;
  reason?: string | null;
  errorCode?: string | null;
  updatedAt?: string;
}

export class WatchVideoRes {
  videoId!: string;
  authorId!: string;
  description!: string;
  title!: string;
  thumbnail!: string;
  videoFile!: string;
  views!: number;
  likesCount?: number;
  sharesCount?: number;

  static of(
    videoId: string,
    authorId: string,
    description: string,
    title: string,
    thumbnail: string,
    videoFile: string,
    views: number,
    likesCount = 0,
    sharesCount = 0,
  ): WatchVideoRes {
    const res = new WatchVideoRes();
    res.videoId = videoId;
    res.authorId = authorId;
    res.description = description;
    res.title = title;
    res.thumbnail = thumbnail;
    res.videoFile = videoFile;
    res.views = views;
    res.likesCount = likesCount;
    res.sharesCount = sharesCount;
    return res;
  }
}

export class PlaylistRes {
  playlistId!: string;
  playlistName!: string;
  playlistDescription!: string;
  videos?: WatchVideoRes[];

  static of(
    playlistId: string,
    playlistName: string,
    playlistDescription: string,
    videos?: WatchVideoRes[],
  ): PlaylistRes {
    const res = new PlaylistRes();
    res.playlistId = playlistId;
    res.playlistName = playlistName;
    res.playlistDescription = playlistDescription;
    res.videos = videos;
    return res;
  }
}

export class ShareVideoResDto {
  videoId!: string;
  shareUrl!: string;
  embedCode?: string;
  totalShares!: number;

  static of(
    videoId: string,
    shareUrl: string,
    totalShares: number,
    embedCode?: string,
  ): ShareVideoResDto {
    const res = new ShareVideoResDto();
    res.videoId = videoId;
    res.shareUrl = shareUrl;
    res.totalShares = totalShares;
    res.embedCode = embedCode;
    return res;
  }
}

export class VideoLikeResDto {
  videoId!: string;
  isLiked!: boolean;
  totalLikes!: number;

  static of(
    videoId: string,
    isLiked: boolean,
    totalLikes: number,
  ): VideoLikeResDto {
    const res = new VideoLikeResDto();
    res.videoId = videoId;
    res.isLiked = isLiked;
    res.totalLikes = totalLikes;
    return res;
  }
}
