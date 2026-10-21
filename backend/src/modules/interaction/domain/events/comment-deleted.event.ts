import { DomainEvent } from '../../../../common/domain/domain-event';

export class CommentDeletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'comment.deleted';

  constructor(
    public readonly commentId: string,
    public readonly videoId: string,
    public readonly deletedBy: string,
    public readonly isDeletedByCreator: boolean,
  ) {
    super();
  }

  getEventName(): string {
    return CommentDeletedEvent.EVENT_NAME;
  }
}
