import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../../../common/domain/domain-event';

export interface VideoUploadedPayload {
  id?: string;
  occuredOn?: string | Date;
  videoId: string;
  authorId: string;
  videoKey: string;
  isSuccess?: boolean;
  thumbnailKey?: string | null;
  nodeId?: string;
}

export class VideoUploadedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.upload';

  constructor(
    public readonly videoId: string,
    public readonly authorId: string,
    public readonly videoKey: string,
    public readonly isSuccess: boolean = true,
    public readonly thumbnailKey?: string | null,
    public readonly nodeId?: string,
  ) {
    super();
  }

  get hasThumbnail(): boolean {
    return (
      typeof this.thumbnailKey === 'string' &&
      this.thumbnailKey.trim().length > 0
    );
  }

  getEventName(): string {
    return VideoUploadedEvent.EVENT_NAME;
  }

  static override deserialize<T extends DomainEvent = VideoUploadedEvent>(
    this: new (...args: any[]) => T,
    payload: string | VideoUploadedPayload | Record<string, unknown>,
  ): T {
    const data = (
      typeof payload === 'string' ? JSON.parse(payload) : payload
    ) as Partial<VideoUploadedPayload>;
    const instance = Object.create(this.prototype) as T;
    const occuredOn =
      data?.occuredOn instanceof Date
        ? data.occuredOn
        : data?.occuredOn
          ? new Date(data.occuredOn)
          : new Date();

    return Object.assign(instance, {
      id: data?.id ?? randomUUID(),
      occuredOn,
      videoId: data?.videoId,
      authorId: data?.authorId,
      videoKey: data?.videoKey,
      isSuccess: data?.isSuccess ?? true,
      ...(data && 'thumbnailKey' in data
        ? { thumbnailKey: data.thumbnailKey }
        : {}),
      ...(data?.nodeId !== undefined ? { nodeId: data.nodeId } : {}),
    });
  }
}
