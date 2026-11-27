import { DomainEvent } from '../../../../../common/domain/domain-event';

export class VideoProcessFailedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.process.failed';

  constructor(
    public readonly videoId: string,
    public readonly reason: string,
    public readonly authorId?: string,
    public readonly videoKey?: string,
    public readonly errorCode?: string,
  ) {
    super();
  }

  getEventName(): string {
    return VideoProcessFailedEvent.EVENT_NAME;
  }
}
