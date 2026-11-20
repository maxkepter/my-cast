import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../../domain/entities/video.entity';
import { VideoConfig } from '../../domain/value-objects/video-config.vo';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { VideoUpdatedEvent } from '../../domain/events/video-updated.event';
import { VideoDeletedEvent } from '../../domain/events/video-deleted.event';
import { UpdateVideoReq } from '../../dtos/req.dto';
import { VideoConfigRes, VideoRes } from '../../dtos/res.dto';
import { UpdateVideoUseCase } from '../usecases/update-video.usecase';
import { DeleteVideoUseCase } from '../usecases/delete-video.usecase';
import {
  VideoBasicInfo,
  VideoQueryContract,
} from '../../contracts/video-query.contract';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../../core/event/application/internal-event-bus.interface';

@Injectable()
export class VideoService
  implements UpdateVideoUseCase, DeleteVideoUseCase, VideoQueryContract
{
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly eventBus: InternalEventBus,
  ) {}

  execute(authorId: string, videoId: string, req: UpdateVideoReq): Promise<VideoRes>;
  execute(authorId: string, videoId: string): Promise<void>;
  async execute(
    authorId: string,
    videoId: string,
    req?: UpdateVideoReq,
  ): Promise<VideoRes | void> {
    if (req) {
      return this.updateVideo(authorId, videoId, req);
    }
    return this.deleteVideo(authorId, videoId);
  }

  async updateVideo(
    authorId: string,
    videoId: string,
    req: UpdateVideoReq,
  ): Promise<VideoRes> {
    const video = await this.videoRepo.findOne({ where: { videoId } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.authorId !== authorId) {
      throw new ForbiddenException('You are not the owner of this video');
    }

    const currentVisibility = req.visibility ?? video.config?.visibility ?? VideoVisibility.PUBLIC;
    const currentScheduleAt = req.scheduleAt !== undefined ? req.scheduleAt : video.config?.scheduledAt;

    if (currentVisibility === VideoVisibility.SCHEDULED && !currentScheduleAt) {
      throw new BadRequestException(
        'scheduleAt is required when visibility is SCHEDULED',
      );
    }

    if (currentVisibility !== VideoVisibility.SCHEDULED && req.scheduleAt) {
      throw new BadRequestException(
        'scheduleAt is only allowed when visibility is SCHEDULED',
      );
    }

    if (req.title !== undefined) {
      video.title = req.title;
    }
    if (req.description !== undefined) {
      video.description = req.description;
    }

    const allowComments =
      req.allowComments !== undefined
        ? req.allowComments
        : (video.config?.allowComments ?? true);

    video.config = VideoConfig.create(
      currentVisibility,
      allowComments,
      currentScheduleAt,
    );

    const saved = await this.videoRepo.save(video);
    await this.eventBus.publish(new VideoUpdatedEvent(saved.videoId, authorId));

    return VideoRes.of(
      saved.videoId,
      saved.authorId,
      saved.description,
      saved.title,
      saved.thumbnail,
      saved.videoFile,
      saved.views,
      VideoConfigRes.of(
        saved.config.visibility,
        saved.config.allowComments,
        saved.config.scheduledAt,
      ),
      saved.likesCount,
      saved.sharesCount,
    );
  }

  async deleteVideo(authorId: string, videoId: string): Promise<void> {
    const video = await this.videoRepo.findOne({ where: { videoId } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (video.authorId !== authorId) {
      throw new ForbiddenException('You are not the owner of this video');
    }

    await this.videoRepo.remove(video);
    await this.eventBus.publish(new VideoDeletedEvent(videoId, authorId));
  }

  async getVideoBasicInfo(videoId: string): Promise<VideoBasicInfo | null> {
    const video = await this.videoRepo.findOne({ where: { videoId } });
    if (!video) {
      return null;
    }
    return {
      videoId: video.videoId,
      authorId: video.authorId,
      isCommentsAllowed: video.config?.allowComments ?? true,
      isActive: true,
    };
  }

  async isAuthorOfVideo(videoId: string, userId: string): Promise<boolean> {
    const video = await this.videoRepo.findOne({ where: { videoId } });
    if (!video) {
      return false;
    }
    return video.authorId === userId;
  }
}
