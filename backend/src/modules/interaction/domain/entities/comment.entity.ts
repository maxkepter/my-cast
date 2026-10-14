import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CommentStatus } from '../enums/comment-status.enum';
import { CommentContent } from '../value-objects/comment-content.vo';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  commentId!: string;

  @Column({ type: 'uuid' })
  videoId!: string;

  @Column({ type: 'uuid' })
  authorId!: string;

  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column(() => CommentContent, { prefix: false })
  content!: CommentContent;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.VISIBLE,
  })
  status!: CommentStatus;

  @Column({ type: 'int', default: 0 })
  repliesCount!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  editContent(newContent: string): void {
    if (this.status !== CommentStatus.VISIBLE) {
      throw new Error('Cannot edit a deleted or hidden comment');
    }
    this.content = CommentContent.create(newContent);
  }

  deleteByAuthor(): void {
    this.status = CommentStatus.DELETED_BY_AUTHOR;
  }

  deleteByCreator(): void {
    this.status = CommentStatus.DELETED_BY_CREATOR;
  }

  hideByModerator(): void {
    this.status = CommentStatus.HIDDEN_BY_MODERATION;
  }

  incrementReplies(): void {
    this.repliesCount = (this.repliesCount || 0) + 1;
  }

  decrementReplies(): void {
    this.repliesCount = Math.max(0, (this.repliesCount || 0) - 1);
  }

  static create(
    commentId: string | undefined,
    videoId: string,
    authorId: string,
    content: CommentContent | string,
    parentId: string | null = null,
  ): Comment {
    const comment = new Comment();
    if (commentId) {
      comment.commentId = commentId;
    }
    comment.videoId = videoId;
    comment.authorId = authorId;
    comment.parentId = parentId;
    comment.content =
      content instanceof CommentContent
        ? content
        : CommentContent.create(content);
    comment.status = CommentStatus.VISIBLE;
    comment.repliesCount = 0;
    return comment;
  }
}
