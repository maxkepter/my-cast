import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Comment } from '../../domain/entities/comment.entity';
import { CommentStatus } from '../../domain/enums/comment-status.enum';
import { CommentAuthorizationPolicy } from '../../domain/services/comment-authorization.policy';
import { CommentCreatedEvent } from '../../domain/events/comment-created.event';
import { CommentDeletedEvent } from '../../domain/events/comment-deleted.event';
import { CommentContent } from '../../domain/value-objects/comment-content.vo';
import { CreateCommentReqDto, UpdateCommentReqDto } from '../../dtos/req.dto';
import { CommentItemResDto } from '../../dtos/res.dto';
import { ViewCommentsUseCase } from '../usecases/view-comments.usecase';
import { CreateCommentUseCase } from '../usecases/create-comment.usecase';
import { UpdateCommentUseCase } from '../usecases/update-comment.usecase';
import { DeleteCommentUseCase } from '../usecases/delete-comment.usecase';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../../core/event/application/internal-event-bus.interface';
import { VideoService } from '../../../video/application/services/video.service';

@Injectable()
export class CommentService
  implements
    ViewCommentsUseCase,
    CreateCommentUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase
{
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly eventBus: InternalEventBus,
    private readonly videoService: VideoService,
  ) {}

  execute(
    videoId: string,
    parentId?: string | null,
    page?: number,
    limit?: number,
  ): Promise<CommentItemResDto[]>;
  execute(
    authorId: string,
    dto: CreateCommentReqDto,
  ): Promise<CommentItemResDto>;
  execute(
    commentId: string,
    authorId: string,
    dto: UpdateCommentReqDto,
  ): Promise<CommentItemResDto>;
  execute(
    commentId: string,
    currentUserId: string,
  ): Promise<boolean>;
  async execute(...args: any[]): Promise<any> {
    if (args.length === 2 && typeof args[1] === 'object' && args[1] !== null && 'content' in args[1] && 'videoId' in args[1]) {
      return this.createComment(args[0], args[1]);
    }
    if (args.length === 3 && typeof args[2] === 'object' && args[2] !== null && 'content' in args[2]) {
      return this.updateComment(args[0], args[1], args[2]);
    }
    if (args.length === 2 && typeof args[0] === 'string' && typeof args[1] === 'string') {
      return this.deleteComment(args[0], args[1]);
    }
    return this.viewComments(args[0], args[1], args[2], args[3]);
  }

  async viewComments(
    videoId: string,
    parentId?: string | null,
    page = 1,
    limit = 20,
  ): Promise<CommentItemResDto[]> {
    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.max(1, limit || 20);
    const skip = (pageNum - 1) * limitNum;

    const comments = await this.commentRepo.find({
      where: {
        videoId,
        status: CommentStatus.VISIBLE,
        parentId: parentId ? parentId : IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
      skip,
      take: limitNum,
    });

    return comments.map((comment) => this.toDto(comment));
  }

  async createComment(
    authorId: string,
    dto: CreateCommentReqDto,
  ): Promise<CommentItemResDto> {
    const videoInfo = await this.videoService.getVideoBasicInfo(dto.videoId);
    if (!videoInfo) {
      throw new NotFoundException('Video not found');
    }
    if (!videoInfo.isActive || !videoInfo.isCommentsAllowed) {
      throw new ForbiddenException('Comments are disabled for this video');
    }

    if (dto.parentId) {
      const parent = await this.commentRepo.findOne({
        where: {
          commentId: dto.parentId,
          videoId: dto.videoId,
          status: CommentStatus.VISIBLE,
        },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
      parent.incrementReplies();
      await this.commentRepo.save(parent);
    }

    const comment = Comment.create(
      undefined,
      dto.videoId,
      authorId,
      dto.content,
      dto.parentId ?? null,
    );
    const saved = await this.commentRepo.save(comment);

    await this.eventBus.publish(
      new CommentCreatedEvent(
        saved.commentId,
        saved.videoId,
        saved.authorId,
        saved.parentId,
      ),
    );

    return this.toDto(saved);
  }

  async updateComment(
    commentId: string,
    authorId: string,
    dto: UpdateCommentReqDto,
  ): Promise<CommentItemResDto> {
    const comment = await this.commentRepo.findOne({
      where: { commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== authorId) {
      throw new ForbiddenException('Only the author can edit this comment');
    }

    comment.editContent(dto.content);
    const saved = await this.commentRepo.save(comment);

    return this.toDto(saved);
  }

  async deleteComment(
    commentId: string,
    currentUserId: string,
  ): Promise<boolean> {
    const comment = await this.commentRepo.findOne({
      where: { commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const videoInfo = await this.videoService.getVideoBasicInfo(comment.videoId);
    if (!videoInfo) {
      throw new NotFoundException('Video not found');
    }

    const canDelete = CommentAuthorizationPolicy.canDelete(
      comment,
      currentUserId,
      videoInfo.authorId,
    );
    if (!canDelete) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    const isDeletedByCreator =
      currentUserId === videoInfo.authorId &&
      currentUserId !== comment.authorId;

    if (isDeletedByCreator) {
      comment.deleteByCreator();
    } else {
      comment.deleteByAuthor();
    }

    if (comment.parentId) {
      const parent = await this.commentRepo.findOne({
        where: { commentId: comment.parentId },
      });
      if (parent) {
        parent.decrementReplies();
        await this.commentRepo.save(parent);
      }
    }

    await this.commentRepo.save(comment);

    await this.eventBus.publish(
      new CommentDeletedEvent(
        comment.commentId,
        comment.videoId,
        currentUserId,
        isDeletedByCreator,
      ),
    );

    return true;
  }

  private toDto(comment: Comment): CommentItemResDto {
    const content =
      comment.content instanceof CommentContent
        ? comment.content.getValue()
        : typeof (comment.content as any)?.getValue === 'function'
          ? (comment.content as any).getValue()
          : (comment.content as any)?.value ?? String(comment.content ?? '');

    return CommentItemResDto.of({
      commentId: comment.commentId,
      videoId: comment.videoId,
      authorId: comment.authorId,
      content,
      parentId: comment.parentId ?? null,
      status: comment.status,
      repliesCount: comment.repliesCount ?? 0,
      createdAt: comment.createdAt ?? new Date(),
      updatedAt: comment.updatedAt ?? new Date(),
    });
  }
}
