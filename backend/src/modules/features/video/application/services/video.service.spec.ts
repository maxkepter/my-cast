import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { Video } from '../../domain/entities/video.entity';
import { VideoConfig } from '../../domain/value-objects/video-config.vo';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { VideoUpdatedEvent } from '../../domain/events/video-updated.event';
import { VideoDeletedEvent } from '../../domain/events/video-deleted.event';

describe('VideoService', () => {
  let service: VideoService;
  let videoRepo: any;
  let eventBus: any;

  const mockVideo = () =>
    Video.create(
      'v-101',
      'u-creator-1',
      'Initial Description',
      'Initial Title',
      'https://thumb.jpg',
      'https://video.mp4',
      100,
      VideoConfig.create(VideoVisibility.PUBLIC, true),
      10,
      2,
    );

  beforeEach(() => {
    videoRepo = {
      findOne: vi.fn(),
      save: vi.fn((entity) => Promise.resolve(entity)),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    eventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    service = new VideoService(videoRepo, eventBus);
  });

  describe('updateVideo', () => {
    it('should throw NotFoundException when video does not exist', async () => {
      videoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateVideo('u-creator-1', 'v-non-existent', {
          title: 'New Title',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());

      await expect(
        service.updateVideo('u-other-user', 'v-101', {
          title: 'New Title',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when SCHEDULED without scheduleAt', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());

      await expect(
        service.updateVideo('u-creator-1', 'v-101', {
          visibility: VideoVisibility.SCHEDULED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when not SCHEDULED but scheduleAt provided', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());

      await expect(
        service.updateVideo('u-creator-1', 'v-101', {
          visibility: VideoVisibility.PUBLIC,
          scheduleAt: new Date(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update video and publish VideoUpdatedEvent', async () => {
      const existing = mockVideo();
      videoRepo.findOne.mockResolvedValue(existing);

      const result = await service.updateVideo('u-creator-1', 'v-101', {
        title: 'Updated Title',
        description: 'Updated Description',
        visibility: VideoVisibility.PUBLIC,
        allowComments: false,
      });

      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated Description');
      expect(result.config.allowComments).toBe(false);
      expect(videoRepo.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(VideoUpdatedEvent),
      );
    });

    it('should support execute() overload for update', async () => {
      const existing = mockVideo();
      videoRepo.findOne.mockResolvedValue(existing);

      const result = await service.execute('u-creator-1', 'v-101', {
        title: 'New via execute',
      });

      expect(result.title).toBe('New via execute');
    });
  });

  describe('deleteVideo', () => {
    it('should throw NotFoundException when video does not exist', async () => {
      videoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteVideo('u-creator-1', 'v-missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());

      await expect(
        service.deleteVideo('u-intruder', 'v-101'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should delete video and publish VideoDeletedEvent', async () => {
      const existing = mockVideo();
      videoRepo.findOne.mockResolvedValue(existing);

      await service.deleteVideo('u-creator-1', 'v-101');

      expect(videoRepo.remove).toHaveBeenCalledWith(existing);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(VideoDeletedEvent),
      );
    });

    it('should support execute() overload for delete', async () => {
      const existing = mockVideo();
      videoRepo.findOne.mockResolvedValue(existing);

      await service.execute('u-creator-1', 'v-101');
      expect(videoRepo.remove).toHaveBeenCalledWith(existing);
    });
  });

  describe('VideoQueryContract', () => {
    it('getVideoBasicInfo returns null for unknown video', async () => {
      videoRepo.findOne.mockResolvedValue(null);
      const info = await service.getVideoBasicInfo('v-unknown');
      expect(info).toBeNull();
    });

    it('getVideoBasicInfo returns basic info for existing video', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());
      const info = await service.getVideoBasicInfo('v-101');
      expect(info).toEqual({
        videoId: 'v-101',
        authorId: 'u-creator-1',
        isCommentsAllowed: true,
        isActive: true,
      });
    });

    it('isAuthorOfVideo checks owner correctly', async () => {
      videoRepo.findOne.mockResolvedValue(mockVideo());
      expect(await service.isAuthorOfVideo('v-101', 'u-creator-1')).toBe(true);
      expect(await service.isAuthorOfVideo('v-101', 'u-other')).toBe(false);
    });
  });
});
