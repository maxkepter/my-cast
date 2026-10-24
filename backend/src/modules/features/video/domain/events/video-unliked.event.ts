import { DomainEvent } from '../../../../../common/domain/domain-event';

export class VideoUnlikedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.unliked';

  constructor(
    public readonly videoId: string,
    public readonly userId: string,
  ) {
    super();
  }

  getEventName(): string {
    return VideoUnlikedEvent.EVENT_NAME;
  }
}
