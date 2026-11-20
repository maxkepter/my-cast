import { DomainEvent } from '../../../../../common/domain/domain-event';

export class PlaylistCreatedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'playlist.created';

  constructor(
    public readonly playlistId: string,
    public readonly authorId: string,
    public readonly title: string,
  ) {
    super();
  }

  getEventName(): string {
    return PlaylistCreatedEvent.EVENT_NAME;
  }
}
