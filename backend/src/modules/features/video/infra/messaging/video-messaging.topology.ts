import {
  ExchangeType,
  ModuleTopology,
  TransportType,
} from '../../../../core/messaging';
import { PlaylistCreatedEvent } from '../../domain/events/playlist-created.event';
import { VideoAddedToPlaylistEvent } from '../../domain/events/video-added-to-playlist.event';
import { VideoDeletedEvent } from '../../domain/events/video-deleted.event';
import { VideoLikedEvent } from '../../domain/events/video-liked.event';
import { VideoSharedEvent } from '../../domain/events/video-shared.event';
import { VideoUnlikedEvent } from '../../domain/events/video-unliked.event';
import { VideoUpdatedEvent } from '../../domain/events/video-updated.event';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import { VideoProcessFailedEvent } from '../../domain/events/video-process-failed.event';

const REDIS_STREAM_VIDEO_EVENTS = [
  VideoUpdatedEvent.EVENT_NAME,
  VideoDeletedEvent.EVENT_NAME,
  VideoLikedEvent.EVENT_NAME,
  VideoUnlikedEvent.EVENT_NAME,
  VideoSharedEvent.EVENT_NAME,
  PlaylistCreatedEvent.EVENT_NAME,
  VideoAddedToPlaylistEvent.EVENT_NAME,
  VideoProcessFailedEvent.EVENT_NAME,
] as const;

export const VIDEO_MESSAGING_TOPOLOGY: ModuleTopology = {
  exchanges: [
    {
      name: 'video.events',
      type: ExchangeType.TOPIC,
      options: { durable: true },
    },
  ],
  queues: [
    {
      queueName: 'video.transcode.queue',
      options: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'video.transcode.dlx',
          'x-dead-letter-routing-key': 'video.transcode.dlq',
        },
      },
      queueBindings: [
        {
          exchange: 'video.events',
          routingKey: VideoUploadedEvent.EVENT_NAME,
        },
      ],
    },
  ],
  routes: [
    {
      transport: TransportType.RABBITMQ,
      destination: 'video.events',
      eventType: VideoUploadedEvent.EVENT_NAME,
    },
    ...REDIS_STREAM_VIDEO_EVENTS.map((eventType) => ({
      transport: TransportType.REDIS_STREAM,
      destination: eventType,
      eventType,
    })),
  ],
};
