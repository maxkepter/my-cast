import { DomainEvent } from '../../../../../common/domain/domain-event';
import { SharePlatform } from '../enums/share-platform.enum';

export class VideoSharedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.shared';

  constructor(
    public readonly videoId: string,
    public readonly userId: string | null,
    public readonly platform: SharePlatform,
  ) {
    super();
  }

  getEventName(): string {
    return VideoSharedEvent.EVENT_NAME;
  }
}
