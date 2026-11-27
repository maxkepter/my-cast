import { posix } from 'node:path';
import { VideoProcessErrorCode } from '../enums/video-process-error-code.enum';
import { VideoProcessException } from '../exceptions/video-process.exception';

export class VideoAssetKeys {
  private constructor(private readonly videoId: string) {}

  static for(videoId: string): VideoAssetKeys {
    const trimmed = typeof videoId === 'string' ? videoId.trim() : '';
    if (
      !trimmed ||
      trimmed.includes('..') ||
      trimmed.includes('/') ||
      trimmed.includes('\\') ||
      /\s/.test(trimmed)
    ) {
      throw new VideoProcessException(
        'Invalid videoId for asset key generation',
        VideoProcessErrorCode.INVALID_MESSAGE,
      );
    }
    return new VideoAssetKeys(trimmed);
  }

  get hlsPrefix(): string {
    return `videos/${this.videoId}/hls/`;
  }

  hlsKey(relativePath: string): string {
    const raw = typeof relativePath === 'string' ? relativePath.trim() : '';
    if (!raw) {
      throw new VideoProcessException(
        'HLS relative path must not be empty',
        VideoProcessErrorCode.INVALID_MESSAGE,
      );
    }

    const posixPath = raw.replace(/\\/g, '/');
    if (posixPath.startsWith('/') || posixPath.includes('..')) {
      throw new VideoProcessException(
        'HLS relative path contains forbidden traversal or leading slash',
        VideoProcessErrorCode.INVALID_MESSAGE,
      );
    }

    const normalized = posix.normalize(posixPath);
    if (
      !normalized ||
      normalized === '.' ||
      normalized.startsWith('/') ||
      normalized.includes('..')
    ) {
      throw new VideoProcessException(
        'HLS relative path is invalid after normalization',
        VideoProcessErrorCode.INVALID_MESSAGE,
      );
    }

    return `${this.hlsPrefix}${normalized}`;
  }

  get masterPlaylistKey(): string {
    return `${this.hlsPrefix}master.m3u8`;
  }

  get thumbnailKey(): string {
    return `videos/${this.videoId}/thumbnails/thumbnail.jpg`;
  }

  storyboardKey(fileName: string): string {
    const raw = typeof fileName === 'string' ? fileName.trim() : '';
    if (!raw || raw.includes('..') || raw.includes('/') || raw.includes('\\')) {
      throw new VideoProcessException(
        'Storyboard file name contains forbidden characters',
        VideoProcessErrorCode.INVALID_MESSAGE,
      );
    }

    return `videos/${this.videoId}/storyboard/${raw}`;
  }

  get previewKey(): string {
    return `videos/${this.videoId}/previews/preview.mp4`;
  }
}
