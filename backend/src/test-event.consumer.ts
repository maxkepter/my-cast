import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable, Inject, MessageEvent } from '@nestjs/common';
import { DomainEvent } from './common/domain/domain-event';
import {
  EVENT_STREAM_SERVICE,
  EventStreamServiceContract,
  RedisStreamConsume,
  RedisStreamHandle,
} from './modules/core/messaging';

export class TestStreamEvent extends DomainEvent {
  static readonly EVENT_NAME = 'test.event';

  constructor(public readonly message: string) {
    super();
  }

  getEventName(): string {
    return TestStreamEvent.EVENT_NAME;
  }
}

@Injectable()
@RedisStreamConsume({
  stream: 'test.event',
  group: 'test-group',
  consumerName: 'test-consumer-1',
})
export class TestEventConsumer {
  private static readonly eventSubject = new Subject<Record<string, unknown>>();

  constructor(
    @Inject(EVENT_STREAM_SERVICE)
    private readonly eventStreamService: EventStreamServiceContract,
  ) {}

  async publish(message: string): Promise<string | null> {
    const event = new TestStreamEvent(message);
    const outboxRows = await this.eventStreamService.publish(event);
    return outboxRows[0]?.eventId ?? event.id;
  }

  @RedisStreamHandle(TestStreamEvent.EVENT_NAME)
  async handleTestEvent(payload: Record<string, unknown>): Promise<void> {
    TestEventConsumer.eventSubject.next(payload);
  }

  getEventObservable(): Observable<MessageEvent> {
    return TestEventConsumer.eventSubject.asObservable().pipe(
      map(
        (data) =>
          ({
            data,
          }) as MessageEvent,
      ),
    );
  }
}
