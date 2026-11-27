import 'reflect-metadata';
import { Nack } from '@golevelup/nestjs-rabbitmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type InboxServiceContract, TransportType } from '../../../messaging';
import { VideoProcessService } from '../../application/services/video-process.service';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import { VideoUploadConsumer } from './video-upload.consumer';

const message = {
  id: '6f1c1e9a-2b7d-4c55-9f31-0b8f3c7a1d20',
  occuredOn: '2026-11-27T09:00:00.000Z',
  videoId: 'video-1',
  authorId: 'author-1',
  videoKey: 'videos/video-1/source.mp4',
  isSuccess: true,
  thumbnailKey: null,
  nodeId: 'node-1',
};

describe('VideoUploadConsumer', () => {
  let handle: ReturnType<typeof vi.fn>;
  let executeOnce: ReturnType<typeof vi.fn>;
  let service: VideoProcessService;
  let consumer: VideoUploadConsumer;
  beforeEach(() => {
    handle = vi.fn().mockResolvedValue(undefined);
    service = { handle } as unknown as VideoProcessService;
    executeOnce = vi.fn(async (_req, event, handler) => {
      await handler.handle(event);
      return true;
    });
    consumer = new VideoUploadConsumer(
      { executeOnce } as unknown as InboxServiceContract,
      service,
    );
  });

  it('executes valid event once with exact inbox request and acknowledges', async () => {
    expect(await consumer.handleVideoUpload(message)).toBeUndefined();
    expect(executeOnce).toHaveBeenCalledOnce();
    const [req, event, handler] = executeOnce.mock.calls[0];
    expect(req).toEqual({
      eventId: message.id,
      consumer: 'video-transcoder.VideoUploadConsumer',
      eventType: 'video.upload',
      payload: JSON.stringify(message),
      transport: TransportType.RABBITMQ,
      source: 'video.events',
    });
    expect(event).toBeInstanceOf(VideoUploadedEvent);
    expect(event).toMatchObject({
      ...message,
      occuredOn: new Date(message.occuredOn),
    });
    expect(handler).toBe(service);
    expect(handle).toHaveBeenCalledWith(event);
  });

  it('acknowledges duplicates without invoking handler', async () => {
    executeOnce.mockResolvedValueOnce(false);
    expect(await consumer.handleVideoUpload(message)).toBeUndefined();
    expect(handle).not.toHaveBeenCalled();
  });

  it('rejects failed handler without requeue', async () => {
    handle.mockRejectedValueOnce(new Error('failure'));
    const result = await consumer.handleVideoUpload(message);
    expect(result).toBeInstanceOf(Nack);
    expect(result).toMatchObject({ requeue: false });
  });

  it.each([
    null,
    [],
    {},
    { ...message, videoKey: '../secret' },
    { ...message, id: 'invalid' },
  ])('rejects invalid payload without inbox: %j', async (raw) => {
    const result = await consumer.handleVideoUpload(raw);
    expect(result).toBeInstanceOf(Nack);
    expect(result).toMatchObject({ requeue: false });
    expect(executeOnce).not.toHaveBeenCalled();
    expect(handle).not.toHaveBeenCalled();
  });
});
