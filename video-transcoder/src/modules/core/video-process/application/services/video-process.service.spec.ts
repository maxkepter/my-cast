import { Readable } from 'node:stream';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type OutboxServiceContract } from '../../../messaging';
import {
  type LocalStorageService,
  MockStorageContract,
  StorageConnectionException,
  type StorageContract,
  type StorageUploadPayload,
} from '../../../storage';
import {
  MockVideoTranscodeService,
  VideoTranscodeException,
} from '../../../../infra/video-transcode';
import { VideoProcessErrorCode } from '../../domain/enums/video-process-error-code.enum';
import { VideoProcessCompletedEvent } from '../../domain/events/video-process-completed.event';
import { VideoProcessFailedEvent } from '../../domain/events/video-process-failed.event';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import { VideoProcessService } from './video-process.service';

const TEMP_DIR = '/tmp/mycast-transcode/job-abc';

function makeUploadedEvent(
  overrides: Partial<{
    id: string;
    videoId: string;
    authorId: string;
    videoKey: string;
    thumbnailKey: string | null;
  }> = {},
): VideoUploadedEvent {
  return VideoUploadedEvent.deserialize({
    id: overrides.id ?? '6f1c1e9a-2b7d-4c55-9f31-0b8f3c7a1d20',
    occuredOn: '2026-11-27T09:00:00.000Z',
    videoId: overrides.videoId ?? 'c0a8012e-0000-4000-8000-000000000001',
    authorId: overrides.authorId ?? 'c0a8012e-0000-4000-8000-0000000000aa',
    videoKey:
      overrides.videoKey ??
      'videos/c0a8012e-0000-4000-8000-000000000001/source.mp4',
    isSuccess: true,
    thumbnailKey: 'thumbnailKey' in overrides ? overrides.thumbnailKey : null,
    nodeId: 'node-1',
  });
}

function createMocks() {
  const outbox: Pick<OutboxServiceContract, 'publish'> = {
    publish: vi.fn(async (event) => [
      {
        id: 'ob-1',
        eventId: event.id,
        eventType: event.getEventName(),
        payload: event.serialize(),
        transport: 'redis-stream' as never,
        destination: event.getEventName(),
        status: 'PENDING' as never,
        retryCount: 0,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      },
    ]),
  };

  const localStorage: LocalStorageService = {
    createTempDir: vi.fn(async () => TEMP_DIR),
    ensureDir: vi.fn(async () => undefined),
    writeFile: vi.fn(async (p) => p),
    readFile: vi.fn(async () => Buffer.from('x')),
    createReadStream: vi.fn(() => Readable.from(['x'])),
    createWriteStream: vi.fn(),
    deleteFile: vi.fn(async () => undefined),
    deleteDir: vi.fn(async () => undefined),
    exists: vi.fn(async () => true),
    stat: vi.fn(async () => ({
      size: 1024,
      isFile: true,
      isDirectory: false,
      modifiedAt: new Date(0),
    })),
    listFiles: vi.fn(async () => [
      join(TEMP_DIR, 'hls', '720p', 'segment_000.ts'),
      join(TEMP_DIR, 'hls', '720p', 'playlist.m3u8'),
      join(TEMP_DIR, 'hls', 'master.m3u8'),
    ]),
    resolvePath: vi.fn((...paths) => join(...paths)),
    cleanupOrphanedDirs: vi.fn(async () => ({
      deletedDirsCount: 0,
      deletedFilesCount: 0,
      freedBytes: 0,
    })),
  };

  const uploadedPayloads: StorageUploadPayload[] = [];
  const storage: StorageContract = {
    ...MockStorageContract,
    downloadToFile: vi.fn(MockStorageContract.downloadToFile),
    upload: vi.fn(async (payload: StorageUploadPayload) => {
      uploadedPayloads.push(payload);
      return MockStorageContract.upload(payload);
    }),
  };

  const transcode = new MockVideoTranscodeService();
  vi.spyOn(transcode, 'probe').mockResolvedValue({
    duration: 120.5,
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    fps: 30,
    bitrate: 3000000,
    videoCodec: 'h264',
    audioCodec: 'aac',
    size: 45000000,
  });
  vi.spyOn(transcode, 'transcodeHls').mockResolvedValue(
    join(TEMP_DIR, 'hls', 'master.m3u8'),
  );
  vi.spyOn(transcode, 'generateThumbnail').mockResolvedValue(
    join(TEMP_DIR, 'thumbnails', 'thumbnail.jpg'),
  );
  vi.spyOn(transcode, 'generateStoryboard').mockResolvedValue({
    vttPath: join(TEMP_DIR, 'storyboard', 'storyboard.vtt'),
    spritePaths: [join(TEMP_DIR, 'storyboard', 'sprite_000.jpg')],
  });
  vi.spyOn(transcode, 'generatePreview').mockResolvedValue(
    join(TEMP_DIR, 'previews', 'preview.mp4'),
  );

  return {
    outbox,
    localStorage,
    storage,
    transcode,
    uploadedPayloads,
  };
}

describe('VideoProcessService', () => {
  let mocks: ReturnType<typeof createMocks>;
  let service: VideoProcessService;

  beforeEach(() => {
    mocks = createMocks();
    service = new VideoProcessService(
      mocks.outbox as OutboxServiceContract,
      mocks.localStorage,
      mocks.storage,
      mocks.transcode,
    );
  });

  it('processes video, uploads master.m3u8 last, publishes C3 completed event, and cleans temp dir', async () => {
    const event = makeUploadedEvent();
    const result = await service.process(event);

    expect(result).toEqual({
      masterPlaylistKey:
        'videos/c0a8012e-0000-4000-8000-000000000001/hls/master.m3u8',
      renditions: ['720p', '480p', '360p'],
    });

    expect(mocks.storage.downloadToFile).toHaveBeenCalledWith(
      event.videoKey,
      join(TEMP_DIR, 'source.mp4'),
    );
    expect(mocks.transcode.transcodeHls).toHaveBeenCalledWith(
      join(TEMP_DIR, 'source.mp4'),
      join(TEMP_DIR, 'hls'),
      expect.objectContaining({
        segmentDuration: 6,
        renditions: expect.arrayContaining([
          expect.objectContaining({ resolution: '720p' }),
          expect.objectContaining({ resolution: '480p' }),
          expect.objectContaining({ resolution: '360p' }),
        ]),
      }),
    );
    expect(mocks.transcode.generateThumbnail).toHaveBeenCalledWith(
      join(TEMP_DIR, 'source.mp4'),
      join(TEMP_DIR, 'thumbnails', 'thumbnail.jpg'),
      { timestampSec: 1 },
    );
    expect(mocks.transcode.generateStoryboard).toHaveBeenCalledWith(
      join(TEMP_DIR, 'source.mp4'),
      join(TEMP_DIR, 'storyboard'),
      { intervalSec: 5, width: 160, height: 90, columns: 10 },
    );
    expect(mocks.transcode.generatePreview).toHaveBeenCalledWith(
      join(TEMP_DIR, 'source.mp4'),
      join(TEMP_DIR, 'previews', 'preview.mp4'),
    );

    const uploadedKeys = mocks.uploadedPayloads.map((p) => p.key);
    expect(uploadedKeys).toEqual([
      'videos/c0a8012e-0000-4000-8000-000000000001/hls/720p/segment_000.ts',
      'videos/c0a8012e-0000-4000-8000-000000000001/hls/720p/playlist.m3u8',
      'videos/c0a8012e-0000-4000-8000-000000000001/thumbnails/thumbnail.jpg',
      'videos/c0a8012e-0000-4000-8000-000000000001/storyboard/storyboard.vtt',
      'videos/c0a8012e-0000-4000-8000-000000000001/storyboard/sprite_000.jpg',
      'videos/c0a8012e-0000-4000-8000-000000000001/previews/preview.mp4',
      'videos/c0a8012e-0000-4000-8000-000000000001/hls/master.m3u8',
    ]);
    expect(uploadedKeys[uploadedKeys.length - 1]).toBe(
      'videos/c0a8012e-0000-4000-8000-000000000001/hls/master.m3u8',
    );
    expect(mocks.uploadedPayloads.at(-1)?.contentType).toBe(
      'application/vnd.apple.mpegurl',
    );

    expect(mocks.outbox.publish).toHaveBeenCalledTimes(1);
    const published = vi.mocked(mocks.outbox.publish).mock.calls[0][0];
    expect(published).toBeInstanceOf(VideoProcessCompletedEvent);
    expect(published.getEventName()).toBe('video.process.completed');
    const serialized = JSON.parse(published.serialize()) as Record<
      string,
      unknown
    >;
    expect(serialized).toMatchObject({
      videoId: event.videoId,
      authorId: event.authorId,
      videoKey: event.videoKey,
      masterPlaylistKey:
        'videos/c0a8012e-0000-4000-8000-000000000001/hls/master.m3u8',
      thumbnailKey:
        'videos/c0a8012e-0000-4000-8000-000000000001/thumbnails/thumbnail.jpg',
      storyboardVttKey:
        'videos/c0a8012e-0000-4000-8000-000000000001/storyboard/storyboard.vtt',
      storyboardSpriteKeys: [
        'videos/c0a8012e-0000-4000-8000-000000000001/storyboard/sprite_000.jpg',
      ],
      previewKey:
        'videos/c0a8012e-0000-4000-8000-000000000001/previews/preview.mp4',
      renditions: ['720p', '480p', '360p'],
      duration: 120.5,
      width: 1280,
      height: 720,
    });

    expect(mocks.localStorage.deleteDir).toHaveBeenCalledWith(TEMP_DIR);
  });

  it('skips generateThumbnail and keeps inbound thumbnailKey when hasThumbnail is true', async () => {
    const event = makeUploadedEvent({
      thumbnailKey: 'videos/x/thumb.jpg',
    });

    await service.handle(event);

    expect(mocks.transcode.generateThumbnail).not.toHaveBeenCalled();
    const uploadedKeys = mocks.uploadedPayloads.map((p) => p.key);
    expect(uploadedKeys).not.toContain(
      `videos/${event.videoId}/thumbnails/thumbnail.jpg`,
    );

    const published = vi.mocked(mocks.outbox.publish).mock
      .calls[0][0] as VideoProcessCompletedEvent;
    expect(published.thumbnailKey).toBe('videos/x/thumb.jpg');
  });

  it('publishes failed event with INVALID_MEDIA, skips uploads, rethrows, and deletes tempDir when probe throws INVALID_MEDIA', async () => {
    const probeError = new VideoTranscodeException(
      'File does not contain a valid video stream',
      'INVALID_MEDIA',
    );
    vi.spyOn(mocks.transcode, 'probe').mockRejectedValueOnce(probeError);

    const event = makeUploadedEvent();
    await expect(service.process(event)).rejects.toThrow(probeError);

    expect(mocks.storage.upload).not.toHaveBeenCalled();
    expect(mocks.localStorage.deleteDir).toHaveBeenCalledWith(TEMP_DIR);

    expect(mocks.outbox.publish).toHaveBeenCalledTimes(1);
    const published = vi.mocked(mocks.outbox.publish).mock
      .calls[0][0] as VideoProcessFailedEvent;
    expect(published).toBeInstanceOf(VideoProcessFailedEvent);
    expect(published.errorCode).toBe(VideoProcessErrorCode.INVALID_MEDIA);
    expect(published.videoId).toBe(event.videoId);
    expect(published.authorId).toBe(event.authorId);
    expect(published.videoKey).toBe(event.videoKey);
  });

  it('maps download failures to DOWNLOAD_FAILED', async () => {
    vi.spyOn(mocks.storage, 'downloadToFile').mockRejectedValueOnce(
      new StorageConnectionException('network timeout'),
    );

    const event = makeUploadedEvent();
    await expect(service.process(event)).rejects.toThrow();

    const published = vi.mocked(mocks.outbox.publish).mock
      .calls[0][0] as VideoProcessFailedEvent;
    expect(published.errorCode).toBe(VideoProcessErrorCode.DOWNLOAD_FAILED);
    expect(mocks.localStorage.deleteDir).toHaveBeenCalledWith(TEMP_DIR);
  });

  it('maps upload failures to UPLOAD_FAILED', async () => {
    vi.spyOn(mocks.storage, 'upload').mockRejectedValueOnce(
      new StorageConnectionException('S3 write error'),
    );

    const event = makeUploadedEvent();
    await expect(service.process(event)).rejects.toThrow();

    const published = vi.mocked(mocks.outbox.publish).mock
      .calls[0][0] as VideoProcessFailedEvent;
    expect(published.errorCode).toBe(VideoProcessErrorCode.UPLOAD_FAILED);
    expect(mocks.localStorage.deleteDir).toHaveBeenCalledWith(TEMP_DIR);
  });

  it('rethrows the original processing error even when publishing failed event throws', async () => {
    const probeError = new VideoTranscodeException(
      'Corrupted header',
      'PROBE_FAILED',
    );
    vi.spyOn(mocks.transcode, 'probe').mockRejectedValueOnce(probeError);
    vi.mocked(mocks.outbox.publish).mockRejectedValueOnce(new Error('db down'));

    const event = makeUploadedEvent();
    await expect(service.process(event)).rejects.toBe(probeError);
    expect(mocks.localStorage.deleteDir).toHaveBeenCalledWith(TEMP_DIR);
  });

  it('sanitizes failure reason by stripping URLs, query strings, stack traces, and truncating to 500 chars', async () => {
    const longSuffix = 'a'.repeat(600);
    const unsafeError = new Error(
      `Download failed from https://s3.internal.local/bucket/source.mp4?X-Amz-Signature=topsecret123&Expires=999 ${longSuffix}\n    at VideoProcessService.process (/app/src/video-process.service.ts:10:5)`,
    );
    vi.spyOn(mocks.storage, 'downloadToFile').mockRejectedValueOnce(
      unsafeError,
    );

    const event = makeUploadedEvent();
    await expect(service.process(event)).rejects.toThrow();

    const published = vi.mocked(mocks.outbox.publish).mock
      .calls[0][0] as VideoProcessFailedEvent;
    expect(published.reason).not.toContain('https://');
    expect(published.reason).not.toContain('topsecret123');
    expect(published.reason).not.toContain('video-process.service.ts');
    expect(published.reason).toContain('[url]');
    expect(published.reason.length).toBeLessThanOrEqual(500);
  });
});
