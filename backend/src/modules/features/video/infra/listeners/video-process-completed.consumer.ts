import { Inject, Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  INBOX_SERVICE,
  InboxServiceContract,
  RedisStreamConsume,
  RedisStreamHandle,
  TransportType,
} from '../../../../core/messaging';
import { VideoProcessCompletedHandler } from '../../application/handlers/video-process-completed.handler';
import { VideoProcessCompletedEvent } from '../../domain/events/video-process-completed.event';
import { VideoProcessCompletedMessageDto } from '../../dtos/video-process-completed-message.dto';

@Injectable()
@RedisStreamConsume({
  stream: VideoProcessCompletedEvent.EVENT_NAME,
  group: 'video-service-group',
  consumerName: 'video-process-completed-consumer',
})
export class VideoProcessCompletedConsumer {
  private readonly logger = new Logger(VideoProcessCompletedConsumer.name);

  constructor(
    private readonly videoProcessCompletedHandler: VideoProcessCompletedHandler,
    @Inject(INBOX_SERVICE)
    private readonly inboxService: InboxServiceContract,
  ) {}

  @RedisStreamHandle(VideoProcessCompletedEvent.EVENT_NAME)
  async handleVideoProcessCompleted(rawPayload: Record<string, unknown>): Promise<void> {
    if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
      throw new Error(`Malformed ${VideoProcessCompletedEvent.EVENT_NAME} payload: expected object`);
    }

    const dto = plainToInstance(VideoProcessCompletedMessageDto, rawPayload);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      const fields = errors.map((err) => err.property).join(', ');
      throw new Error(`Malformed ${VideoProcessCompletedEvent.EVENT_NAME} payload: invalid [${fields}]`);
    }

    const event = Object.assign(
      Object.create(VideoProcessCompletedEvent.prototype) as VideoProcessCompletedEvent,
      {
        id: dto.id,
        occuredOn: new Date(dto.occuredOn),
        videoId: dto.videoId,
        authorId: dto.authorId,
        videoKey: dto.videoKey,
        masterPlaylistKey: dto.masterPlaylistKey,
        thumbnailKey: dto.thumbnailKey,
        storyboardVttKey: dto.storyboardVttKey,
        storyboardSpriteKeys: [...dto.storyboardSpriteKeys],
        previewKey: dto.previewKey,
        renditions: [...dto.renditions],
        duration: dto.duration,
        width: dto.width,
        height: dto.height,
      },
    );

    const executed = await this.inboxService.executeOnce(
      {
        eventId: dto.id,
        consumer: 'VideoProcessCompletedConsumer',
        eventType: VideoProcessCompletedEvent.EVENT_NAME,
        payload: JSON.stringify(rawPayload),
        transport: TransportType.REDIS_STREAM,
        source: VideoProcessCompletedEvent.EVENT_NAME,
      },
      event,
      this.videoProcessCompletedHandler,
    );

    if (!executed) {
      this.logger.debug(`Skipped duplicate ${VideoProcessCompletedEvent.EVENT_NAME} eventId=${dto.id}`);
    }
  }
}
