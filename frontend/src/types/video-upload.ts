import { VideoVisibility } from '@/types/video';

export const MAX_VIDEO_FILE_SIZE_BYTES = 104_857_600; // 100 MB
export const MAX_THUMBNAIL_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/x-matroska',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/x-m4v',
] as const;

export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.mkv',
  '.mov',
  '.avi',
  '.webm',
  '.m4v',
] as const;

export const SUPPORTED_THUMBNAIL_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type VideoUploadStatus =
  | 'UPLOADING'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED';

export type VideoStatusSseEventType =
  | 'status'
  | 'processing'
  | 'completed'
  | 'failed';

export type VideoProcessErrorCode =
  | 'INVALID_MEDIA'
  | 'PROBE_FAILED'
  | 'TRANSCODE_ERROR';

export interface VideoUploadConfigInput {
  visibility: VideoVisibility;
  allowComments: boolean;
  scheduleAt?: string | null;
}

export interface InitiateVideoUploadReq {
  title: string;
  description?: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  thumbnailFileName?: string;
  thumbnailContentType?: string;
  thumbnailSize?: number;
  videoConfig: VideoUploadConfigInput;
}

export interface InitiateVideoUploadRes {
  videoId: string;
  storageKey: string;
  videoKey: string;
  uploadUrl: string;
  thumbnailKey?: string;
  thumbnailUploadUrl?: string;
  status: VideoUploadStatus;
  expiresInSeconds?: number;
}

export interface CompleteVideoUploadReq {
  videoId: string;
}

export interface CompleteVideoUploadRes {
  videoId: string;
  status: VideoUploadStatus;
  storageKey: string;
  etag?: string;
  message?: string;
}

export interface VideoStatusEventPayload {
  videoId: string;
  status: VideoUploadStatus;
  event?: VideoStatusSseEventType;
  message?: string;
  reason?: string | null;
  errorCode?: VideoProcessErrorCode | string | null;
  updatedAt?: string;
}

export interface UploadProgressInfo {
  loaded: number;
  total: number;
  percentage: number;
}

export interface VideoStatusStreamHandlers {
  onEvent: (payload: VideoStatusEventPayload) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface VideoUploadServiceContract {
  initiateUpload(req: InitiateVideoUploadReq): Promise<InitiateVideoUploadRes>;
  uploadFileToS3(
    uploadUrl: string,
    file: File | Blob,
    onProgress?: (progress: UploadProgressInfo) => void,
    signal?: AbortSignal
  ): Promise<void>;
  completeUpload(req: CompleteVideoUploadReq): Promise<CompleteVideoUploadRes>;
  subscribeStatusEvents(
    videoId: string,
    handlers: VideoStatusStreamHandlers,
    signal?: AbortSignal
  ): Promise<void>;
}
