import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ContentReportService } from './content-report.service';
import { ContentReport } from '../../domain/entities/content-report.entity';
import { Comment } from '../../domain/entities/comment.entity';
import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '../../domain/enums/report.enum';
import { ContentReportedEvent } from '../../domain/events/content-reported.event';
import { CreateReportReqDto } from '../../dtos/req.dto';

describe('ContentReportService', () => {
  let service: ContentReportService;
  let reportRepo: {
    save: ReturnType<typeof vi.fn>;
  };
  let commentRepo: {
    findOne: ReturnType<typeof vi.fn>;
  };
  let eventBus: {
    publish: ReturnType<typeof vi.fn>;
  };
  let videoService: {
    getVideoBasicInfo: ReturnType<typeof vi.fn>;
    isAuthorOfVideo: ReturnType<typeof vi.fn>;
  };

  const reporterId = '11111111-1111-4111-8111-111111111111';
  const videoId = '22222222-2222-4222-8222-222222222222';
  const commentId = '33333333-3333-4333-8333-333333333333';
  const reportId = '44444444-4444-4444-8444-444444444444';
  const createdAt = new Date('2026-10-25T10:00:00Z');

  beforeEach(() => {
    reportRepo = {
      save: vi.fn((entity: ContentReport) => {
        const saved = { ...entity };
        saved.reportId = entity.reportId || reportId;
        saved.status = entity.status || ReportStatus.PENDING;
        saved.createdAt = entity.createdAt || createdAt;
        return Promise.resolve(saved as ContentReport);
      }),
    };
    commentRepo = {
      findOne: vi.fn(),
    };
    eventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };
    videoService = {
      getVideoBasicInfo: vi.fn(),
      isAuthorOfVideo: vi.fn(),
    };

    service = new ContentReportService(
      reportRepo as any,
      commentRepo as any,
      eventBus as any,
      videoService as any,
    );
  });

  describe('Report video target', () => {
    it('throws NotFoundException when reported video does not exist', async () => {
      videoService.getVideoBasicInfo.mockResolvedValue(null);

      const dto: CreateReportReqDto = {
        targetType: ReportTargetType.VIDEO,
        targetId: videoId,
        reason: ReportReason.SPAM,
        description: 'Spam video',
      };

      await expect(service.createReport(reporterId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createReport(reporterId, dto)).rejects.toThrow(
        'Reported video does not exist',
      );
      expect(videoService.getVideoBasicInfo).toHaveBeenCalledWith(videoId);
      expect(reportRepo.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('creates report for video, saves entity, publishes ContentReportedEvent, and returns ReportSubmissionResDto', async () => {
      videoService.getVideoBasicInfo.mockResolvedValue({
        videoId,
        authorId: 'creator-uuid',
        isCommentsAllowed: true,
        isActive: true,
      });

      const dto: CreateReportReqDto = {
        targetType: ReportTargetType.VIDEO,
        targetId: videoId,
        reason: ReportReason.VIOLENCE,
        description: 'Violent content',
      };

      const result = await service.createReport(reporterId, dto);

      expect(videoService.getVideoBasicInfo).toHaveBeenCalledWith(videoId);
      expect(reportRepo.save).toHaveBeenCalledTimes(1);

      const savedEntity = reportRepo.save.mock.calls[0][0];
      expect(savedEntity.reporterId).toBe(reporterId);
      expect(savedEntity.targetType).toBe(ReportTargetType.VIDEO);
      expect(savedEntity.targetId).toBe(videoId);
      expect(savedEntity.reason).toBe(ReportReason.VIOLENCE);
      expect(savedEntity.detail.getValue()).toBe('Violent content');
      expect(savedEntity.status).toBe(ReportStatus.PENDING);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      const publishedEvent = eventBus.publish.mock.calls[0][0];
      expect(publishedEvent).toBeInstanceOf(ContentReportedEvent);
      expect(publishedEvent.reportId).toBe(reportId);
      expect(publishedEvent.targetType).toBe(ReportTargetType.VIDEO);
      expect(publishedEvent.targetId).toBe(videoId);
      expect(publishedEvent.reporterId).toBe(reporterId);
      expect(publishedEvent.reason).toBe(ReportReason.VIOLENCE);
      expect(publishedEvent.getEventName()).toBe(ContentReportedEvent.EVENT_NAME);

      expect(result).toEqual({
        reportId,
        status: ReportStatus.PENDING,
        submittedAt: createdAt,
      });
    });
  });

  describe('Report comment target', () => {
    it('throws NotFoundException when reported comment does not exist', async () => {
      commentRepo.findOne.mockResolvedValue(null);

      const dto: CreateReportReqDto = {
        targetType: ReportTargetType.COMMENT,
        targetId: commentId,
        reason: ReportReason.HARASSMENT,
      };

      await expect(service.createReport(reporterId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createReport(reporterId, dto)).rejects.toThrow(
        'Reported comment does not exist',
      );
      expect(commentRepo.findOne).toHaveBeenCalledWith({
        where: { commentId },
      });
      expect(reportRepo.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('creates report for comment, saves entity, publishes ContentReportedEvent, and returns ReportSubmissionResDto', async () => {
      const existingComment = Comment.create(
        commentId,
        videoId,
        'comment-author',
        'Inappropriate comment',
      );
      commentRepo.findOne.mockResolvedValue(existingComment);

      const dto: CreateReportReqDto = {
        targetType: ReportTargetType.COMMENT,
        targetId: commentId,
        reason: ReportReason.HATE_SPEECH,
        description: 'Hate speech in comment',
      };

      const result = await service.createReport(reporterId, dto);

      expect(commentRepo.findOne).toHaveBeenCalledWith({
        where: { commentId },
      });
      expect(reportRepo.save).toHaveBeenCalledTimes(1);

      const savedEntity = reportRepo.save.mock.calls[0][0];
      expect(savedEntity.reporterId).toBe(reporterId);
      expect(savedEntity.targetType).toBe(ReportTargetType.COMMENT);
      expect(savedEntity.targetId).toBe(commentId);
      expect(savedEntity.reason).toBe(ReportReason.HATE_SPEECH);
      expect(savedEntity.detail.getValue()).toBe('Hate speech in comment');

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      const publishedEvent = eventBus.publish.mock.calls[0][0];
      expect(publishedEvent).toBeInstanceOf(ContentReportedEvent);
      expect(publishedEvent.targetType).toBe(ReportTargetType.COMMENT);
      expect(publishedEvent.targetId).toBe(commentId);

      expect(result.reportId).toBe(reportId);
      expect(result.status).toBe(ReportStatus.PENDING);
    });
  });

  describe('Guest reporting & delegation', () => {
    it('allows guest report where reporterId is null', async () => {
      videoService.getVideoBasicInfo.mockResolvedValue({
        videoId,
        authorId: 'creator-uuid',
        isCommentsAllowed: true,
        isActive: true,
      });

      const dto: CreateReportReqDto = {
        targetType: ReportTargetType.VIDEO,
        targetId: videoId,
        reason: ReportReason.COPYRIGHT,
      };

      const result = await service.createReport(null, dto);

      expect(reportRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = reportRepo.save.mock.calls[0][0];
      expect(savedEntity.reporterId).toBeNull();

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      const publishedEvent = eventBus.publish.mock.calls[0][0];
      expect(publishedEvent.reporterId).toBeNull();
      expect(result.reportId).toBe(reportId);
    });

    it('delegates execute() to createReport()', async () => {
      videoService.getVideoBasicInfo.mockResolvedValue({
        videoId,
        authorId: 'creator-uuid',
        isCommentsAllowed: true,
        isActive: true,
      });

      const dto: CreateReportReqDto = {
        targetType: ReportTargetType.VIDEO,
        targetId: videoId,
        reason: ReportReason.OTHER,
        description: 'Other reason',
      };

      const result = await service.execute(reporterId, dto);

      expect(result.reportId).toBe(reportId);
      expect(reportRepo.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });
});
