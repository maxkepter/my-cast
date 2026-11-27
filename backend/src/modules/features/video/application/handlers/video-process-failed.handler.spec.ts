import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import {
  MockStorageContract,
  type StorageContract,
} from '../../../../core/storage';
import {
  type InboxServiceContract,
  TransportType,
} from '../../../../core/messaging';
import { Video } from '../../domain/entities/video.entity';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { VideoProcessFailedEvent } from '../../domain/events/video-process-failed.event';
import { VideoConfig } from '../../domain/value-objects/video-config.vo';
import { VideoProcessFailedConsumer } from '../../infra/listeners/video-process-failed.consumer';
import { VideoStatusStreamService } from '../services/video-status-stream.service';
import { VideoProcessFailedHandler } from './video-process-failed.handler';

describe('VideoProcessFailedHandler & VideoProcessFailedConsumer', () => {
  let handler: VideoProcessFailedHandler;
  let consumer: VideoProcessFailedConsumer;
  let videoRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let storageContract: StorageContract;
  let streamService: VideoStatusStreamService;
  let emitStatusSpy: ReturnType<typeof vi.spyOn>;
  let inboxService: InboxServiceContract;

  const makeVideo = (status: VideoStatus, thumbnail = 'videos/v-1/thumb.jpg') =>
    Video.create(
      '11111111-1111-4111-8111-111111111111',
      'creator-1',
      'desc',
      'title',
      thumbnail,
      'videos/11111111-1111-4111-8111-111111111111/video.mp4',
      0,
      VideoConfig.create(VideoVisibility.PUBLIC, true),
      0,
      0,
      status,
    );

  beforeEach(() => {
    const qb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    videoRepo = {
      findOne: vi.fn(),
      save: vi.fn((entity: Video) => Promise.resolve(entity)),
      createQueryBuilder: vi.fn().mockReturnValue(qb),
    };

    storageContract = {
      ...MockStorageContract,
      updateVideoStatus: vi.fn(MockStorageContract.updateVideoStatus),
    };

    streamService = new VideoStatusStreamService();
    emitStatusSpy = vi.spyOn(streamService, 'emitStatus');

    handler = new VideoProcessFailedHandler(
      videoRepo as unknown as Repository<Video>,
      storageContract,
      streamService,
    );

    inboxService = {
      tryInsert: vi.fn().mockResolvedValue(true),
      findByEventAndConsumer: vi.fn().mockResolvedValue(null),
      markAsProcessed: vi.fn().mockResolvedValue(undefined),
      markAsFailed: vi.fn().mockResolvedValue(undefined),
      deleteProcessedBefore: vi.fn().mockResolvedValue(0),
      executeOnce: vi.fn(async (_req, data, h) => {
        await h.handle(data);
        return true;
      }),
    };

    consumer = new VideoProcessFailedConsumer(handler, inboxService);
  });

  describe('VideoProcessFailedHandler', () => {
    it('skips safely when video does not exist', async () => {
      videoRepo.findOne.mockResolvedValue(null);

      await handler.handle(
        new VideoProcessFailedEvent(
          '11111111-1111-4111-8111-111111111111',
          'Missing video',
        ),
      );

      expect(videoRepo.save).not.toHaveBeenCalled();
      expect(storageContract.updateVideoStatus).not.toHaveBeenCalled();
      expect(emitStatusSpy).not.toHaveBeenCalled();
    });

    it('ignores failure event if video is already terminal PROCESSED', async () => {
      videoRepo.findOne.mockResolvedValue(makeVideo(VideoStatus.PROCESSED));

      await handler.handle(
        new VideoProcessFailedEvent(
          '11111111-1111-4111-8111-111111111111',
          'Late failure',
        ),
      );

      expect(videoRepo.save).not.toHaveBeenCalled();
      expect(storageContract.updateVideoStatus).not.toHaveBeenCalled();
      expect(emitStatusSpy).not.toHaveBeenCalled();
    });

    it('marks video FAILED with failureReason, marks video & thumbnail StorageObjects FAILED, and emits SSE failed', async () => {
      const video = makeVideo(VideoStatus.PROCESSING);
      videoRepo.findOne.mockResolvedValue(video);

      await handler.handle(
        new VideoProcessFailedEvent(
          video.videoId,
          'Corrupted video stream',
          'creator-1',
          video.videoFile,
          'INVALID_MEDIA',
        ),
      );

      expect(videoRepo.createQueryBuilder().set).toHaveBeenCalledWith({ videoStatus: VideoStatus.FAILED, failureReason: 'Corrupted video stream' });
      expect(videoRepo.save).not.toHaveBeenCalled();
      expect(storageContract.updateVideoStatus).toHaveBeenCalledWith(
        video.videoFile,
        'FAILED',
      );
      expect(storageContract.updateVideoStatus).toHaveBeenCalledWith(
        video.thumbnail,
        'FAILED',
      );
      expect(emitStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          videoId: video.videoId,
          status: VideoStatus.FAILED,
          event: 'failed',
          reason: 'Corrupted video stream',
          errorCode: 'INVALID_MEDIA',
        }),
      );
    });

    it('continues emitting SSE failed even when storage object update throws non-fatal NotFoundException', async () => {
      const video = makeVideo(VideoStatus.UPLOADED, '');
      videoRepo.findOne.mockResolvedValue(video);
      vi.mocked(storageContract.updateVideoStatus).mockRejectedValueOnce(
        new NotFoundException('Storage object missing'),
      );

      await handler.handle(
        new VideoProcessFailedEvent(video.videoId, 'FFprobe failed'),
      );

      expect(videoRepo.createQueryBuilder().execute).toHaveBeenCalled();
      expect(videoRepo.save).not.toHaveBeenCalled();
      expect(emitStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          videoId: video.videoId,
          status: VideoStatus.FAILED,
          reason: 'FFprobe failed',
        }),
      );
    });

    it('skips storage update and SSE when concurrent PROCESSED transition wins race (affected=0)', async () => {
      const video = makeVideo(VideoStatus.PROCESSING);
      videoRepo.findOne.mockResolvedValue(video);
      videoRepo.createQueryBuilder().execute.mockResolvedValueOnce({ affected: 0 });

      await handler.handle(new VideoProcessFailedEvent(video.videoId, 'Late failure'));

      expect(storageContract.updateVideoStatus).not.toHaveBeenCalled();
      expect(emitStatusSpy).not.toHaveBeenCalled();
    });
  });

  describe('VideoProcessFailedConsumer', () => {
    it('executes via INBOX_SERVICE.executeOnce with REDIS_STREAM metadata', async () => {
      const video = makeVideo(VideoStatus.PROCESSING, '');
      videoRepo.findOne.mockResolvedValue(video);
      const eventId = '22222222-2222-4222-8222-222222222222';

      await consumer.handleVideoProcessFailed({
        id: eventId,
        videoId: video.videoId,
        reason: 'Unsupported audio track',
        errorCode: 'PROBE_FAILED',
        occurredAt: '2026-11-27T09:00:00.000Z',
      });

      expect(inboxService.executeOnce).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId,
          consumer: 'VideoProcessFailedConsumer',
          eventType: VideoProcessFailedEvent.EVENT_NAME,
          transport: TransportType.REDIS_STREAM,
          source: VideoProcessFailedEvent.EVENT_NAME,
        }),
        expect.objectContaining({
          videoId: video.videoId,
          reason: 'Unsupported audio track',
          errorCode: 'PROBE_FAILED',
        }),
        handler,
      );
      expect(videoRepo.createQueryBuilder().execute).toHaveBeenCalled();
    });

    it('skips duplicate deliveries when INBOX_SERVICE.executeOnce returns false', async () => {
      vi.mocked(inboxService.executeOnce).mockResolvedValueOnce(false);

      await consumer.handleVideoProcessFailed({
        id: '33333333-3333-4333-8333-333333333333',
        videoId: '11111111-1111-4111-8111-111111111111',
        reason: 'Duplicate failure',
      });

      expect(videoRepo.findOne).not.toHaveBeenCalled();
      expect(emitStatusSpy).not.toHaveBeenCalled();
    });

    it('ignores message without videoId without calling inboxService', async () => {
      await consumer.handleVideoProcessFailed({
        reason: 'Missing videoId',
      });

      expect(inboxService.executeOnce).not.toHaveBeenCalled();
    });
  });
});
