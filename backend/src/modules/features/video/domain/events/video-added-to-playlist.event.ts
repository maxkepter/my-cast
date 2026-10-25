import { DomainEvent } from '../../../../../common/domain/domain-event';

export class VideoAddedToPlaylistEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.added_to_playlist';

  constructor(
    public readonly playlistId: string,
    public readonly videoId: string,
    public readonly authorId: string,
  ) {
    super();
  }

  getEventName(): string {
    return VideoAddedToPlaylistEvent.EVENT_NAME;
  }
}
