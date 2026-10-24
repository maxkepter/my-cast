import { DomainEvent } from '../../../../../common/domain/domain-event';

export class CommentCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'comment.created';

  constructor(
    public readonly commentId: string,
    public readonly videoId: string,
    public readonly authorId: string,
    public readonly parentId: string | null,
  ) {
    super();
  }

  getEventName(): string {
    return CommentCreatedEvent.EVENT_NAME;
  }
}
