import { DomainEvent } from '../../../../../common/domain/domain-event';

export class VideoDeletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.deleted';

  constructor(
    public readonly videoId: string,
    public readonly authorId: string,
  ) {
    super();
  }

  getEventName(): string {
    return VideoDeletedEvent.EVENT_NAME;
  }
}
