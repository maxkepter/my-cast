import { DomainEvent } from '../../../../../common/domain/domain-event';

export interface VideoProcessCompletedProps {
  videoId: string;
  authorId: string;
  videoKey: string;
  masterPlaylistKey: string;
  thumbnailKey: string;
  storyboardVttKey: string;
  storyboardSpriteKeys: string[];
  previewKey: string;
  renditions: string[];
  duration: number;
  width: number;
  height: number;
}

export class VideoProcessCompletedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.process.completed';

  readonly videoId: string;
  readonly authorId: string;
  readonly videoKey: string;
  readonly masterPlaylistKey: string;
  readonly thumbnailKey: string;
  readonly storyboardVttKey: string;
  readonly storyboardSpriteKeys: string[];
  readonly previewKey: string;
  readonly renditions: string[];
  readonly duration: number;
  readonly width: number;
  readonly height: number;

  constructor(props: VideoProcessCompletedProps) {
    super();
    this.videoId = props.videoId;
    this.authorId = props.authorId;
    this.videoKey = props.videoKey;
    this.masterPlaylistKey = props.masterPlaylistKey;
    this.thumbnailKey = props.thumbnailKey;
    this.storyboardVttKey = props.storyboardVttKey;
    this.storyboardSpriteKeys = [...props.storyboardSpriteKeys];
    this.previewKey = props.previewKey;
    this.renditions = [...props.renditions];
    this.duration = props.duration;
    this.width = props.width;
    this.height = props.height;
  }

  getEventName(): string {
    return VideoProcessCompletedEvent.EVENT_NAME;
  }
}
