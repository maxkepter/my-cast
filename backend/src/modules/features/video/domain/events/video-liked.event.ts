import { DomainEvent } from '../../../../../common/domain/domain-event';

export class VideoLikedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.liked';

  constructor(
    public readonly videoId: string,
    public readonly userId: string,
  ) {
    super();
  }

  getEventName(): string {
    return VideoLikedEvent.EVENT_NAME;
  }
}
