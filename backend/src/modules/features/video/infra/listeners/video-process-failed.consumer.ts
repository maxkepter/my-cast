import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  INBOX_SERVICE,
  InboxServiceContract,
  RedisStreamConsume,
  RedisStreamHandle,
  TransportType,
} from '../../../../core/messaging';
import { VideoProcessFailedHandler } from '../../application/handlers/video-process-failed.handler';
import { VideoProcessFailedEvent } from '../../domain/events/video-process-failed.event';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
@RedisStreamConsume({
  stream: VideoProcessFailedEvent.EVENT_NAME,
  group: 'video-service-group',
  consumerName: 'video-process-failed-consumer',
})
export class VideoProcessFailedConsumer {
  private readonly logger = new Logger(VideoProcessFailedConsumer.name);

  constructor(
    private readonly videoProcessFailedHandler: VideoProcessFailedHandler,
    @Inject(INBOX_SERVICE)
    private readonly inboxService: InboxServiceContract,
  ) {}

  @RedisStreamHandle(VideoProcessFailedEvent.EVENT_NAME)
  async handleVideoProcessFailed(
    rawPayload: Record<string, unknown>,
  ): Promise<void> {
    if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
      this.logger.warn(
        `Ignored malformed ${VideoProcessFailedEvent.EVENT_NAME} payload`,
      );
      return;
    }

    const videoId =
      typeof rawPayload.videoId === 'string' ? rawPayload.videoId.trim() : '';
    if (!videoId) {
      this.logger.warn(
        `Ignored ${VideoProcessFailedEvent.EVENT_NAME} message without videoId`,
      );
      return;
    }

    const serializedPayload = JSON.stringify(rawPayload);
    const eventId = this.extractEventId(rawPayload, serializedPayload);
    const reason =
      typeof rawPayload.reason === 'string' && rawPayload.reason.trim().length > 0
        ? rawPayload.reason.trim()
        : 'Video processing failed';

    const event = Object.assign(
      Object.create(VideoProcessFailedEvent.prototype) as VideoProcessFailedEvent,
      rawPayload,
      {
        id: eventId,
        videoId,
        reason,
        occuredOn: rawPayload.occuredOn
          ? new Date(rawPayload.occuredOn as string | number | Date)
          : rawPayload.occurredAt
            ? new Date(rawPayload.occurredAt as string | number | Date)
            : new Date(),
      },
    );

    await this.inboxService.executeOnce(
      {
        eventId,
        consumer: 'VideoProcessFailedConsumer',
        eventType: VideoProcessFailedEvent.EVENT_NAME,
        payload: serializedPayload,
        transport: TransportType.REDIS_STREAM,
        source: VideoProcessFailedEvent.EVENT_NAME,
      },
      event,
      this.videoProcessFailedHandler,
    );
  }

  private extractEventId(
    raw: Record<string, unknown>,
    serializedPayload: string,
  ): string {
    if (typeof raw.id === 'string' && UUID_REGEX.test(raw.id.trim())) {
      return raw.id.trim();
    }
    const hex = createHash('sha256').update(serializedPayload).digest('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  }
}
