import { DomainEvent } from '../../../../../common/domain/domain-event';

export class VideoUpdatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.updated';

  constructor(
    public readonly videoId: string,
    public readonly authorId: string,
  ) {
    super();
  }

  getEventName(): string {
    return VideoUpdatedEvent.EVENT_NAME;
  }
}
