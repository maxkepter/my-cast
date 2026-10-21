import { DomainEvent } from '../../../../common/domain/domain-event';

export class UserBlockedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'user.blocked';

  constructor(
    public readonly blockerId: string,
    public readonly blockedId: string,
  ) {
    super();
  }

  getEventName(): string {
    return UserBlockedEvent.EVENT_NAME;
  }
}
