import { DomainEvent } from '../../../../../common/domain/domain-event';
import { VideoProcessErrorCode } from '../enums/video-process-error-code.enum';

export class VideoProcessFailedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.process.failed';

  constructor(
    public readonly videoId: string,
    public readonly reason: string,
    public readonly authorId?: string,
    public readonly videoKey?: string,
    public readonly errorCode?: VideoProcessErrorCode,
  ) {
    super();
  }

  getEventName(): string {
    return VideoProcessFailedEvent.EVENT_NAME;
  }
}
