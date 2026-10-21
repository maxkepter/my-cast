import { DomainEvent } from '../../../../common/domain/domain-event';

export class CreatorUnfollowedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'channel.unfollowed';

  constructor(
    public readonly channelId: string,
    public readonly followerId: string,
  ) {
    super();
  }

  getEventName(): string {
    return CreatorUnfollowedEvent.EVENT_NAME;
  }
}
