import { Injectable, MessageEvent, OnModuleDestroy } from '@nestjs/common';
import {
  Observable,
  Subject,
  concat,
  finalize,
  interval,
  map,
  merge,
  of,
  takeUntil,
} from 'rxjs';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import {
  VideoStatusEventDto,
  VideoStatusSseEventType,
} from '../../dtos/res.dto';

export interface VideoStatusSnapshot {
  videoId: string;
  status: VideoStatus;
  reason?: string | null;
  message?: string;
  errorCode?: string | null;
  updatedAt?: string;
}

const HEARTBEAT_INTERVAL_MS = 20_000;

@Injectable()
export class VideoStatusStreamService implements OnModuleDestroy {
  private readonly streams = new Map<string, Subject<VideoStatusEventDto>>();

  emitStatus(payload: VideoStatusEventDto): void {
    const normalized = new VideoStatusEventDto();
    normalized.videoId = payload.videoId;
    normalized.status = payload.status;
    normalized.event = payload.event ?? this.mapStatusToEventType(payload.status);
    normalized.message = payload.message;
    normalized.reason = payload.reason;
    normalized.errorCode = payload.errorCode;
    normalized.updatedAt = payload.updatedAt ?? new Date().toISOString();

    const subject = this.streams.get(payload.videoId);
    if (!subject) {
      return;
    }

    subject.next(normalized);

    if (this.isTerminalStatus(normalized.status)) {
      subject.complete();
      this.streams.delete(payload.videoId);
    }
  }

  createStream(
    videoId: string,
    initialSnapshot: VideoStatusSnapshot,
  ): Observable<MessageEvent> {
    const initialEvent: VideoStatusEventDto = {
      videoId,
      status: initialSnapshot.status,
      event: this.mapStatusToEventType(initialSnapshot.status),
      reason: initialSnapshot.reason ?? null,
      message:
        initialSnapshot.message ??
        this.defaultMessageForStatus(
          initialSnapshot.status,
          initialSnapshot.reason,
        ),
      errorCode: initialSnapshot.errorCode ?? null,
      updatedAt: initialSnapshot.updatedAt ?? new Date().toISOString(),
    };

    if (this.isTerminalStatus(initialSnapshot.status)) {
      return of(this.toMessageEvent(initialEvent));
    }

    const subject = this.getOrCreateSubject(videoId);
    const done$ = new Subject<void>();

    const live$ = subject.asObservable().pipe(
      map((dto) => this.toMessageEvent(dto)),
      finalize(() => {
        done$.next();
        done$.complete();
      }),
    );

    const heartbeat$ = interval(HEARTBEAT_INTERVAL_MS).pipe(
      takeUntil(done$),
      map(
        () =>
          ({
            type: 'heartbeat',
            data: 'keepalive',
          }) as MessageEvent,
      ),
    );

    return concat(
      of(this.toMessageEvent(initialEvent)),
      merge(live$, heartbeat$),
    );
  }

  onModuleDestroy(): void {
    for (const subject of this.streams.values()) {
      subject.complete();
    }
    this.streams.clear();
  }

  private getOrCreateSubject(videoId: string): Subject<VideoStatusEventDto> {
    let subject = this.streams.get(videoId);
    if (!subject) {
      subject = new Subject<VideoStatusEventDto>();
      this.streams.set(videoId, subject);
    }
    return subject;
  }

  private isTerminalStatus(status: VideoStatus): boolean {
    return status === VideoStatus.PROCESSED || status === VideoStatus.FAILED;
  }

  private mapStatusToEventType(status: VideoStatus): VideoStatusSseEventType {
    if (status === VideoStatus.FAILED) return 'failed';
    if (status === VideoStatus.PROCESSED) return 'completed';
    if (status === VideoStatus.PROCESSING) return 'processing';
    return 'status';
  }

  private defaultMessageForStatus(
    status: VideoStatus,
    reason?: string | null,
  ): string {
    switch (status) {
      case VideoStatus.UPLOADING:
        return 'Waiting for video upload';
      case VideoStatus.UPLOADED:
        return 'Video uploaded and queued for processing';
      case VideoStatus.PROCESSING:
        return 'Video transcoding in progress';
      case VideoStatus.PROCESSED:
        return 'Video processing completed';
      case VideoStatus.FAILED:
        return reason || 'Video processing failed';
    }
  }

  private toMessageEvent(dto: VideoStatusEventDto): MessageEvent {
    return {
      type: dto.event ?? this.mapStatusToEventType(dto.status),
      data: dto,
    } as MessageEvent;
  }
}
