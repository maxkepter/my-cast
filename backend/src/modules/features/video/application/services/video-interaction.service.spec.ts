import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { VideoInteractionService } from './video-interaction.service';
import { Video } from '../../domain/entities/video.entity';
import { VideoReaction } from '../../domain/entities/video-reaction.entity';
import { VideoConfig } from '../../domain/value-objects/video-config.vo';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { VideoLikedEvent } from '../../domain/events/video-liked.event';
import { VideoUnlikedEvent } from '../../domain/events/video-unliked.event';
import { VideoSharedEvent } from '../../domain/events/video-shared.event';
import { SharePlatform } from '../../domain/enums/share-platform.enum';

describe('VideoInteractionService', () => {
  let service: VideoInteractionService;
  let videoRepo: any;
  let reactionRepo: any;
  let shareRepo: any;
  let eventBus: any;

  const mockVideo = () =>
    Video.create(
      'v-101',
      'u-creator-1',
      'Test Video',
      'Test Title',
      'https://thumb.jpg',
      'https://video.mp4',
      100,
      VideoConfig.create(VideoVisibility.PUBLIC, true),
      10,
      5,
    );

  beforeEach(() => {
    videoRepo = {
      findOne: vi.fn(),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };
    reactionRepo = {
      findOne: vi.fn(),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    shareRepo = {
      save: vi.fn((entity) => Promise.resolve(entity)),
    };
    eventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    service = new VideoInteractionService(
      videoRepo,
      reactionRepo,
      shareRepo,
      eventBus,
    );
  });

  describe('toggleLike', () => {
    it('should throw NotFoundException when video does not exist', async () => {
      videoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.toggleLike('u-user-1', { videoId: 'v-missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add like if reaction does not exist', async () => {
      const video = mockVideo();
      videoRepo.findOne.mockResolvedValue(video);
      reactionRepo.findOne.mockResolvedValue(null);

      const res = await service.toggleLike('u-user-1', { videoId: 'v-101' });

      expect(res.isLiked).toBe(true);
      expect(res.totalLikes).toBe(11);
      expect(reactionRepo.save).toHaveBeenCalled();
      expect(videoRepo.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(VideoLikedEvent),
      );
    });

    it('should remove like if reaction already exists', async () => {
      const video = mockVideo();
      videoRepo.findOne.mockResolvedValue(video);
      const existingReaction = VideoReaction.create('v-101', 'u-user-1');
      reactionRepo.findOne.mockResolvedValue(existingReaction);

      const res = await service.toggleLike('u-user-1', { videoId: 'v-101' });

      expect(res.isLiked).toBe(false);
      expect(res.totalLikes).toBe(9);
      expect(reactionRepo.remove).toHaveBeenCalledWith(existingReaction);
      expect(videoRepo.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(VideoUnlikedEvent),
      );
    });
  });

  describe('getReactionStatus', () => {
    it('should throw NotFoundException when video does not exist', async () => {
      videoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getReactionStatus('v-missing', 'u-user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return isLiked=false when userId is absent', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());

      const res = await service.getReactionStatus('v-101', null);
      expect(res.isLiked).toBe(false);
      expect(res.totalLikes).toBe(10);
      expect(reactionRepo.findOne).not.toHaveBeenCalled();
    });

    it('should return isLiked=true when user has reacted', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());
      reactionRepo.findOne.mockResolvedValue(
        VideoReaction.create('v-101', 'u-user-1'),
      );

      const res = await service.getReactionStatus('v-101', 'u-user-1');
      expect(res.isLiked).toBe(true);
      expect(res.totalLikes).toBe(10);
    });
  });

  describe('shareVideo', () => {
    it('should throw NotFoundException when video does not exist', async () => {
      videoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.shareVideo({ videoId: 'v-missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should increment shares and publish VideoSharedEvent', async () => {
      const video = mockVideo();
      videoRepo.findOne.mockResolvedValue(video);

      const res = await service.shareVideo(
        { videoId: 'v-101', platform: SharePlatform.FACEBOOK },
        'u-user-1',
      );

      expect(res.totalShares).toBe(6);
      expect(res.shareUrl).toContain('https://mycast.tv/watch/v-101');
      expect(res.embedCode).toContain('<iframe');
      expect(shareRepo.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(VideoSharedEvent),
      );
    });
  });

  describe('execute() routing', () => {
    it('routes to shareVideo when given ShareVideoReqDto', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());
      const res = await service.execute({
        videoId: 'v-101',
        platform: SharePlatform.DIRECT_LINK,
      });
      expect(res).toHaveProperty('shareUrl');
    });

    it('routes to toggleLike when given userId and ToggleVideoLikeReqDto', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());
      reactionRepo.findOne.mockResolvedValue(null);
      const res = await service.execute('u-user-1', { videoId: 'v-101' });
      expect(res).toHaveProperty('isLiked');
    });

    it('routes to getReactionStatus when given string videoId', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());
      const res = await service.execute('v-101', 'u-user-1');
      expect(res).toHaveProperty('isLiked');
    });
  });
});
