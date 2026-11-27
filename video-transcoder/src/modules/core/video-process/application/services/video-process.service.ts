import { Inject, Injectable, Logger } from '@nestjs/common';
import { basename, extname, join, relative } from 'node:path';
import { type Handler } from '../../../../../common/application/handler';
import { OUTBOX_SERVICE, type OutboxServiceContract } from '../../../messaging';
import {
  LOCAL_STORAGE_SERVICE,
  type LocalStorageService,
  STORAGE_CONTRACT,
  type StorageContract,
} from '../../../storage';
import {
  VIDEO_TRANSCODE_CONTRACT,
  type VideoTranscodeContract,
  VideoTranscodeException,
} from '../../../../infra/video-transcode';
import { VideoProcessErrorCode } from '../../domain/enums/video-process-error-code.enum';
import { VideoProcessCompletedEvent } from '../../domain/events/video-process-completed.event';
import { VideoProcessFailedEvent } from '../../domain/events/video-process-failed.event';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import { VideoProcessException } from '../../domain/exceptions/video-process.exception';
import { HlsRenditionLadder } from '../../domain/value-objects/hls-rendition-ladder.vo';
import { VideoAssetKeys } from '../../domain/value-objects/video-asset-keys.vo';
import {
  type ProcessVideoUseCase,
  type VideoProcessResult,
} from '../interfaces/process-video.usecase';

const FALLBACK_FAILURE_REASON = 'Video processing failed';
const MAX_FAILURE_REASON_LENGTH = 500;

const CONTENT_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.vtt': 'text/vtt',
  '.mp4': 'video/mp4',
};

function safeExt(videoKey: string): string {
  const ext = extname(videoKey);
  return /^\.[a-z0-9]{1,5}$/i.test(ext) ? ext : '.mp4';
}

function contentTypeFor(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

function mapErrorCode(error: unknown): VideoProcessErrorCode {
  if (error instanceof VideoProcessException) {
    return error.code;
  }
  if (error instanceof VideoTranscodeException) {
    if (error.code === 'INVALID_MEDIA') {
      return VideoProcessErrorCode.INVALID_MEDIA;
    }
    if (error.code === 'PROBE_FAILED') {
      return VideoProcessErrorCode.PROBE_FAILED;
    }
    return VideoProcessErrorCode.TRANSCODE_FAILED;
  }
  return VideoProcessErrorCode.UNKNOWN;
}

function sanitizeFailureReason(error: unknown): string {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const sanitized = rawMessage
    .replace(/\r?\n\s*at\s+[\s\S]*/g, '')
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/\?[^\s]*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!sanitized) {
    return FALLBACK_FAILURE_REASON;
  }

  return sanitized.slice(0, MAX_FAILURE_REASON_LENGTH);
}

@Injectable()
export class VideoProcessService
  implements ProcessVideoUseCase, Handler<VideoUploadedEvent>
{
  private readonly logger = new Logger(VideoProcessService.name);

  constructor(
    @Inject(OUTBOX_SERVICE)
    private readonly outbox: OutboxServiceContract,
    @Inject(LOCAL_STORAGE_SERVICE)
    private readonly localStorage: LocalStorageService,
    @Inject(STORAGE_CONTRACT)
    private readonly storage: StorageContract,
    @Inject(VIDEO_TRANSCODE_CONTRACT)
    private readonly transcode: VideoTranscodeContract,
  ) {}

  async handle(event: VideoUploadedEvent): Promise<void> {
    await this.process(event);
  }

  async process(event: VideoUploadedEvent): Promise<VideoProcessResult> {
    let tempDir: string | undefined;

    try {
      const keys = VideoAssetKeys.for(event.videoId);
      tempDir = await this.localStorage.createTempDir('job-');

      const inputPath = join(tempDir, `source${safeExt(event.videoKey)}`);
      try {
        await this.storage.downloadToFile(event.videoKey, inputPath);
      } catch (error) {
        throw new VideoProcessException(
          error instanceof Error
            ? error.message
            : 'Failed to download source video',
          VideoProcessErrorCode.DOWNLOAD_FAILED,
          error,
        );
      }

      const metadata = await this.transcode.probe(inputPath);
      const renditions = HlsRenditionLadder.DEFAULT.select(metadata);

      const hlsDir = join(tempDir, 'hls');
      await this.transcode.transcodeHls(inputPath, hlsDir, {
        segmentDuration: 6,
        renditions,
      });

      let thumbnailKey: string;
      let generatedThumbnailPath: string | undefined;
      if (!event.hasThumbnail) {
        const thumbnailsDir = join(tempDir, 'thumbnails');
        await this.localStorage.ensureDir(thumbnailsDir);
        generatedThumbnailPath = join(thumbnailsDir, 'thumbnail.jpg');
        await this.transcode.generateThumbnail(
          inputPath,
          generatedThumbnailPath,
          {
            timestampSec: Math.min(1, metadata.duration / 2),
          },
        );
        thumbnailKey = keys.thumbnailKey;
      } else {
        thumbnailKey = event.thumbnailKey as string;
      }

      const storyboardDir = join(tempDir, 'storyboard');
      const storyboard = await this.transcode.generateStoryboard(
        inputPath,
        storyboardDir,
        {
          intervalSec: 5,
          width: 160,
          height: 90,
          columns: 10,
        },
      );

      const previewsDir = join(tempDir, 'previews');
      await this.localStorage.ensureDir(previewsDir);
      const previewLocalPath = join(previewsDir, 'preview.mp4');
      await this.transcode.generatePreview(inputPath, previewLocalPath);

      // ponytail: sequential uploads; parallelize with a small pool if upload time dominates
      const hlsFiles = await this.localStorage.listFiles(hlsDir, true);
      let masterLocalPath: string | undefined;

      for (const filePath of hlsFiles) {
        const relPath = relative(hlsDir, filePath).replace(/\\/g, '/');
        if (relPath === 'master.m3u8') {
          masterLocalPath = filePath;
          continue;
        }
        await this.uploadFile(filePath, keys.hlsKey(relPath));
      }

      if (generatedThumbnailPath) {
        await this.uploadFile(generatedThumbnailPath, thumbnailKey);
      }

      const storyboardVttKey = keys.storyboardKey(basename(storyboard.vttPath));
      await this.uploadFile(storyboard.vttPath, storyboardVttKey);

      const storyboardSpriteKeys: string[] = [];
      for (const spritePath of storyboard.spritePaths) {
        const spriteKey = keys.storyboardKey(basename(spritePath));
        await this.uploadFile(spritePath, spriteKey);
        storyboardSpriteKeys.push(spriteKey);
      }

      await this.uploadFile(previewLocalPath, keys.previewKey);

      await this.uploadFile(
        masterLocalPath ?? join(hlsDir, 'master.m3u8'),
        keys.masterPlaylistKey,
      );

      const renditionNames = renditions.map((r) => r.resolution);

      await this.outbox.publish(
        new VideoProcessCompletedEvent({
          videoId: event.videoId,
          authorId: event.authorId,
          videoKey: event.videoKey,
          masterPlaylistKey: keys.masterPlaylistKey,
          thumbnailKey,
          storyboardVttKey,
          storyboardSpriteKeys,
          previewKey: keys.previewKey,
          renditions: renditionNames,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
        }),
      );

      return {
        masterPlaylistKey: keys.masterPlaylistKey,
        renditions: renditionNames,
      };
    } catch (error) {
      const failedEvent = new VideoProcessFailedEvent(
        event.videoId,
        sanitizeFailureReason(error),
        event.authorId,
        event.videoKey,
        mapErrorCode(error),
      );

      try {
        await this.outbox.publish(failedEvent);
      } catch {
        this.logger.error('Failed to publish VideoProcessFailedEvent');
      }

      throw error;
    } finally {
      if (tempDir) {
        await this.localStorage.deleteDir(tempDir).catch(() => {
          this.logger.warn('Failed to cleanup temp directory');
        });
      }
    }
  }

  private async uploadFile(localPath: string, key: string): Promise<void> {
    try {
      const fileStat = await this.localStorage.stat(localPath);
      await this.storage.upload({
        key,
        body: this.localStorage.createReadStream(localPath),
        contentLength: fileStat.size,
        contentType: contentTypeFor(localPath),
      });
    } catch (error) {
      throw new VideoProcessException(
        error instanceof Error ? error.message : `Failed to upload ${key}`,
        VideoProcessErrorCode.UPLOAD_FAILED,
        error,
      );
    }
  }
}
