import { DomainEvent } from '../../../../../common/domain/domain-event';

export class VideoUploadedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.upload';

  constructor(
    public readonly videoId: string,
    public readonly authorId: string,
    public readonly videoKey: string,
    public readonly isSuccess: boolean,
    public readonly thumbnailKey?: string | null,
    public readonly nodeId?: string,
  ) {
    super();
  }

  getEventName(): string {
    return VideoUploadedEvent.EVENT_NAME;
  }
}
