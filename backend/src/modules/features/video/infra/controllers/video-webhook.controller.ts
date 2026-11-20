import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../../domain/entities/video.entity';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../../core/event/application/internal-event-bus.interface';

const RAW_VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.mkv',
  '.avi',
  '.webm',
  '.m4v',
]);

const TRANSCODER_ARTIFACT_PATTERNS = [
  '/transcoded/',
  '/hls/',
  '/chunks/',
  '/thumbnails/',
  '/previews/',
  '/storyboard/',
  '.m3u8',
  '.ts',
  '.mpd',
];

@Controller('videos/webhooks')
export class VideoWebhookController {
  private readonly logger = new Logger(VideoWebhookController.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly eventBus: InternalEventBus,
  ) {}

  @Post('s3')
  @HttpCode(HttpStatus.OK)
  async handleS3EventNotification(
    @Query('nodeId') nodeId?: string,
    @Body() payload?: Record<string, any>,
  ): Promise<{ processed: number; ignored: number; status?: string }> {
    let actualNodeId = nodeId;
    let actualPayload = payload;
    if (typeof nodeId === 'object' && nodeId !== null && payload === undefined) {
      actualPayload = nodeId as Record<string, any>;
      actualNodeId = undefined;
    }

    if (actualPayload?.Type === 'SubscriptionConfirmation') {
      this.logger.log(
        `SNS SubscriptionConfirmation received for topic ${actualPayload.TopicArn}. SubscribeURL: ${actualPayload.SubscribeURL}`,
      );
      return { processed: 0, ignored: 0, status: 'SubscriptionConfirmed' };
    }

    let records: any[] = [];

    if (
      actualPayload?.Type === 'Notification' &&
      typeof actualPayload?.Message === 'string'
    ) {
      try {
        const parsed = JSON.parse(actualPayload.Message);
        records = Array.isArray(parsed?.Records) ? parsed.Records : [];
      } catch (err) {
        this.logger.warn(
          `Failed to parse AWS SNS Message payload as JSON: ${err instanceof Error ? err.message : String(err)}`,
        );
        return { processed: 0, ignored: 0 };
      }
    } else if (Array.isArray(actualPayload?.Records)) {
      records = actualPayload.Records;
    }

    let processed = 0;
    let ignored = 0;

    for (const record of records) {
      const eventName = record?.eventName || '';
      if (!eventName || !eventName.startsWith('s3:ObjectCreated:')) {
        ignored++;
        continue;
      }

      const rawKey = record?.s3?.object?.key;
      if (!rawKey) {
        ignored++;
        continue;
      }

      const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));

      if (!this.isRawUserVideo(key)) {
        this.logger.debug(`Ignored non-user-video or transcoder artifact: ${key}`);
        ignored++;
        continue;
      }

      // ponytail: matching by videoFile or videoId in key path. Add metadata lookup if key format changes.
      const video = await this.videoRepo.findOne({
        where: [
          { videoFile: key, videoStatus: VideoStatus.UPLOADING },
          { videoFile: rawKey, videoStatus: VideoStatus.UPLOADING },
        ],
      });

      if (!video) {
        this.logger.debug(`No pending video matched key: ${key}`);
        ignored++;
        continue;
      }

      video.videoStatus = VideoStatus.UPLOADED;
      await this.videoRepo.save(video);

      await this.eventBus.publish(
        new VideoUploadedEvent(
          video.videoId,
          video.authorId,
          key,
          true,
          video.thumbnail || null,
          actualNodeId,
        ),
      );

      this.logger.log(
        `Published VideoUploadedEvent for videoId: ${video.videoId}${actualNodeId ? ` (nodeId: ${actualNodeId})` : ''}`,
      );
      processed++;
    }

    return { processed, ignored };
  }

  private isRawUserVideo(key: string): boolean {
    const lowerKey = key.toLowerCase();

    const isTranscoderOutput = TRANSCODER_ARTIFACT_PATTERNS.some((pattern) =>
      lowerKey.includes(pattern),
    );
    if (isTranscoderOutput) {
      return false;
    }

    const dotIndex = lowerKey.lastIndexOf('.');
    if (dotIndex === -1) {
      return false;
    }

    const ext = lowerKey.substring(dotIndex);
    return RAW_VIDEO_EXTENSIONS.has(ext);
  }
}
