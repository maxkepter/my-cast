import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Handler } from '../../../../../common/application/handler';
import { Video, VideoProcessingMetadata } from '../../domain/entities/video.entity';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import { VideoProcessCompletedEvent } from '../../domain/events/video-process-completed.event';
import { VideoStatusStreamService } from '../services/video-status-stream.service';

@Injectable()
export class VideoProcessCompletedHandler implements Handler<VideoProcessCompletedEvent> {
  private readonly logger = new Logger(VideoProcessCompletedHandler.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    private readonly videoStatusStreamService: VideoStatusStreamService,
  ) {}

  async handle(event: VideoProcessCompletedEvent): Promise<void> {
    const video = await this.videoRepo.findOne({ where: { videoId: event.videoId } });
    if (!video) {
      this.logger.warn(`Received ${VideoProcessCompletedEvent.EVENT_NAME} for unknown videoId=${event.videoId}; skipping.`);
      return;
    }

    if (video.authorId !== event.authorId || video.videoFile !== event.videoKey) {
      this.logger.warn(`Rejected ${VideoProcessCompletedEvent.EVENT_NAME} for videoId=${event.videoId}: authorId or videoKey mismatch.`);
      return;
    }

    if (video.videoStatus === VideoStatus.PROCESSED || video.videoStatus === VideoStatus.FAILED) {
      this.logger.warn(`Ignoring late ${VideoProcessCompletedEvent.EVENT_NAME} for terminal ${video.videoStatus} videoId=${event.videoId}.`);
      return;
    }

    if (video.videoStatus !== VideoStatus.UPLOADED && video.videoStatus !== VideoStatus.PROCESSING) {
      this.logger.warn(`Ignoring ${VideoProcessCompletedEvent.EVENT_NAME} for videoId=${event.videoId} in status=${video.videoStatus}.`);
      return;
    }

    const processingMetadata: VideoProcessingMetadata = {
      masterPlaylistKey: event.masterPlaylistKey,
      thumbnailKey: event.thumbnailKey,
      storyboardVttKey: event.storyboardVttKey,
      storyboardSpriteKeys: [...event.storyboardSpriteKeys],
      previewKey: event.previewKey,
      renditions: [...event.renditions],
      duration: event.duration,
      width: event.width,
      height: event.height,
      processedEventId: event.id,
    };

    const result = await this.videoRepo
      .createQueryBuilder()
      .update(Video)
      .set({
        videoStatus: VideoStatus.PROCESSED,
        failureReason: null,
        processingMetadata,
        thumbnail: () => `CASE WHEN TRIM(COALESCE("thumbnail", '')) = '' THEN :thumbnailKey ELSE "thumbnail" END`,
      })
      .setParameter('thumbnailKey', event.thumbnailKey)
      .where('"videoId" = :videoId', { videoId: event.videoId })
      .andWhere('"authorId" = :authorId', { authorId: event.authorId })
      .andWhere('"videoFile" = :videoKey', { videoKey: event.videoKey })
      .andWhere('"videoStatus" IN (:...allowedStatuses)', {
        allowedStatuses: [VideoStatus.UPLOADED, VideoStatus.PROCESSING],
      })
      .execute();

    if (!result.affected) {
      this.logger.warn(`Skipped SSE emit for videoId=${event.videoId}: concurrent update transitioned state.`);
      return;
    }

    this.videoStatusStreamService.emitStatus({
      videoId: event.videoId,
      status: VideoStatus.PROCESSED,
      event: 'completed',
      message: 'Video processing completed',
      updatedAt: new Date().toISOString(),
    });
  }
}
