import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Handler } from '../../../../../common/application/handler';
import {
  STORAGE_CONTRACT,
  StorageContract,
} from '../../../../core/storage';
import { Video } from '../../domain/entities/video.entity';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import { VideoProcessFailedEvent } from '../../domain/events/video-process-failed.event';
import { VideoStatusStreamService } from '../services/video-status-stream.service';

type StorageStatusParam = Parameters<StorageContract['updateVideoStatus']>[1];
const STORAGE_STATUS_FAILED = 'FAILED' as StorageStatusParam;

@Injectable()
export class VideoProcessFailedHandler
  implements Handler<VideoProcessFailedEvent>
{
  private readonly logger = new Logger(VideoProcessFailedHandler.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @Inject(STORAGE_CONTRACT)
    private readonly storageContract: StorageContract,
    private readonly videoStatusStreamService: VideoStatusStreamService,
  ) {}

  async handle(event: VideoProcessFailedEvent): Promise<void> {
    const video = await this.videoRepo.findOne({
      where: { videoId: event.videoId },
    });
    if (!video) {
      this.logger.warn(
        `Received ${VideoProcessFailedEvent.EVENT_NAME} for unknown videoId=${event.videoId}; skipping.`,
      );
      return;
    }

    if ((event.authorId && event.authorId !== video.authorId) || (event.videoKey && event.videoKey !== video.videoFile)) {
      this.logger.warn(`Rejected ${VideoProcessFailedEvent.EVENT_NAME} for videoId=${event.videoId}: authorId or videoKey mismatch.`);
      return;
    }

    if (video.videoStatus === VideoStatus.PROCESSED || video.videoStatus === VideoStatus.FAILED) {
      this.logger.warn(
        `Ignoring ${VideoProcessFailedEvent.EVENT_NAME} for already ${video.videoStatus} videoId=${event.videoId}.`,
      );
      return;
    }

    const reason = event.reason?.trim() || 'Video processing failed';
    const result = await this.videoRepo
      .createQueryBuilder()
      .update(Video)
      .set({
        videoStatus: VideoStatus.FAILED,
        failureReason: reason,
      })
      .where('"videoId" = :videoId', { videoId: event.videoId })
      .andWhere('"authorId" = :authorId', { authorId: video.authorId })
      .andWhere('"videoFile" = :videoKey', { videoKey: video.videoFile })
      .andWhere('"videoStatus" IN (:...allowedStatuses)', {
        allowedStatuses: [VideoStatus.UPLOADED, VideoStatus.PROCESSING],
      })
      .execute();

    if (!result.affected) {
      this.logger.warn(
        `Skipped ${VideoProcessFailedEvent.EVENT_NAME} for videoId=${event.videoId}: concurrent update transitioned state.`,
      );
      return;
    }

    if (video.videoFile) {
      await this.markStorageFailedGracefully(video.videoId, video.videoFile);
    }
    if (video.thumbnail) {
      await this.markStorageFailedGracefully(video.videoId, video.thumbnail);
    }

    this.videoStatusStreamService.emitStatus({
      videoId: video.videoId,
      status: VideoStatus.FAILED,
      event: 'failed',
      reason,
      message: reason,
      errorCode: event.errorCode ?? null,
      updatedAt: new Date().toISOString(),
    });
  }

  private async markStorageFailedGracefully(
    videoId: string,
    storageKey: string,
  ): Promise<void> {
    try {
      await this.storageContract.updateVideoStatus(
        storageKey,
        STORAGE_STATUS_FAILED,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Non-fatal error marking storage object "${storageKey}" as FAILED for videoId=${videoId}: ${msg}`,
      );
    }
  }
}
