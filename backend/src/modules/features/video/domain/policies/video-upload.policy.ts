import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { extname } from 'node:path';
import { VideoVisibility } from '../enums/video-visibility.enum';
import { InitiateVideoUploadReq } from '../../dtos/req.dto';

export const MAX_VIDEO_SIZE_BYTES = 104_857_600; // 100 MB
export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_TITLE_LENGTH = 150;
export const MAX_VIDEO_DESCRIPTION_LENGTH = 5000;

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/x-matroska',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/x-m4v',
]);

export const ALLOWED_VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mkv',
  '.mov',
  '.avi',
  '.webm',
  '.m4v',
]);

export const ALLOWED_THUMBNAIL_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export const ALLOWED_THUMBNAIL_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
]);

@Injectable()
export class VideoUploadPolicy {
  validateInitiateRequest(req: InitiateVideoUploadReq): void {
    this.validateVideoFile(req.fileSize, req.contentType, req.fileName);
    this.validateMetadata(req);
    this.validateThumbnail(req);
  }

  validateVideoFile(
    fileSize: number,
    contentType: string,
    fileName: string,
  ): void {
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      throw new BadRequestException('fileSize must be a positive number');
    }

    if (fileSize > MAX_VIDEO_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        `Video file exceeds the maximum allowed size of ${MAX_VIDEO_SIZE_BYTES} bytes (100 MB)`,
      );
    }

    const normalizedMime = this.normalizeMimeType(contentType);
    const ext = this.extractExtension(fileName);

    if (
      !ALLOWED_VIDEO_MIME_TYPES.has(normalizedMime) ||
      !ALLOWED_VIDEO_EXTENSIONS.has(ext)
    ) {
      throw new UnsupportedMediaTypeException(
        `Unsupported media type "${contentType}" or extension "${ext || 'none'}". Allowed: MP4, MKV, MOV, AVI, WEBM, M4V`,
      );
    }
  }

  validateMetadata(req: InitiateVideoUploadReq): void {
    const trimmedTitle = req.title?.trim() ?? '';
    if (trimmedTitle.length < 1 || trimmedTitle.length > MAX_VIDEO_TITLE_LENGTH) {
      throw new BadRequestException(
        `title must be between 1 and ${MAX_VIDEO_TITLE_LENGTH} characters`,
      );
    }

    if (
      req.description !== undefined &&
      req.description.length > MAX_VIDEO_DESCRIPTION_LENGTH
    ) {
      throw new BadRequestException(
        `description must not exceed ${MAX_VIDEO_DESCRIPTION_LENGTH} characters`,
      );
    }

    const config = req.videoConfig;
    if (!config) {
      throw new BadRequestException('videoConfig is required');
    }

    if (config.visibility === VideoVisibility.SCHEDULED) {
      if (!config.scheduleAt) {
        throw new BadRequestException(
          'scheduleAt is required when visibility is SCHEDULED',
        );
      }
      const scheduledTime = new Date(config.scheduleAt).getTime();
      if (Number.isNaN(scheduledTime) || scheduledTime <= Date.now()) {
        throw new BadRequestException(
          'scheduleAt must be a valid future date and time',
        );
      }
    } else if (config.scheduleAt !== undefined && config.scheduleAt !== null) {
      throw new BadRequestException(
        'scheduleAt is only allowed when visibility is SCHEDULED',
      );
    }
  }

  validateThumbnail(req: InitiateVideoUploadReq): void {
    const hasThumbnail = Boolean(
      req.thumbnailFileName ||
        req.thumbnailContentType ||
        req.thumbnailSize !== undefined,
    );
    if (!hasThumbnail) {
      return;
    }

    if (req.thumbnailSize !== undefined) {
      if (!Number.isFinite(req.thumbnailSize) || req.thumbnailSize <= 0) {
        throw new BadRequestException(
          'thumbnailSize must be a positive number',
        );
      }
      if (req.thumbnailSize > MAX_THUMBNAIL_SIZE_BYTES) {
        throw new PayloadTooLargeException(
          `Thumbnail exceeds the maximum allowed size of ${MAX_THUMBNAIL_SIZE_BYTES} bytes (5 MB)`,
        );
      }
    }

    if (req.thumbnailContentType) {
      const normalizedThumbMime = this.normalizeMimeType(
        req.thumbnailContentType,
      );
      if (!ALLOWED_THUMBNAIL_MIME_TYPES.has(normalizedThumbMime)) {
        throw new UnsupportedMediaTypeException(
          `Unsupported thumbnail media type "${req.thumbnailContentType}". Allowed: PNG, JPG, WEBP`,
        );
      }
    }

    if (req.thumbnailFileName) {
      const thumbExt = this.extractExtension(req.thumbnailFileName);
      if (!ALLOWED_THUMBNAIL_EXTENSIONS.has(thumbExt)) {
        throw new UnsupportedMediaTypeException(
          `Unsupported thumbnail extension "${thumbExt || 'none'}". Allowed: .png, .jpg, .jpeg, .webp`,
        );
      }
    }
  }

  extractExtension(fileName: string): string {
    return extname(fileName?.trim() ?? '').toLowerCase();
  }

  resolveThumbnailExtension(fileName?: string, contentType?: string): string {
    const ext = fileName ? this.extractExtension(fileName) : '';
    if (ext && ALLOWED_THUMBNAIL_EXTENSIONS.has(ext)) {
      return ext;
    }
    const mime = contentType ? this.normalizeMimeType(contentType) : '';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    return '.jpg';
  }

  private normalizeMimeType(contentType: string): string {
    return (contentType ?? '').split(';')[0].trim().toLowerCase();
  }
}
