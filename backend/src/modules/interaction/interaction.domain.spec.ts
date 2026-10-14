import { describe, expect, it } from 'vitest';
import { CommentStatus } from './domain/enums/comment-status.enum';
import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from './domain/enums/report.enum';
import { CommentCreatedEvent } from './domain/events/comment-created.event';
import { CommentDeletedEvent } from './domain/events/comment-deleted.event';
import { ContentReportedEvent } from './domain/events/content-reported.event';
import { UserBlockedEvent } from './domain/events/user-blocked.event';
import { CommentContent } from './domain/value-objects/comment-content.vo';
import { ReportDetail } from './domain/value-objects/report-detail.vo';
import { Comment } from './domain/entities/comment.entity';
import { ContentReport } from './domain/entities/content-report.entity';
import { UserBlock } from './domain/entities/user-block.entity';
import { CommentAuthorizationPolicy } from './domain/services/comment-authorization.policy';
import {
  MockVideoQueryContract,
  VideoQueryContract,
} from '../video/contracts/video-query.contract';

describe('Interaction Module Domain Layer', () => {
  describe('Value Objects', () => {
    it('CommentContent validates and sanitizes correctly', () => {
      const content = CommentContent.create(
        '  Hello world! <script>alert(1)</script>  ',
      );
      expect(content.getValue()).toBe('Hello world!');
      expect(content.equals(CommentContent.create('Hello world!'))).toBe(true);

      expect(() => CommentContent.create('')).toThrow(
        'Comment content cannot be empty',
      );
      expect(() => CommentContent.create('   ')).toThrow(
        'Comment content cannot be empty',
      );
      expect(() => CommentContent.create('a'.repeat(2001))).toThrow(
        'Comment content cannot exceed 2000 characters',
      );
    });

    it('ReportDetail validates length', () => {
      const detail = ReportDetail.create('Detailed reason');
      expect(detail.getValue()).toBe('Detailed reason');
      expect(() => ReportDetail.create('x'.repeat(1001))).toThrow(
        'Report description cannot exceed 1000 characters',
      );
    });
  });

  describe('Entities & Domain Methods', () => {
    it('Comment lifecycle and actions', () => {
      const comment = Comment.create(
        'c-1',
        'video-1',
        'user-1',
        'Great video!',
      );
      expect(comment.status).toBe(CommentStatus.VISIBLE);
      expect(comment.repliesCount).toBe(0);

      comment.editContent('Updated text');
      expect(comment.content.getValue()).toBe('Updated text');

      comment.incrementReplies();
      expect(comment.repliesCount).toBe(1);
      comment.decrementReplies();
      expect(comment.repliesCount).toBe(0);

      comment.deleteByAuthor();
      expect(comment.status).toBe(CommentStatus.DELETED_BY_AUTHOR);
      expect(() => comment.editContent('Try edit deleted')).toThrow(
        'Cannot edit a deleted or hidden comment',
      );

      const creatorComment = Comment.create(
        'c-2',
        'video-1',
        'user-2',
        'Spam',
      );
      creatorComment.deleteByCreator();
      expect(creatorComment.status).toBe(CommentStatus.DELETED_BY_CREATOR);

      const modComment = Comment.create('c-3', 'video-1', 'user-3', 'Bad');
      modComment.hideByModerator();
      expect(modComment.status).toBe(CommentStatus.HIDDEN_BY_MODERATION);
    });

    it('ContentReport resolve workflow', () => {
      const report = ContentReport.create(
        'r-1',
        'reporter-1',
        ReportTargetType.VIDEO,
        'video-1',
        ReportReason.SPAM,
        'Spam video description',
      );
      expect(report.status).toBe(ReportStatus.PENDING);
      expect(report.reviewedBy).toBeNull();

      report.resolve(ReportStatus.ACTION_TAKEN, 'admin-1');
      expect(report.status).toBe(ReportStatus.ACTION_TAKEN);
      expect(report.reviewedBy).toBe('admin-1');

      expect(() =>
        report.resolve(ReportStatus.DISMISSED, 'admin-2'),
      ).toThrow('Report has already been resolved');
    });

    it('UserBlock self-blocking validation', () => {
      const block = UserBlock.create('b-1', 'user-1', 'user-2');
      expect(block.blockerId).toBe('user-1');
      expect(block.blockedId).toBe('user-2');

      expect(() => UserBlock.create(undefined, 'user-1', 'user-1')).toThrow(
        'User cannot block themselves',
      );
    });
  });

  describe('Domain Policy: CommentAuthorizationPolicy', () => {
    const videoContract: VideoQueryContract = MockVideoQueryContract;

    it('allows author of the comment to delete', async () => {
      const comment = Comment.create(
        'c-1',
        'video-1',
        'author-user-id',
        'Test',
      );
      const videoInfo = await videoContract.getVideoBasicInfo('video-1');
      const canDelete = CommentAuthorizationPolicy.canDelete(
        comment,
        'author-user-id',
        videoInfo!.authorId,
      );
      expect(canDelete).toBe(true);
    });

    it('allows video creator to delete comments on their video', async () => {
      const comment = Comment.create(
        'c-1',
        'video-1',
        'random-user-id',
        'Test',
      );
      const videoInfo = await videoContract.getVideoBasicInfo('video-1');
      const canDelete = CommentAuthorizationPolicy.canDelete(
        comment,
        videoInfo!.authorId, // 'creator-uuid-1'
        videoInfo!.authorId,
      );
      expect(canDelete).toBe(true);
    });

    it('denies third-party users from deleting comment', async () => {
      const comment = Comment.create(
        'c-1',
        'video-1',
        'author-user-id',
        'Test',
      );
      const videoInfo = await videoContract.getVideoBasicInfo('video-1');
      const canDelete = CommentAuthorizationPolicy.canDelete(
        comment,
        'unrelated-user-id',
        videoInfo!.authorId,
      );
      expect(canDelete).toBe(false);
    });
  });

  describe('Domain Events', () => {
    it('instantiates events with correct event names', () => {
      const ev1 = new CommentCreatedEvent('c-1', 'v-1', 'u-1', null);
      expect(ev1.getEventName()).toBe(CommentCreatedEvent.EVENT_NAME);

      const ev2 = new CommentDeletedEvent('c-1', 'v-1', 'u-1', false);
      expect(ev2.getEventName()).toBe(CommentDeletedEvent.EVENT_NAME);

      const ev3 = new ContentReportedEvent(
        'r-1',
        ReportTargetType.COMMENT,
        'c-1',
        'u-2',
        ReportReason.HARASSMENT,
      );
      expect(ev3.getEventName()).toBe(ContentReportedEvent.EVENT_NAME);

      const ev4 = new UserBlockedEvent('u-1', 'u-2');
      expect(ev4.getEventName()).toBe(UserBlockedEvent.EVENT_NAME);
    });
  });
});
