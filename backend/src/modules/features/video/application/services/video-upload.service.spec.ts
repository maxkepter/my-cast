import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import {
  MockStorageContract,
  type StorageContract,
} from '../../../../core/storage';
import type {
  OutboxRes,
  QueueServiceContract,
} from '../../../../core/messaging';
import { Video } from '../../domain/entities/video.entity';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import {
  MAX_THUMBNAIL_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  VideoUploadPolicy,
} from '../../domain/policies/video-upload.policy';
import { VideoConfig } from '../../domain/value-objects/video-config.vo';
import { VideoStatusStreamService } from './video-status-stream.service';
import { VideoUploadService } from './video-upload.service';

describe('VideoUploadService', () => {
  let service: VideoUploadService;
  let videoRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let storageContract: StorageContract;
  let queueService: QueueServiceContract;
  let txSaveMock: ReturnType<typeof vi.fn>;
  let mockEm: EntityManager;
  let dataSource: DataSource;
  let streamService: VideoStatusStreamService;
  let emitStatusSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    videoRepo = {
      findOne: vi.fn(),
      save: vi.fn((entity: Video) => Promise.resolve(entity)),
    };

    storageContract = {
      ...MockStorageContract,
      getPresignedUploadUrl: vi.fn(MockStorageContract.getPresignedUploadUrl),
      updateVideoStatus: vi.fn(MockStorageContract.updateVideoStatus),
    };

    queueService = {
      publish: vi.fn().mockResolvedValue([
        {
          id: 'outbox-1',
          eventId: 'evt-1',
          eventType: VideoUploadedEvent.EVENT_NAME,
        } as OutboxRes,
      ]),
      publishMany: vi.fn().mockResolvedValue([]),
    };

    txSaveMock = vi.fn((entity: Video) => Promise.resolve(entity));
    mockEm = {
      getRepository: vi.fn().mockReturnValue({ save: txSaveMock }),
    } as unknown as EntityManager;

    dataSource = {
      transaction: vi.fn(async (cb: (em: EntityManager) => Promise<unknown>) =>
        cb(mockEm),
      ),
    } as unknown as DataSource;

    streamService = new VideoStatusStreamService();
    emitStatusSpy = vi.spyOn(streamService, 'emitStatus');

    service = new VideoUploadService(
      videoRepo as unknown as Repository<Video>,
      storageContract,
      queueService,
      dataSource,
      new VideoUploadPolicy(),
      streamService,
    );
  });

  describe('initiateUpload', () => {
    it('validates, requests presigned upload URL, and persists UPLOADING video', async () => {
      const res = await service.initiateUpload('creator-1', {
        title: 'Clean Architecture Demo',
        description: 'DDD + Outbox',
        fileName: 'demo.mp4',
        contentType: 'video/mp4',
        fileSize: 1024 * 1024,
        videoConfig: {
          visibility: VideoVisibility.PUBLIC,
          allowComments: true,
        },
      });

      expect(res.videoId).toBeTruthy();
      expect(res.storageKey).toBe(`videos/${res.videoId}`);
      expect(res.videoKey).toBe(`videos/${res.videoId}/video.mp4`);
      expect(res.uploadUrl).toContain(res.videoKey);
      expect(res.status).toBe(VideoStatus.UPLOADING);
      expect(res.thumbnailUploadUrl).toBeUndefined();

      expect(storageContract.getPresignedUploadUrl).toHaveBeenCalledTimes(1);
      expect(storageContract.getPresignedUploadUrl).toHaveBeenCalledWith(
        res.videoKey,
        expect.objectContaining({
          contentType: 'video/mp4',
          originalName: 'demo.mp4',
          contentLength: 1024 * 1024,
        }),
      );
      expect(videoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          authorId: 'creator-1',
          videoStatus: VideoStatus.UPLOADING,
          videoFile: res.videoKey,
        }),
      );
    });

    it('creates presigned URL for optional thumbnail when provided', async () => {
      const res = await service.initiateUpload('creator-1', {
        title: 'Video with Thumbnail',
        fileName: 'clip.webm',
        contentType: 'video/webm',
        fileSize: 2048,
        thumbnailFileName: 'cover.png',
        thumbnailContentType: 'image/png',
        thumbnailSize: 1024,
        videoConfig: {
          visibility: VideoVisibility.UNLISTED,
          allowComments: false,
        },
      });

      expect(res.thumbnailKey).toBe(`videos/${res.videoId}/thumbnail.png`);
      expect(res.thumbnailUploadUrl).toContain(res.thumbnailKey);
      expect(storageContract.getPresignedUploadUrl).toHaveBeenCalledTimes(2);
    });

    it('throws 413 PayloadTooLargeException when fileSize exceeds 100 MB', async () => {
      await expect(
        service.initiateUpload('creator-1', {
          title: 'Too Big',
          fileName: 'large.mp4',
          contentType: 'video/mp4',
          fileSize: MAX_VIDEO_SIZE_BYTES + 1,
          videoConfig: {
            visibility: VideoVisibility.PUBLIC,
            allowComments: true,
          },
        }),
      ).rejects.toThrow(PayloadTooLargeException);
      expect(videoRepo.save).not.toHaveBeenCalled();
    });

    it('throws 415 UnsupportedMediaTypeException for unsupported MIME or extension', async () => {
      await expect(
        service.initiateUpload('creator-1', {
          title: 'Bad Format',
          fileName: 'script.exe',
          contentType: 'application/octet-stream',
          fileSize: 1024,
          videoConfig: {
            visibility: VideoVisibility.PUBLIC,
            allowComments: true,
          },
        }),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('throws 413 when thumbnail exceeds 5 MB and 415 when thumbnail MIME is invalid', async () => {
      await expect(
        service.initiateUpload('creator-1', {
          title: 'Big Thumb',
          fileName: 'ok.mp4',
          contentType: 'video/mp4',
          fileSize: 1024,
          thumbnailFileName: 'big.jpg',
          thumbnailContentType: 'image/jpeg',
          thumbnailSize: MAX_THUMBNAIL_SIZE_BYTES + 1,
          videoConfig: {
            visibility: VideoVisibility.PUBLIC,
            allowComments: true,
          },
        }),
      ).rejects.toThrow(PayloadTooLargeException);

      await expect(
        service.initiateUpload('creator-1', {
          title: 'Bad Thumb',
          fileName: 'ok.mp4',
          contentType: 'video/mp4',
          fileSize: 1024,
          thumbnailFileName: 'anim.gif',
          thumbnailContentType: 'image/gif',
          thumbnailSize: 1024,
          videoConfig: {
            visibility: VideoVisibility.PUBLIC,
            allowComments: true,
          },
        }),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('throws BadRequestException for SCHEDULED without future scheduleAt or non-SCHEDULED with scheduleAt', async () => {
      await expect(
        service.initiateUpload('creator-1', {
          title: 'Missing scheduleAt',
          fileName: 'ok.mp4',
          contentType: 'video/mp4',
          fileSize: 1024,
          videoConfig: {
            visibility: VideoVisibility.SCHEDULED,
            allowComments: true,
          },
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.initiateUpload('creator-1', {
          title: 'Past scheduleAt',
          fileName: 'ok.mp4',
          contentType: 'video/mp4',
          fileSize: 1024,
          videoConfig: {
            visibility: VideoVisibility.SCHEDULED,
            allowComments: true,
            scheduleAt: new Date(Date.now() - 60_000),
          },
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.initiateUpload('creator-1', {
          title: 'Extra scheduleAt',
          fileName: 'ok.mp4',
          contentType: 'video/mp4',
          fileSize: 1024,
          videoConfig: {
            visibility: VideoVisibility.PUBLIC,
            allowComments: true,
            scheduleAt: new Date(Date.now() + 60_000),
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates 507 Insufficient Storage without saving video', async () => {
      vi.mocked(storageContract.getPresignedUploadUrl).mockRejectedValueOnce(
        new HttpException('No active storage node', HttpStatus.INSUFFICIENT_STORAGE),
      );

      await expect(
        service.initiateUpload('creator-1', {
          title: 'No Node',
          fileName: 'ok.mp4',
          contentType: 'video/mp4',
          fileSize: 1024,
          videoConfig: {
            visibility: VideoVisibility.PUBLIC,
            allowComments: true,
          },
        }),
      ).rejects.toMatchObject({ status: HttpStatus.INSUFFICIENT_STORAGE });
      expect(videoRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('completeUpload', () => {
    const createVideoEntity = (status = VideoStatus.UPLOADING) =>
      Video.create(
        '11111111-1111-4111-8111-111111111111',
        'creator-1',
        'desc',
        'My Video',
        'videos/11111111-1111-4111-8111-111111111111/thumbnail.jpg',
        'videos/11111111-1111-4111-8111-111111111111/video.mp4',
        0,
        VideoConfig.create(VideoVisibility.PUBLIC, true),
        0,
        0,
        status,
      );

    it('throws NotFoundException when video does not exist', async () => {
      videoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.completeUpload('creator-1', {
          videoId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller is not the author', async () => {
      videoRepo.findOne.mockResolvedValue(createVideoEntity());

      await expect(
        service.completeUpload('other-user', {
          videoId: '11111111-1111-4111-8111-111111111111',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when video is already FAILED', async () => {
      const video = createVideoEntity(VideoStatus.FAILED);
      video.markFailed('Corrupted stream');
      videoRepo.findOne.mockResolvedValue(video);

      await expect(
        service.completeUpload('creator-1', { videoId: video.videoId }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns idempotent 200 when video is already UPLOADED, PROCESSING, or PROCESSED', async () => {
      for (const status of [
        VideoStatus.UPLOADED,
        VideoStatus.PROCESSING,
        VideoStatus.PROCESSED,
      ]) {
        const video = createVideoEntity(status);
        videoRepo.findOne.mockResolvedValue(video);

        const res = await service.completeUpload('creator-1', {
          videoId: video.videoId,
        });

        expect(res.status).toBe(status);
        expect(res.storageKey).toBe(`videos/${video.videoId}`);
      }

      expect(storageContract.updateVideoStatus).not.toHaveBeenCalled();
      expect(queueService.publish).not.toHaveBeenCalled();
    });

    it('marks Storage READY, atomically updates Video + publishes VideoUploadedEvent, and emits SSE status', async () => {
      const video = createVideoEntity(VideoStatus.UPLOADING);
      videoRepo.findOne.mockResolvedValue(video);

      const res = await service.completeUpload('creator-1', {
        videoId: video.videoId,
      });

      expect(storageContract.updateVideoStatus).toHaveBeenCalledWith(
        video.videoFile,
        'READY',
      );
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(txSaveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          videoId: video.videoId,
          videoStatus: VideoStatus.UPLOADED,
        }),
      );
      expect(queueService.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          videoId: video.videoId,
          authorId: 'creator-1',
          videoKey: video.videoFile,
          isSuccess: true,
          thumbnailKey: video.thumbnail,
          nodeId: 'mock-node-1',
        }),
        undefined,
        mockEm,
      );
      expect(emitStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          videoId: video.videoId,
          status: VideoStatus.UPLOADED,
        }),
      );
      expect(res).toEqual({
        videoId: video.videoId,
        status: VideoStatus.UPLOADED,
        storageKey: `videos/${video.videoId}`,
        etag: 'mock-etag-12345',
        message: 'Video upload completed',
      });
    });

    it('aborts before DB transaction if storage verification throws NotFoundException', async () => {
      const video = createVideoEntity(VideoStatus.UPLOADING);
      videoRepo.findOne.mockResolvedValue(video);
      vi.mocked(storageContract.updateVideoStatus).mockRejectedValueOnce(
        new NotFoundException('Uploaded object not found in storage'),
      );

      await expect(
        service.completeUpload('creator-1', { videoId: video.videoId }),
      ).rejects.toThrow(NotFoundException);

      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(queueService.publish).not.toHaveBeenCalled();
    });
  });

  describe('getUploadStatusSnapshot', () => {
    it('returns status and failureReason for owner and rejects non-owner with 403', async () => {
      const video = Video.create(
        'vid-1',
        'creator-1',
        '',
        'Title',
        '',
        'videos/vid-1/video.mp4',
        0,
        VideoConfig.create(VideoVisibility.PUBLIC, true),
        0,
        0,
        VideoStatus.FAILED,
      );
      video.markFailed('Unsupported codec');
      videoRepo.findOne.mockResolvedValue(video);

      await expect(
        service.getUploadStatusSnapshot('intruder', 'vid-1'),
      ).rejects.toThrow(ForbiddenException);

      const snapshot = await service.getUploadStatusSnapshot('creator-1', 'vid-1');
      expect(snapshot).toMatchObject({
        videoId: 'vid-1',
        status: VideoStatus.FAILED,
        reason: 'Unsupported codec',
      });
    });
  });
});
