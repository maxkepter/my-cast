import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type InboxServiceContract, TransportType } from '../../../../core/messaging';
import { VideoProcessCompletedHandler } from '../../application/handlers/video-process-completed.handler';
import { VideoProcessCompletedEvent } from '../../domain/events/video-process-completed.event';
import { VideoProcessCompletedConsumer } from './video-process-completed.consumer';

const validPayload = {
  id: '22222222-2222-4222-8222-222222222222',
  occuredOn: '2026-11-27T09:00:00.000Z',
  videoId: '11111111-1111-4111-8111-111111111111',
  authorId: '33333333-3333-4333-8333-333333333333',
  videoKey: 'videos/11111111-1111-4111-8111-111111111111/source.mp4',
  masterPlaylistKey: 'videos/11111111-1111-4111-8111-111111111111/hls/master.m3u8',
  thumbnailKey: 'videos/11111111-1111-4111-8111-111111111111/thumbnails/thumbnail.jpg',
  storyboardVttKey: 'videos/11111111-1111-4111-8111-111111111111/storyboard/storyboard.vtt',
  storyboardSpriteKeys: ['videos/11111111-1111-4111-8111-111111111111/storyboard/sprite_000.jpg'],
  previewKey: 'videos/11111111-1111-4111-8111-111111111111/previews/preview.mp4',
  renditions: ['720p', '480p', '360p'],
  duration: 120.5,
  width: 1280,
  height: 720,
};

describe('VideoProcessCompletedConsumer', () => {
  let handler: { handle: ReturnType<typeof vi.fn> };
  let inbox: InboxServiceContract;
  let consumer: VideoProcessCompletedConsumer;

  beforeEach(() => {
    handler = { handle: vi.fn().mockResolvedValue(undefined) };
    inbox = {
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
    consumer = new VideoProcessCompletedConsumer(handler as unknown as VideoProcessCompletedHandler, inbox);
  });

  it('hydrates VideoProcessCompletedEvent and delegates to INBOX_SERVICE.executeOnce', async () => {
    await consumer.handleVideoProcessCompleted(validPayload);

    expect(inbox.executeOnce).toHaveBeenCalledWith(
      {
        eventId: validPayload.id,
        consumer: 'VideoProcessCompletedConsumer',
        eventType: VideoProcessCompletedEvent.EVENT_NAME,
        payload: JSON.stringify(validPayload),
        transport: TransportType.REDIS_STREAM,
        source: VideoProcessCompletedEvent.EVENT_NAME,
      },
      expect.any(VideoProcessCompletedEvent),
      handler,
    );
    const passedEvent = vi.mocked(inbox.executeOnce).mock.calls[0][1] as VideoProcessCompletedEvent;
    expect(passedEvent.id).toBe(validPayload.id);
    expect(passedEvent.occuredOn).toEqual(new Date(validPayload.occuredOn));
    expect(passedEvent.masterPlaylistKey).toBe(validPayload.masterPlaylistKey);
    expect(handler.handle).toHaveBeenCalledOnce();
  });

  it('skips handler on duplicate delivery when executeOnce returns false', async () => {
    vi.mocked(inbox.executeOnce).mockResolvedValueOnce(false);
    await consumer.handleVideoProcessCompleted(validPayload);
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('throws on malformed payload without calling inboxService so runner retries/DLQs', async () => {
    await expect(consumer.handleVideoProcessCompleted({ ...validPayload, videoId: 'bad-uuid' })).rejects.toThrow(/Malformed/);
    await expect(consumer.handleVideoProcessCompleted(null as unknown as Record<string, unknown>)).rejects.toThrow(/Malformed/);
    await expect(consumer.handleVideoProcessCompleted({ ...validPayload, extra: true })).rejects.toThrow(/Malformed/);
    expect(inbox.executeOnce).not.toHaveBeenCalled();
  });

  it('propagates handler/inbox errors so RedisStreamRunner does not ACK', async () => {
    vi.mocked(inbox.executeOnce).mockRejectedValueOnce(new Error('DB transient error'));
    await expect(consumer.handleVideoProcessCompleted(validPayload)).rejects.toThrow('DB transient error');
  });
});
