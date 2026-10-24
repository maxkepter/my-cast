import { DomainEvent } from '../../../../../common/domain/domain-event';

export class ChannelCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'channel.created';

  constructor(
    public readonly channelId: string,
    public readonly ownerId: string,
    public readonly name: string,
  ) {
    super();
  }

  getEventName(): string {
    return ChannelCreatedEvent.EVENT_NAME;
  }
}
