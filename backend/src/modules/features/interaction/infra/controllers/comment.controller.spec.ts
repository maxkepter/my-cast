import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from '../../application/services/comment.service';
import { CreateCommentReqDto, UpdateCommentReqDto } from '../../dtos/req.dto';
import { CommentItemResDto } from '../../dtos/res.dto';
import { CommentStatus } from '../../domain/enums/comment-status.enum';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: {
    viewComments: ReturnType<typeof vi.fn>;
    createComment: ReturnType<typeof vi.fn>;
    updateComment: ReturnType<typeof vi.fn>;
    deleteComment: ReturnType<typeof vi.fn>;
  };

  const userId = '11111111-1111-4111-8111-111111111111';
  const videoId = '22222222-2222-4222-8222-222222222222';
  const commentId = '33333333-3333-4333-8333-333333333333';
  const parentId = '44444444-4444-4444-8444-444444444444';

  const mockCommentRes = CommentItemResDto.of({
    commentId,
    videoId,
    authorId: userId,
    content: 'Test content',
    parentId: null,
    status: CommentStatus.VISIBLE,
    repliesCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    commentService = {
      viewComments: vi.fn(),
      createComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn(),
    };

    controller = new CommentController(
      commentService as unknown as CommentService,
    );
  });

  describe('viewComments', () => {
    it('delegates to commentService.viewComments with parsed query params', async () => {
      commentService.viewComments.mockResolvedValue([mockCommentRes]);

      const result = await controller.viewComments(videoId, parentId, 2, 10);

      expect(commentService.viewComments).toHaveBeenCalledWith(
        videoId,
        parentId,
        2,
        10,
      );
      expect(result).toEqual([mockCommentRes]);
    });

    it('falls back to default page 1 and limit 20 when not provided', async () => {
      commentService.viewComments.mockResolvedValue([]);

      await controller.viewComments(videoId);

      expect(commentService.viewComments).toHaveBeenCalledWith(
        videoId,
        undefined,
        1,
        20,
      );
    });
  });

  describe('createComment', () => {
    it('delegates to commentService.createComment with userId and dto', async () => {
      const dto: CreateCommentReqDto = {
        videoId,
        content: 'New comment',
      };
      commentService.createComment.mockResolvedValue(mockCommentRes);

      const result = await controller.createComment(userId, dto);

      expect(commentService.createComment).toHaveBeenCalledWith(userId, dto);
      expect(result).toBe(mockCommentRes);
    });

    it('propagates NotFoundException from service', async () => {
      const dto: CreateCommentReqDto = {
        videoId,
        content: 'New comment',
      };
      commentService.createComment.mockRejectedValue(
        new NotFoundException('Video not found'),
      );

      await expect(controller.createComment(userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateComment', () => {
    it('delegates to commentService.updateComment with commentId, userId, and dto', async () => {
      const dto: UpdateCommentReqDto = {
        content: 'Updated content',
      };
      commentService.updateComment.mockResolvedValue(mockCommentRes);

      const result = await controller.updateComment(commentId, userId, dto);

      expect(commentService.updateComment).toHaveBeenCalledWith(
        commentId,
        userId,
        dto,
      );
      expect(result).toBe(mockCommentRes);
    });

    it('propagates ForbiddenException when unauthorized', async () => {
      const dto: UpdateCommentReqDto = { content: 'Updated' };
      commentService.updateComment.mockRejectedValue(
        new ForbiddenException('Only the author can edit this comment'),
      );

      await expect(
        controller.updateComment(commentId, userId, dto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteComment', () => {
    it('delegates to commentService.deleteComment with commentId and userId', async () => {
      commentService.deleteComment.mockResolvedValue(true);

      await controller.deleteComment(commentId, userId);

      expect(commentService.deleteComment).toHaveBeenCalledWith(
        commentId,
        userId,
      );
    });

    it('propagates ForbiddenException when user cannot delete', async () => {
      commentService.deleteComment.mockRejectedValue(
        new ForbiddenException('You do not have permission to delete this comment'),
      );

      await expect(
        controller.deleteComment(commentId, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
