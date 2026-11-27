import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  INBOX_SERVICE,
  type InboxServiceContract,
  TransportType,
} from '../../../messaging';
import { VideoProcessService } from '../../application/services/video-process.service';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import { VideoUploadedMessageDto } from '../../dtos/video-uploaded-message.dto';
import {
  VIDEO_EVENTS_EXCHANGE,
  VIDEO_TRANSCODE_QUEUE,
  VIDEO_TRANSCODE_QUEUE_ARGUMENTS,
} from '../messaging/video-process.topology';

@Injectable()
export class VideoUploadConsumer {
  private readonly logger = new Logger(VideoUploadConsumer.name);

  constructor(
    @Inject(INBOX_SERVICE) private readonly inbox: InboxServiceContract,
    private readonly videoProcessService: VideoProcessService,
  ) {}

  @RabbitSubscribe({
    exchange: VIDEO_EVENTS_EXCHANGE,
    routingKey: VideoUploadedEvent.EVENT_NAME,
    queue: VIDEO_TRANSCODE_QUEUE,
    queueOptions: { durable: true, arguments: VIDEO_TRANSCODE_QUEUE_ARGUMENTS },
  })
  async handleVideoUpload(raw: unknown): Promise<Nack | void> {
    try {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        this.logger.warn('Invalid video upload message');
        return new Nack(false);
      }
      const dto = plainToInstance(VideoUploadedMessageDto, raw);
      if ((await validate(dto, { whitelist: true })).length > 0) {
        this.logger.warn('Invalid video upload message');
        return new Nack(false);
      }
      const event = VideoUploadedEvent.deserialize(
        raw as Record<string, unknown>,
      );
      const processed = await this.inbox.executeOnce(
        {
          eventId: dto.id,
          consumer: 'video-transcoder.VideoUploadConsumer',
          eventType: VideoUploadedEvent.EVENT_NAME,
          payload: JSON.stringify(raw),
          transport: TransportType.RABBITMQ,
          source: VIDEO_EVENTS_EXCHANGE,
        },
        event,
        this.videoProcessService,
      );
      if (!processed) this.logger.log('Duplicate video upload message skipped');
    } catch {
      this.logger.error('Failed to process video upload message');
      return new Nack(false);
    }
  }
}
