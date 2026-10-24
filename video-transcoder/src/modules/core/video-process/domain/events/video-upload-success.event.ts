import { DomainEvent } from '../../../../../common/domain/domain-event';

export class VideoUploadSuccessEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.upload.success';

  constructor(
    public readonly videoId: string,
    public readonly userId: string,
  ) {
    super();
  }

  getEventName(): string {
    return VideoUploadSuccessEvent.EVENT_NAME;
  }
}
