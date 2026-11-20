import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '../../domain/entities/video.entity';
import { VideoReaction } from '../../domain/entities/video-reaction.entity';
import { VideoShare } from '../../domain/entities/video-share.entity';
import { VideoReactionType } from '../../domain/enums/video-reaction-type.enum';
import { SharePlatform } from '../../domain/enums/share-platform.enum';
import { VideoLikedEvent } from '../../domain/events/video-liked.event';
import { VideoUnlikedEvent } from '../../domain/events/video-unliked.event';
import { VideoSharedEvent } from '../../domain/events/video-shared.event';
import { ShareVideoReqDto, ToggleVideoLikeReqDto } from '../../dtos/req.dto';
import { ShareVideoResDto, VideoLikeResDto } from '../../dtos/res.dto';
import { ToggleVideoLikeUseCase } from '../usecases/toggle-video-like.usecase';
import { GetVideoReactionStatusUseCase } from '../usecases/get-video-reaction-status.usecase';
import { ShareVideoUseCase } from '../usecases/share-video.usecase';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../../core/event/application/internal-event-bus.interface';

@Injectable()
export class VideoInteractionService
  implements
    ToggleVideoLikeUseCase,
    GetVideoReactionStatusUseCase,
    ShareVideoUseCase
{
  constructor(
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @InjectRepository(VideoReaction)
    private readonly reactionRepo: Repository<VideoReaction>,
    @InjectRepository(VideoShare)
    private readonly shareRepo: Repository<VideoShare>,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly eventBus: InternalEventBus,
  ) {}

  execute(
    userId: string,
    req: ToggleVideoLikeReqDto,
  ): Promise<VideoLikeResDto>;
  execute(
    videoId: string,
    userId?: string | null,
  ): Promise<VideoLikeResDto>;
  execute(
    req: ShareVideoReqDto,
    userId?: string | null,
  ): Promise<ShareVideoResDto>;
  async execute(
    arg1: string | ShareVideoReqDto,
    arg2?: ToggleVideoLikeReqDto | string | null,
  ): Promise<VideoLikeResDto | ShareVideoResDto> {
    if (typeof arg1 === 'object' && arg1 !== null) {
      return this.shareVideo(arg1, (arg2 as string | null) ?? null);
    }

    if (typeof arg1 === 'string' && typeof arg2 === 'object' && arg2 !== null && 'videoId' in arg2) {
      return this.toggleLike(arg1, arg2);
    }

    return this.getReactionStatus(arg1, (arg2 as string | null) ?? null);
  }

  async toggleLike(
    userId: string,
    req: ToggleVideoLikeReqDto,
  ): Promise<VideoLikeResDto> {
    const video = await this.videoRepo.findOne({ where: { videoId: req.videoId } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const existingReaction = await this.reactionRepo.findOne({
      where: { videoId: req.videoId, userId },
    });

    if (existingReaction) {
      await this.reactionRepo.remove(existingReaction);
      video.decrementLikes();
      await this.videoRepo.save(video);
      await this.eventBus.publish(new VideoUnlikedEvent(video.videoId, userId));
      return VideoLikeResDto.of(video.videoId, false, video.likesCount);
    }

    const newReaction = VideoReaction.create(
      req.videoId,
      userId,
      VideoReactionType.LIKE,
    );
    await this.reactionRepo.save(newReaction);
    video.incrementLikes();
    await this.videoRepo.save(video);
    await this.eventBus.publish(new VideoLikedEvent(video.videoId, userId));

    return VideoLikeResDto.of(video.videoId, true, video.likesCount);
  }

  async getReactionStatus(
    videoId: string,
    userId?: string | null,
  ): Promise<VideoLikeResDto> {
    const video = await this.videoRepo.findOne({ where: { videoId } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    let isLiked = false;
    if (userId) {
      const reaction = await this.reactionRepo.findOne({
        where: { videoId, userId },
      });
      isLiked = !!reaction;
    }

    return VideoLikeResDto.of(video.videoId, isLiked, video.likesCount);
  }

  async shareVideo(
    req: ShareVideoReqDto,
    userId?: string | null,
  ): Promise<ShareVideoResDto> {
    const video = await this.videoRepo.findOne({ where: { videoId: req.videoId } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const platform = req.platform ?? SharePlatform.DIRECT_LINK;
    const share = VideoShare.create(req.videoId, userId ?? null, platform);
    await this.shareRepo.save(share);

    video.incrementShares();
    await this.videoRepo.save(video);

    await this.eventBus.publish(
      new VideoSharedEvent(video.videoId, userId ?? null, platform),
    );

    const shareUrl = `https://mycast.tv/watch/${video.videoId}?ref=share`;
    const embedCode = `<iframe src="https://mycast.tv/embed/${video.videoId}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`;

    return ShareVideoResDto.of(
      video.videoId,
      shareUrl,
      video.sharesCount,
      embedCode,
    );
  }
}
