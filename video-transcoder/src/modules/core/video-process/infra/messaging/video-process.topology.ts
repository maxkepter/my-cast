import {
  ExchangeType,
  type ModuleTopology,
  TransportType,
} from '../../../messaging';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import { VideoProcessFailedEvent } from '../../domain/events/video-process-failed.event';
import { VideoProcessCompletedEvent } from '../../domain/events/video-process-completed.event';

export const VIDEO_EVENTS_EXCHANGE = 'video.events';
export const VIDEO_TRANSCODE_QUEUE = 'video.transcode.queue';
export const VIDEO_TRANSCODE_DLX = 'video.transcode.dlx';
export const VIDEO_TRANSCODE_DLQ = 'video.transcode.dlq';
export const VIDEO_TRANSCODE_QUEUE_ARGUMENTS = {
  'x-dead-letter-exchange': VIDEO_TRANSCODE_DLX,
  'x-dead-letter-routing-key': VIDEO_TRANSCODE_DLQ,
};

export const VIDEO_PROCESS_TOPOLOGY: ModuleTopology = {
  exchanges: [
    {
      name: VIDEO_EVENTS_EXCHANGE,
      type: ExchangeType.TOPIC,
      options: { durable: true },
    },
    {
      name: VIDEO_TRANSCODE_DLX,
      type: ExchangeType.DIRECT,
      options: { durable: true },
    },
  ],
  queues: [
    {
      queueName: VIDEO_TRANSCODE_QUEUE,
      options: { durable: true, arguments: VIDEO_TRANSCODE_QUEUE_ARGUMENTS },
      queueBindings: [
        {
          exchange: VIDEO_EVENTS_EXCHANGE,
          routingKey: VideoUploadedEvent.EVENT_NAME,
        },
      ],
    },
    {
      queueName: VIDEO_TRANSCODE_DLQ,
      options: { durable: true },
      queueBindings: [
        { exchange: VIDEO_TRANSCODE_DLX, routingKey: VIDEO_TRANSCODE_DLQ },
      ],
    },
  ],
  routes: [
    VideoProcessFailedEvent.EVENT_NAME,
    VideoProcessCompletedEvent.EVENT_NAME,
  ].map((eventType) => ({
    transport: TransportType.REDIS_STREAM,
    destination: eventType,
    eventType,
  })),
};
