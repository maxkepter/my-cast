import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { CommentService } from './comment.service';
import { Comment } from '../../domain/entities/comment.entity';
import { CommentStatus } from '../../domain/enums/comment-status.enum';
import { CommentCreatedEvent } from '../../domain/events/comment-created.event';
import { CommentDeletedEvent } from '../../domain/events/comment-deleted.event';
import { CreateCommentReqDto, UpdateCommentReqDto } from '../../dtos/req.dto';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let eventBus: {
    publish: ReturnType<typeof vi.fn>;
  };
  let videoService: {
    getVideoBasicInfo: ReturnType<typeof vi.fn>;
    isAuthorOfVideo: ReturnType<typeof vi.fn>;
  };

  const videoId = '11111111-1111-4111-8111-111111111111';
  const authorId = '22222222-2222-4222-8222-222222222222';
  const creatorId = '33333333-3333-4333-8333-333333333333';
  const otherUserId = '44444444-4444-4444-8444-444444444444';
  const commentId = '55555555-5555-4555-8555-555555555555';
  const parentId = '66666666-6666-4666-8666-666666666666';

  beforeEach(() => {
    commentRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn((entity) =>
        Promise.resolve({
          ...entity,
          commentId: entity.commentId ?? commentId,
          createdAt: entity.createdAt ?? new Date(),
          updatedAt: entity.updatedAt ?? new Date(),
        }),
      ),
    };

    eventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    videoService = {
      getVideoBasicInfo: vi.fn().mockResolvedValue({
        videoId,
        authorId: creatorId,
        isCommentsAllowed: true,
        isActive: true,
      }),
      isAuthorOfVideo: vi.fn().mockImplementation(async (_vid, uid) => uid === creatorId),
    };

    service = new CommentService(
      commentRepo as any,
      eventBus as any,
      videoService as any,
    );
  });

  describe('viewComments', () => {
    it('queries top-level comments with IsNull() parentId and default pagination', async () => {
      const mockComment = Comment.create(commentId, videoId, authorId, 'Great video!');
      mockComment.createdAt = new Date('2026-01-01');
      mockComment.updatedAt = new Date('2026-01-01');
      commentRepo.find.mockResolvedValue([mockComment]);

      const result = await service.viewComments(videoId);

      expect(commentRepo.find).toHaveBeenCalledWith({
        where: {
          videoId,
          status: CommentStatus.VISIBLE,
          parentId: IsNull(),
        },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });

      expect(result).toHaveLength(1);
      expect(result[0].commentId).toBe(commentId);
      expect(result[0].content).toBe('Great video!');
      expect(result[0].parentId).toBeNull();
    });

    it('queries replies when parentId is provided and applies custom pagination', async () => {
      const mockReply = Comment.create('reply-1', videoId, authorId, 'Thanks!', parentId);
      mockReply.createdAt = new Date();
      mockReply.updatedAt = new Date();
      commentRepo.find.mockResolvedValue([mockReply]);

      const result = await service.viewComments(videoId, parentId, 2, 10);

      expect(commentRepo.find).toHaveBeenCalledWith({
        where: {
          videoId,
          status: CommentStatus.VISIBLE,
          parentId,
        },
        order: { createdAt: 'DESC' },
        skip: 10,
        take: 10,
      });
      expect(result).toHaveLength(1);
      expect(result[0].parentId).toBe(parentId);
    });
  });

  describe('createComment', () => {
    it('throws NotFoundException when video is not found', async () => {
      videoService.getVideoBasicInfo.mockResolvedValue(null);
      const dto: CreateCommentReqDto = { videoId, content: 'Nice video' };

      await expect(service.createComment(authorId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(commentRepo.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when video is inactive', async () => {
      videoService.getVideoBasicInfo.mockResolvedValue({
        videoId,
        authorId: creatorId,
        isCommentsAllowed: true,
        isActive: false,
      });
      const dto: CreateCommentReqDto = { videoId, content: 'Nice video' };

      await expect(service.createComment(authorId, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(commentRepo.save).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when comments are disabled for video', async () => {
      videoService.getVideoBasicInfo.mockResolvedValue({
        videoId,
        authorId: creatorId,
        isCommentsAllowed: false,
        isActive: true,
      });
      const dto: CreateCommentReqDto = { videoId, content: 'Nice video' };

      await expect(service.createComment(authorId, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(commentRepo.save).not.toHaveBeenCalled();
    });

    it('creates top-level comment and publishes CommentCreatedEvent', async () => {
      const dto: CreateCommentReqDto = { videoId, content: 'Hello world' };

      const result = await service.createComment(authorId, dto);

      expect(commentRepo.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledTimes(1);

      const publishedEvent = eventBus.publish.mock.calls[0][0];
      expect(publishedEvent).toBeInstanceOf(CommentCreatedEvent);
      expect(publishedEvent.videoId).toBe(videoId);
      expect(publishedEvent.authorId).toBe(authorId);
      expect(publishedEvent.parentId).toBeNull();
      expect(publishedEvent.getEventName()).toBe(CommentCreatedEvent.EVENT_NAME);

      expect(result.videoId).toBe(videoId);
      expect(result.authorId).toBe(authorId);
      expect(result.content).toBe('Hello world');
      expect(result.parentId).toBeNull();
      expect(result.status).toBe(CommentStatus.VISIBLE);
    });

    it('throws NotFoundException when parent comment is not found for reply', async () => {
      commentRepo.findOne.mockResolvedValue(null);
      const dto: CreateCommentReqDto = {
        videoId,
        content: 'Replying here',
        parentId,
      };

      await expect(service.createComment(authorId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(commentRepo.findOne).toHaveBeenCalledWith({
        where: {
          commentId: parentId,
          videoId,
          status: CommentStatus.VISIBLE,
        },
      });
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('increments parent replies and saves reply comment when valid parentId', async () => {
      const parentComment = Comment.create(parentId, videoId, creatorId, 'Original post');
      parentComment.repliesCount = 2;
      commentRepo.findOne.mockResolvedValue(parentComment);

      const dto: CreateCommentReqDto = {
        videoId,
        content: 'Replying here',
        parentId,
      };

      const result = await service.createComment(authorId, dto);

      expect(parentComment.repliesCount).toBe(3);
      expect(commentRepo.save).toHaveBeenCalledWith(parentComment);
      expect(commentRepo.save).toHaveBeenCalledTimes(2);

      const publishedEvent = eventBus.publish.mock.calls[0][0];
      expect(publishedEvent.parentId).toBe(parentId);
      expect(result.parentId).toBe(parentId);
    });
  });

  describe('updateComment', () => {
    it('throws NotFoundException when comment is not found', async () => {
      commentRepo.findOne.mockResolvedValue(null);
      const dto: UpdateCommentReqDto = { content: 'Updated' };

      await expect(
        service.updateComment(commentId, authorId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when current user is not author', async () => {
      const existing = Comment.create(commentId, videoId, authorId, 'Original');
      commentRepo.findOne.mockResolvedValue(existing);
      const dto: UpdateCommentReqDto = { content: 'Updated' };

      await expect(
        service.updateComment(commentId, otherUserId, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates comment content and returns updated CommentItemResDto', async () => {
      const existing = Comment.create(commentId, videoId, authorId, 'Original');
      commentRepo.findOne.mockResolvedValue(existing);
      const dto: UpdateCommentReqDto = { content: 'Brand new text' };

      const result = await service.updateComment(commentId, authorId, dto);

      expect(commentRepo.save).toHaveBeenCalledWith(existing);
      expect(result.content).toBe('Brand new text');
    });
  });

  describe('deleteComment', () => {
    it('throws NotFoundException when comment does not exist', async () => {
      commentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteComment(commentId, authorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when associated video does not exist', async () => {
      const existing = Comment.create(commentId, videoId, authorId, 'To delete');
      commentRepo.findOne.mockResolvedValue(existing);
      videoService.getVideoBasicInfo.mockResolvedValue(null);

      await expect(
        service.deleteComment(commentId, authorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is neither comment author nor video owner', async () => {
      const existing = Comment.create(commentId, videoId, authorId, 'To delete');
      commentRepo.findOne.mockResolvedValue(existing);

      await expect(
        service.deleteComment(commentId, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows author to delete their comment (deleteByAuthor)', async () => {
      const existing = Comment.create(commentId, videoId, authorId, 'To delete');
      commentRepo.findOne.mockResolvedValue(existing);

      const result = await service.deleteComment(commentId, authorId);

      expect(result).toBe(true);
      expect(existing.status).toBe(CommentStatus.DELETED_BY_AUTHOR);
      expect(commentRepo.save).toHaveBeenCalledWith(existing);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      const event = eventBus.publish.mock.calls[0][0];
      expect(event).toBeInstanceOf(CommentDeletedEvent);
      expect(event.commentId).toBe(commentId);
      expect(event.deletedBy).toBe(authorId);
      expect(event.isDeletedByCreator).toBe(false);
    });

    it('allows video creator to delete comments on their video (deleteByCreator)', async () => {
      const existing = Comment.create(commentId, videoId, authorId, 'Spam comment');
      commentRepo.findOne.mockResolvedValue(existing);

      const result = await service.deleteComment(commentId, creatorId);

      expect(result).toBe(true);
      expect(existing.status).toBe(CommentStatus.DELETED_BY_CREATOR);

      const event = eventBus.publish.mock.calls[0][0];
      expect(event.deletedBy).toBe(creatorId);
      expect(event.isDeletedByCreator).toBe(true);
    });

    it('decrements parent repliesCount if deleted comment was a reply', async () => {
      const reply = Comment.create(commentId, videoId, authorId, 'Reply text', parentId);
      const parent = Comment.create(parentId, videoId, creatorId, 'Parent');
      parent.repliesCount = 5;

      commentRepo.findOne.mockImplementation(async (query: any) => {
        if (query?.where?.commentId === commentId) return reply;
        if (query?.where?.commentId === parentId) return parent;
        return null;
      });

      await service.deleteComment(commentId, authorId);

      expect(parent.repliesCount).toBe(4);
      expect(commentRepo.save).toHaveBeenCalledWith(parent);
      expect(commentRepo.save).toHaveBeenCalledWith(reply);
    });
  });

  describe('execute overload', () => {
    it('delegates to viewComments', async () => {
      const res = await service.execute(videoId, null, 1, 10);
      expect(commentRepo.find).toHaveBeenCalled();
      expect(res).toEqual([]);
    });

    it('delegates to createComment', async () => {
      const dto: CreateCommentReqDto = { videoId, content: 'Created' };
      const res = await service.execute(authorId, dto);
      expect(res.content).toBe('Created');
    });

    it('delegates to updateComment', async () => {
      const existing = Comment.create(commentId, videoId, authorId, 'Old');
      commentRepo.findOne.mockResolvedValue(existing);
      const dto: UpdateCommentReqDto = { content: 'New' };

      const res = await service.execute(commentId, authorId, dto);
      expect(res.content).toBe('New');
    });

    it('delegates to deleteComment', async () => {
      const existing = Comment.create(commentId, videoId, authorId, 'Old');
      commentRepo.findOne.mockResolvedValue(existing);

      const res = await service.execute(commentId, authorId);
      expect(res).toBe(true);
    });
  });
});
