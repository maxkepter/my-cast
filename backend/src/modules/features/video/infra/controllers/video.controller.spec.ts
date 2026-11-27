import {
  ForbiddenException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  ValidationPipe,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { MAX_VIDEO_SIZE_BYTES } from '../../domain/policies/video-upload.policy';
import { InitiateVideoUploadReq } from '../../dtos/req.dto';
import { VideoService } from '../../application/services/video.service';
import { VideoStatusStreamService } from '../../application/services/video-status-stream.service';
import { VideoUploadService } from '../../application/services/video-upload.service';
import { VideoController } from './video.controller';

describe('VideoController (Upload, CompleteUpload, SSE)', () => {
  let controller: VideoController;
  let videoService: VideoService;
  let videoUploadService: {
    initiateUpload: ReturnType<typeof vi.fn>;
    completeUpload: ReturnType<typeof vi.fn>;
    getUploadStatusSnapshot: ReturnType<typeof vi.fn>;
  };
  let streamService: VideoStatusStreamService;

  beforeEach(() => {
    videoService = {
      updateVideo: vi.fn(),
      deleteVideo: vi.fn(),
    } as unknown as VideoService;

    videoUploadService = {
      initiateUpload: vi.fn(),
      completeUpload: vi.fn(),
      getUploadStatusSnapshot: vi.fn(),
    };

    streamService = new VideoStatusStreamService();

    controller = new VideoController(
      videoService,
      videoUploadService as unknown as VideoUploadService,
      streamService,
    );
  });

  describe('DTO ValidationPipe compatibility', () => {
    it('allows oversized fileSize and unsupported contentType past ValidationPipe so policy returns 413/415', async () => {
      const pipe = new ValidationPipe({ whitelist: true, transform: true });
      const payload = {
        title: 'Large AVI',
        fileName: 'clip.exe',
        contentType: 'application/octet-stream',
        fileSize: MAX_VIDEO_SIZE_BYTES + 500,
        videoConfig: {
          visibility: VideoVisibility.PUBLIC,
          allowComments: true,
        },
      };

      const transformed = (await pipe.transform(payload, {
        type: 'body',
        metatype: InitiateVideoUploadReq,
      })) as InitiateVideoUploadReq;

      expect(transformed.fileSize).toBe(MAX_VIDEO_SIZE_BYTES + 500);
      expect(transformed.contentType).toBe('application/octet-stream');
    });
  });

  describe('POST /videos/upload', () => {
    it('returns 201 presigned upload response for valid request', async () => {
      const expected = {
        videoId: 'vid-1',
        storageKey: 'videos/vid-1',
        videoKey: 'videos/vid-1/video.mp4',
        uploadUrl: 'https://s3.local/presigned',
        status: VideoStatus.UPLOADING,
      };
      videoUploadService.initiateUpload.mockResolvedValue(expected);

      const res = await controller.initiateUpload('creator-1', {
        title: 'Demo',
        fileName: 'demo.mp4',
        contentType: 'video/mp4',
        fileSize: 1024,
        videoConfig: {
          visibility: VideoVisibility.PUBLIC,
          allowComments: true,
        },
      });

      expect(res).toEqual(expected);
      expect(videoUploadService.initiateUpload).toHaveBeenCalledWith(
        'creator-1',
        expect.objectContaining({ title: 'Demo' }),
      );
    });

    it('propagates 413 PayloadTooLargeException and 415 UnsupportedMediaTypeException', async () => {
      videoUploadService.initiateUpload.mockRejectedValueOnce(
        new PayloadTooLargeException('Too big'),
      );
      await expect(
        controller.initiateUpload('creator-1', {} as InitiateVideoUploadReq),
      ).rejects.toThrow(PayloadTooLargeException);

      videoUploadService.initiateUpload.mockRejectedValueOnce(
        new UnsupportedMediaTypeException('Unsupported'),
      );
      await expect(
        controller.initiateUpload('creator-1', {} as InitiateVideoUploadReq),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });
  });

  describe('POST /videos/completeUpload', () => {
    it('returns 200 CompleteVideoUploadRes and propagates 403 ForbiddenException', async () => {
      const expected = {
        videoId: '11111111-1111-4111-8111-111111111111',
        status: VideoStatus.UPLOADED,
        storageKey: 'videos/11111111-1111-4111-8111-111111111111',
      };
      videoUploadService.completeUpload.mockResolvedValueOnce(expected);

      const res = await controller.completeUpload('creator-1', {
        videoId: expected.videoId,
      });
      expect(res).toEqual(expected);

      videoUploadService.completeUpload.mockRejectedValueOnce(
        new ForbiddenException('Not owner'),
      );
      await expect(
        controller.completeUpload('other-user', { videoId: expected.videoId }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('SSE :videoId/status/events', () => {
    it('emits initial snapshot, live FAILED event, and auto-completes stream', async () => {
      videoUploadService.getUploadStatusSnapshot.mockResolvedValue({
        videoId: 'vid-1',
        status: VideoStatus.UPLOADED,
        reason: null,
        updatedAt: '2026-11-27T09:00:00.000Z',
      });

      const obs = await controller.streamVideoStatus('creator-1', 'vid-1');
      const collectedPromise = firstValueFrom(obs.pipe(take(2), toArray()));

      streamService.emitStatus({
        videoId: 'vid-1',
        status: VideoStatus.FAILED,
        reason: 'Codec error',
        message: 'Codec error',
      });

      const events = await collectedPromise;
      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        type: 'status',
        data: expect.objectContaining({
          videoId: 'vid-1',
          status: VideoStatus.UPLOADED,
        }),
      });
      expect(events[1]).toMatchObject({
        type: 'failed',
        data: expect.objectContaining({
          videoId: 'vid-1',
          status: VideoStatus.FAILED,
          reason: 'Codec error',
        }),
      });
    });

    it('emits terminal failed snapshot immediately and completes for late subscriber', async () => {
      videoUploadService.getUploadStatusSnapshot.mockResolvedValue({
        videoId: 'vid-2',
        status: VideoStatus.FAILED,
        reason: 'Probe failed earlier',
        updatedAt: '2026-11-27T09:05:00.000Z',
      });

      const obs = await controller.streamVideoStatus('creator-1', 'vid-2');
      const events = await firstValueFrom(obs.pipe(toArray()));

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: 'failed',
        data: expect.objectContaining({
          videoId: 'vid-2',
          status: VideoStatus.FAILED,
          reason: 'Probe failed earlier',
        }),
      });
    });

    it('rejects non-owner before opening SSE stream', async () => {
      videoUploadService.getUploadStatusSnapshot.mockRejectedValue(
        new ForbiddenException('You are not the owner of this video'),
      );

      await expect(
        controller.streamVideoStatus('intruder', 'vid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
