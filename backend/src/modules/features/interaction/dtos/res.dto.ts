import { CommentStatus } from '../domain/enums/comment-status.enum';
import { ReportStatus } from '../domain/enums/report.enum';

export class CommentItemResDto {
  commentId!: string;
  videoId!: string;
  authorId!: string;
  content!: string;
  parentId!: string | null;
  status!: CommentStatus;
  repliesCount!: number;
  createdAt!: Date;
  updatedAt!: Date;

  static of(params: {
    commentId: string;
    videoId: string;
    authorId: string;
    content: string;
    parentId: string | null;
    status: CommentStatus;
    repliesCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): CommentItemResDto {
    const res = new CommentItemResDto();
    res.commentId = params.commentId;
    res.videoId = params.videoId;
    res.authorId = params.authorId;
    res.content = params.content;
    res.parentId = params.parentId;
    res.status = params.status;
    res.repliesCount = params.repliesCount;
    res.createdAt = params.createdAt;
    res.updatedAt = params.updatedAt;
    return res;
  }
}

export class ReportSubmissionResDto {
  reportId!: string;
  status!: ReportStatus;
  submittedAt!: Date;

  static of(
    reportId: string,
    status: ReportStatus,
    submittedAt: Date,
  ): ReportSubmissionResDto {
    const res = new ReportSubmissionResDto();
    res.reportId = reportId;
    res.status = status;
    res.submittedAt = submittedAt;
    return res;
  }
}

export class BlockStatusResDto {
  blockerId!: string;
  blockedId!: string;
  isBlocked!: boolean;

  static of(
    blockerId: string,
    blockedId: string,
    isBlocked: boolean,
  ): BlockStatusResDto {
    const res = new BlockStatusResDto();
    res.blockerId = blockerId;
    res.blockedId = blockedId;
    res.isBlocked = isBlocked;
    return res;
  }
}
