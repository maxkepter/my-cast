import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  STORAGE_CONTRACT,
  StorageContract,
} from '../../../../core/storage';
import {
  QUEUE_SERVICE,
  QueueServiceContract,
} from '../../../../core/messaging';
import { Video } from '../../domain/entities/video.entity';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';
import { VideoUploadPolicy } from '../../domain/policies/video-upload.policy';
import { VideoConfig } from '../../domain/value-objects/video-config.vo';
import {
  CompleteVideoUploadReq,
  InitiateVideoUploadReq,
} from '../../dtos/req.dto';
import {
  CompleteVideoUploadRes,
  InitiateVideoUploadRes,
} from '../../dtos/res.dto';
import { CompleteVideoUploadUseCase } from '../usecases/complete-video-upload.usecase';
import { UploadVideoUseCase } from '../usecases/upload-video.usecase';
import {
  VideoStatusSnapshot,
  VideoStatusStreamService,
} from './video-status-stream.service';

type StorageStatusParam = Parameters<StorageContract['updateVideoStatus']>[1];
const STORAGE_STATUS_READY = 'READY' as StorageStatusParam;
const PRESIGNED_UPLOAD_EXPIRES_IN = 3600;

@Injectable()
export class VideoUploadService
  implements UploadVideoUseCase, CompleteVideoUploadUseCase
{
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @Inject(STORAGE_CONTRACT)
    private readonly storageContract: StorageContract,
    @Inject(QUEUE_SERVICE)
    private readonly queueService: QueueServiceContract,
    private readonly dataSource: DataSource,
    private readonly videoUploadPolicy: VideoUploadPolicy,
    private readonly videoStatusStreamService: VideoStatusStreamService,
  ) {}

  execute(
    authorId: string,
    req: InitiateVideoUploadReq,
  ): Promise<InitiateVideoUploadRes>;
  execute(
    authorId: string,
    req: CompleteVideoUploadReq,
  ): Promise<CompleteVideoUploadRes>;
  async execute(
    authorId: string,
    req: InitiateVideoUploadReq | CompleteVideoUploadReq,
  ): Promise<InitiateVideoUploadRes | CompleteVideoUploadRes> {
    if ('fileName' in req) {
      return this.initiateUpload(authorId, req);
    }
    return this.completeUpload(authorId, req);
  }

  async initiateUpload(
    authorId: string,
    req: InitiateVideoUploadReq,
  ): Promise<InitiateVideoUploadRes> {
    this.videoUploadPolicy.validateInitiateRequest(req);

    const videoId = randomUUID();
    const storageKey = `videos/${videoId}`;
    const videoExt = this.videoUploadPolicy.extractExtension(req.fileName);
    const videoKey = `${storageKey}/video${videoExt}`;

    const hasThumbnail = Boolean(
      req.thumbnailFileName ||
        req.thumbnailContentType ||
        req.thumbnailSize !== undefined,
    );
    const thumbnailExt = hasThumbnail
      ? this.videoUploadPolicy.resolveThumbnailExtension(
          req.thumbnailFileName,
          req.thumbnailContentType,
        )
      : '';
    const thumbnailKey = hasThumbnail
      ? `${storageKey}/thumbnail${thumbnailExt}`
      : undefined;

    const videoPresign = await this.storageContract.getPresignedUploadUrl(
      videoKey,
      {
        expiresIn: PRESIGNED_UPLOAD_EXPIRES_IN,
        contentType: req.contentType,
        originalName: req.fileName,
        contentLength: req.fileSize,
      },
    );

    const thumbnailPresign = thumbnailKey
      ? await this.storageContract.getPresignedUploadUrl(thumbnailKey, {
          expiresIn: PRESIGNED_UPLOAD_EXPIRES_IN,
          contentType: req.thumbnailContentType,
          originalName: req.thumbnailFileName,
          contentLength: req.thumbnailSize,
        })
      : undefined;

    const scheduledAt =
      req.videoConfig.visibility === VideoVisibility.SCHEDULED &&
      req.videoConfig.scheduleAt
        ? new Date(req.videoConfig.scheduleAt)
        : undefined;

    const video = Video.create(
      videoId,
      authorId,
      req.description?.trim() ?? '',
      req.title.trim(),
      thumbnailKey ?? '',
      videoKey,
      0,
      VideoConfig.create(
        req.videoConfig.visibility,
        req.videoConfig.allowComments,
        scheduledAt,
      ),
      0,
      0,
      VideoStatus.UPLOADING,
    );

    const saved = await this.videoRepo.save(video);

    return InitiateVideoUploadRes.of({
      videoId: saved.videoId,
      storageKey,
      videoKey,
      uploadUrl: videoPresign.url,
      status: saved.videoStatus,
      thumbnailKey,
      thumbnailUploadUrl: thumbnailPresign?.url,
      expiresInSeconds: PRESIGNED_UPLOAD_EXPIRES_IN,
    });
  }

  async completeUpload(
    userId: string,
    req: CompleteVideoUploadReq,
  ): Promise<CompleteVideoUploadRes> {
    const video = await this.videoRepo.findOne({
      where: { videoId: req.videoId },
    });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.authorId !== userId) {
      throw new ForbiddenException('You are not the owner of this video');
    }

    const storageKey = this.extractStorageFolder(video);

    if (video.videoStatus === VideoStatus.FAILED) {
      throw new ConflictException(
        video.failureReason || 'Video processing has failed',
      );
    }

    if (
      video.videoStatus === VideoStatus.UPLOADED ||
      video.videoStatus === VideoStatus.PROCESSING ||
      video.videoStatus === VideoStatus.PROCESSED
    ) {
      return CompleteVideoUploadRes.of({
        videoId: video.videoId,
        status: video.videoStatus,
        storageKey,
        message: 'Video upload already completed',
      });
    }

    const storageResult = await this.storageContract.updateVideoStatus(
      video.videoFile,
      STORAGE_STATUS_READY,
    );

    await this.dataSource.transaction(async (em) => {
      video.markUploaded();
      await em.getRepository(Video).save(video);

      await this.queueService.publish(
        new VideoUploadedEvent(
          video.videoId,
          video.authorId,
          video.videoFile,
          true,
          video.thumbnail || null,
          storageResult.nodeId,
        ),
        undefined,
        em,
      );
    });

    this.videoStatusStreamService.emitStatus({
      videoId: video.videoId,
      status: VideoStatus.UPLOADED,
      event: 'status',
      message: 'Video uploaded and queued for processing',
      updatedAt: new Date().toISOString(),
    });

    return CompleteVideoUploadRes.of({
      videoId: video.videoId,
      status: video.videoStatus,
      storageKey,
      etag: storageResult.etag,
      message: 'Video upload completed',
    });
  }

  async getUploadStatusSnapshot(
    userId: string,
    videoId: string,
  ): Promise<VideoStatusSnapshot> {
    const video = await this.videoRepo.findOne({ where: { videoId } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.authorId !== userId) {
      throw new ForbiddenException('You are not the owner of this video');
    }

    return {
      videoId: video.videoId,
      status: video.videoStatus,
      reason: video.failureReason ?? null,
      updatedAt: video.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  private extractStorageFolder(video: Video): string {
    if (!video.videoFile) {
      return `videos/${video.videoId}`;
    }
    const lastSlash = video.videoFile.lastIndexOf('/');
    return lastSlash > 0
      ? video.videoFile.slice(0, lastSlash)
      : `videos/${video.videoId}`;
  }
}
