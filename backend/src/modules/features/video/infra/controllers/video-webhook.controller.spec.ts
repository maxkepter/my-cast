import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideoWebhookController } from './video-webhook.controller';
import { VideoStatus } from '../../domain/enums/video-status.enum';

describe('VideoWebhookController', () => {
  let controller: VideoWebhookController;
  let mockVideoRepo: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockVideoRepo = {
      findOne: vi.fn(),
      save: vi.fn().mockImplementation((v) => Promise.resolve(v)),
    };
    mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    controller = new VideoWebhookController(mockVideoRepo, mockEventBus);
  });

  // 1. Direct Payload Success (với nodeId)
  it('1. Direct Payload Success (with nodeId): processes upload and publishes event with nodeId', async () => {
    const video = {
      videoId: 'vid-101',
      authorId: 'user-001',
      videoFile: 'raw/videos/user-1/vid-101.mp4',
      videoStatus: VideoStatus.UPLOADING,
      thumbnail: 'thumb.jpg',
    };
    mockVideoRepo.findOne.mockResolvedValue(video);

    const payload = {
      Records: [
        {
          eventName: 's3:ObjectCreated:Put',
          s3: {
            bucket: { name: 'mycast-raw-videos' },
            object: { key: 'raw/videos/user-1/vid-101.mp4' },
          },
        },
      ],
    };

    const res = await controller.handleS3EventNotification('node-sg-01', payload);

    expect(res).toEqual({ processed: 1, ignored: 0 });
    expect(video.videoStatus).toBe(VideoStatus.UPLOADED);
    expect(mockVideoRepo.save).toHaveBeenCalledWith(video);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'vid-101',
        authorId: 'user-001',
        videoKey: 'raw/videos/user-1/vid-101.mp4',
        isSuccess: true,
        thumbnailKey: 'thumb.jpg',
        nodeId: 'node-sg-01',
      }),
    );
  });

  // 2. AWS SNS Wrapper Success (JSON Message)
  it('2. AWS SNS Wrapper Success: unescapes stringified Message and processes records', async () => {
    const video = {
      videoId: 'vid-102',
      authorId: 'user-002',
      videoFile: 'raw/videos/test.mp4',
      videoStatus: VideoStatus.UPLOADING,
      thumbnail: null,
    };
    mockVideoRepo.findOne.mockResolvedValue(video);

    const innerPayload = {
      Records: [
        {
          eventName: 's3:ObjectCreated:CompleteMultipartUpload',
          s3: {
            bucket: { name: 'mycast-raw-videos' },
            object: { key: 'raw/videos/test.mp4' },
          },
        },
      ],
    };

    const snsPayload = {
      Type: 'Notification',
      MessageId: 'sns-msg-001',
      TopicArn: 'arn:aws:sns:ap-southeast-1:123456789012:s3-upload-topic',
      Message: JSON.stringify(innerPayload),
    };

    const res = await controller.handleS3EventNotification('node-us-01', snsPayload);

    expect(res).toEqual({ processed: 1, ignored: 0 });
    expect(video.videoStatus).toBe(VideoStatus.UPLOADED);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'vid-102',
        nodeId: 'node-us-01',
      }),
    );
  });

  // 3. AWS SNS SubscriptionConfirmation
  it('3. AWS SNS SubscriptionConfirmation: confirms subscription without processing records', async () => {
    const payload = {
      Type: 'SubscriptionConfirmation',
      TopicArn: 'arn:aws:sns:ap-southeast-1:123456789012:s3-upload-topic',
      SubscribeURL:
        'https://sns.ap-southeast-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=...',
    };

    const res = await controller.handleS3EventNotification('node-sg-01', payload);

    expect(res).toEqual({
      processed: 0,
      ignored: 0,
      status: 'SubscriptionConfirmed',
    });
    expect(mockVideoRepo.findOne).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  // 4. SNS Malformed JSON (syntax error handling)
  it('4. SNS Malformed JSON: gracefully handles invalid JSON in Message without crashing', async () => {
    const payload = {
      Type: 'Notification',
      Message: 'invalid-json-string{',
    };

    const res = await controller.handleS3EventNotification(undefined, payload);

    expect(res).toEqual({ processed: 0, ignored: 0 });
    expect(mockVideoRepo.findOne).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  // 5. Transcoder Artifacts Filter
  it('5. Transcoder Artifacts Filter: ignores hls, chunks, previews, thumbnails, and manifest files', async () => {
    const payload = {
      Records: [
        {
          eventName: 's3:ObjectCreated:Put',
          s3: { object: { key: 'transcoded/hls/vid-101/master.m3u8' } },
        },
        {
          eventName: 's3:ObjectCreated:Put',
          s3: { object: { key: 'chunks/vid-101/chunk_0.ts' } },
        },
        {
          eventName: 's3:ObjectCreated:Put',
          s3: { object: { key: 'previews/vid-101/storyboard/sheet.mpd' } },
        },
      ],
    };

    const res = await controller.handleS3EventNotification(undefined, payload);

    expect(res).toEqual({ processed: 0, ignored: 3 });
    expect(mockVideoRepo.findOne).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  // 6. Non-Video Extension Filter
  it('6. Non-Video Extension Filter: ignores non-whitelisted file extensions', async () => {
    const payload = {
      Records: [
        {
          eventName: 's3:ObjectCreated:Put',
          s3: { object: { key: 'uploads/document.pdf' } },
        },
        {
          eventName: 's3:ObjectCreated:Put',
          s3: { object: { key: 'uploads/archive.zip' } },
        },
        {
          eventName: 's3:ObjectCreated:Put',
          s3: { object: { key: 'uploads/cover.png' } },
        },
      ],
    };

    const res = await controller.handleS3EventNotification(undefined, payload);

    expect(res).toEqual({ processed: 0, ignored: 3 });
    expect(mockVideoRepo.findOne).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  // 7. Non-ObjectCreated Event Filter
  it('7. Non-ObjectCreated Event Filter: ignores events other than s3:ObjectCreated:*', async () => {
    const payload = {
      Records: [
        {
          eventName: 's3:ObjectRemoved:Delete',
          s3: { object: { key: 'raw/videos/test.mp4' } },
        },
      ],
    };

    const res = await controller.handleS3EventNotification(undefined, payload);

    expect(res).toEqual({ processed: 0, ignored: 1 });
    expect(mockVideoRepo.findOne).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  // 8. Missing Key in Record
  it('8. Missing Key in Record: ignores records missing object key', async () => {
    const payload = {
      Records: [
        {
          eventName: 's3:ObjectCreated:Put',
          s3: {},
        },
      ],
    };

    const res = await controller.handleS3EventNotification(undefined, payload);

    expect(res).toEqual({ processed: 0, ignored: 1 });
    expect(mockVideoRepo.findOne).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  // 9. No Pending Video in DB
  it('9. No Pending Video in DB: ignores record when no matching video is found', async () => {
    mockVideoRepo.findOne.mockResolvedValue(null);

    const payload = {
      Records: [
        {
          eventName: 's3:ObjectCreated:Put',
          s3: { object: { key: 'raw/videos/notfound.mp4' } },
        },
      ],
    };

    const res = await controller.handleS3EventNotification(undefined, payload);

    expect(res).toEqual({ processed: 0, ignored: 1 });
    expect(mockVideoRepo.findOne).toHaveBeenCalled();
    expect(mockVideoRepo.save).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  // 10. URL Encoded Key Handling
  it('10. URL Encoded Key Handling: properly decodes plus signs and percent encodings', async () => {
    const rawKey = 'raw/videos/test+video%20name.mp4';
    const decodedKey = 'raw/videos/test video name.mp4';

    const video = {
      videoId: 'vid-103',
      authorId: 'user-003',
      videoFile: decodedKey,
      videoStatus: VideoStatus.UPLOADING,
      thumbnail: null,
    };
    mockVideoRepo.findOne.mockResolvedValue(video);

    const payload = {
      Records: [
        {
          eventName: 's3:ObjectCreated:Put',
          s3: { object: { key: rawKey } },
        },
      ],
    };

    const res = await controller.handleS3EventNotification(undefined, payload);

    expect(res).toEqual({ processed: 1, ignored: 0 });
    expect(mockVideoRepo.findOne).toHaveBeenCalledWith({
      where: [
        { videoFile: decodedKey, videoStatus: VideoStatus.UPLOADING },
        { videoFile: rawKey, videoStatus: VideoStatus.UPLOADING },
      ],
    });
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: 'vid-103',
        videoKey: decodedKey,
      }),
    );
  });
});
