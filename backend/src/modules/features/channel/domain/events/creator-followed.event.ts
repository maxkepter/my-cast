import { DomainEvent } from '../../../../../common/domain/domain-event';

export class CreatorFollowedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'channel.followed';

  constructor(
    public readonly channelId: string,
    public readonly followerId: string,
  ) {
    super();
  }

  getEventName(): string {
    return CreatorFollowedEvent.EVENT_NAME;
  }
}
