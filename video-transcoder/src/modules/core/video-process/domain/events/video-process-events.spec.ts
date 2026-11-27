import { describe, expect, it } from 'vitest';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import { VideoProcessErrorCode } from '../enums/video-process-error-code.enum';
import { VideoProcessException } from '../exceptions/video-process.exception';
import { VideoProcessCompletedEvent } from './video-process-completed.event';
import { VideoProcessFailedEvent } from './video-process-failed.event';
import { VideoUploadedEvent } from './video-uploaded.event';

describe('VideoProcess Domain Events', () => {
  describe('VideoUploadedEvent (C1)', () => {
    const c1Fixture = {
      id: '6f1c1e9a-2b7d-4c55-9f31-0b8f3c7a1d20',
      occuredOn: '2026-11-27T09:00:00.000Z',
      videoId: 'c0a8012e-0000-4000-8000-000000000001',
      authorId: 'c0a8012e-0000-4000-8000-0000000000aa',
      videoKey: 'videos/c0a8012e-0000-4000-8000-000000000001/source.mp4',
      isSuccess: true,
      thumbnailKey: null as string | null,
      nodeId: 'node-1',
    };

    it('exposes EVENT_NAME "video.upload" and serializes matching C1 field names', () => {
      const event = new VideoUploadedEvent(
        c1Fixture.videoId,
        c1Fixture.authorId,
        c1Fixture.videoKey,
        true,
        null,
        'node-1',
      );

      expect(VideoUploadedEvent.EVENT_NAME).toBe('video.upload');
      expect(event.getEventName()).toBe('video.upload');
      expect(event).toBeInstanceOf(DomainEvent);

      const serialized = JSON.parse(event.serialize()) as Record<
        string,
        unknown
      >;
      expect(serialized).toEqual({
        id: event.id,
        occuredOn: event.occuredOn.toISOString(),
        videoId: c1Fixture.videoId,
        authorId: c1Fixture.authorId,
        videoKey: c1Fixture.videoKey,
        isSuccess: true,
        thumbnailKey: null,
        nodeId: 'node-1',
      });
      expect(serialized).not.toHaveProperty('hasThumbnail');
    });

    it('derives hasThumbnail from thumbnailKey cleanly', () => {
      expect(
        new VideoUploadedEvent('v1', 'a1', 'videos/v1/source.mp4', true, null)
          .hasThumbnail,
      ).toBe(false);
      expect(
        new VideoUploadedEvent(
          'v1',
          'a1',
          'videos/v1/source.mp4',
          true,
          undefined,
        ).hasThumbnail,
      ).toBe(false);
      expect(
        new VideoUploadedEvent('v1', 'a1', 'videos/v1/source.mp4', true, '')
          .hasThumbnail,
      ).toBe(false);
      expect(
        new VideoUploadedEvent('v1', 'a1', 'videos/v1/source.mp4', true, '   ')
          .hasThumbnail,
      ).toBe(false);
      expect(
        new VideoUploadedEvent(
          'v1',
          'a1',
          'videos/v1/source.mp4',
          true,
          'videos/v1/thumbnails/custom.jpg',
        ).hasThumbnail,
      ).toBe(true);
    });

    it('deserializes from plain object and JSON string preserving id and occuredOn', () => {
      const fromObj = VideoUploadedEvent.deserialize(c1Fixture);
      expect(fromObj).toBeInstanceOf(VideoUploadedEvent);
      expect(fromObj).toBeInstanceOf(DomainEvent);
      expect(fromObj.id).toBe(c1Fixture.id);
      expect(fromObj.occuredOn).toBeInstanceOf(Date);
      expect(fromObj.occuredOn.toISOString()).toBe(c1Fixture.occuredOn);
      expect(fromObj.videoId).toBe(c1Fixture.videoId);
      expect(fromObj.authorId).toBe(c1Fixture.authorId);
      expect(fromObj.videoKey).toBe(c1Fixture.videoKey);
      expect(fromObj.isSuccess).toBe(true);
      expect(fromObj.thumbnailKey).toBeNull();
      expect(fromObj.nodeId).toBe('node-1');
      expect(fromObj.hasThumbnail).toBe(false);
      expect(fromObj.getEventName()).toBe('video.upload');

      const withThumb = VideoUploadedEvent.deserialize(
        JSON.stringify({
          ...c1Fixture,
          thumbnailKey: 'videos/x/thumb.jpg',
        }),
      );
      expect(withThumb.id).toBe(c1Fixture.id);
      expect(withThumb.hasThumbnail).toBe(true);
      expect(withThumb.thumbnailKey).toBe('videos/x/thumb.jpg');
    });
  });

  describe('VideoProcessFailedEvent (C2)', () => {
    it('matches backend constructor order and C2 serialized JSON', () => {
      const event = new VideoProcessFailedEvent(
        'c0a8012e-0000-4000-8000-000000000001',
        'Invalid video duration or dimensions',
        'c0a8012e-0000-4000-8000-0000000000aa',
        'videos/c0a8012e-0000-4000-8000-000000000001/source.mp4',
        VideoProcessErrorCode.INVALID_MEDIA,
      );

      expect(VideoProcessFailedEvent.EVENT_NAME).toBe('video.process.failed');
      expect(event.getEventName()).toBe('video.process.failed');
      expect(event).toBeInstanceOf(DomainEvent);

      const serialized = JSON.parse(event.serialize()) as Record<
        string,
        unknown
      >;
      expect(serialized).toEqual({
        id: event.id,
        occuredOn: event.occuredOn.toISOString(),
        videoId: 'c0a8012e-0000-4000-8000-000000000001',
        reason: 'Invalid video duration or dimensions',
        authorId: 'c0a8012e-0000-4000-8000-0000000000aa',
        videoKey: 'videos/c0a8012e-0000-4000-8000-000000000001/source.mp4',
        errorCode: 'INVALID_MEDIA',
      });
    });

    it('allows optional trailing fields to be omitted', () => {
      const event = new VideoProcessFailedEvent('vid-1', 'Failed');
      const serialized = JSON.parse(event.serialize()) as Record<
        string,
        unknown
      >;

      expect(serialized).toEqual({
        id: event.id,
        occuredOn: event.occuredOn.toISOString(),
        videoId: 'vid-1',
        reason: 'Failed',
      });
    });
  });

  describe('VideoProcessCompletedEvent (C3)', () => {
    it('exposes EVENT_NAME "video.process.completed" and serializes flat C3 payload', () => {
      const props = {
        videoId: 'c0a8012e-0000-4000-8000-000000000001',
        authorId: 'c0a8012e-0000-4000-8000-0000000000aa',
        videoKey: 'videos/c0a8012e-0000-4000-8000-000000000001/source.mp4',
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
      };

      const event = new VideoProcessCompletedEvent(props);

      expect(VideoProcessCompletedEvent.EVENT_NAME).toBe(
        'video.process.completed',
      );
      expect(event.getEventName()).toBe('video.process.completed');
      expect(event).toBeInstanceOf(DomainEvent);

      const serialized = JSON.parse(event.serialize()) as Record<
        string,
        unknown
      >;
      expect(serialized).toEqual({
        id: event.id,
        occuredOn: event.occuredOn.toISOString(),
        ...props,
      });
    });
  });

  describe('VideoProcessException', () => {
    it('stores error code, name, message, and optional cause', () => {
      const rootCause = new Error('boom');
      const err = new VideoProcessException(
        'Download failed',
        VideoProcessErrorCode.DOWNLOAD_FAILED,
        rootCause,
      );

      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('VideoProcessException');
      expect(err.message).toBe('Download failed');
      expect(err.code).toBe(VideoProcessErrorCode.DOWNLOAD_FAILED);
      expect(err.cause).toBe(rootCause);

      const fallback = new VideoProcessException('Unknown failure');
      expect(fallback.code).toBe(VideoProcessErrorCode.UNKNOWN);
    });
  });
});
