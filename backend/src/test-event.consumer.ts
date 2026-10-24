import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable, Inject, MessageEvent } from '@nestjs/common';
import { DomainEvent } from './common/domain/domain-event';
import {
  INTEGRATION_EVENT_BUS,
  IntegrationEventBus,
} from './modules/core/event/application/integration-event-bus.interface';
import { RedisStreamConsume } from './modules/core/event/infrastructure/redis-stream/decorators/redis-stream-consume.decorator';
import { RedisStreamHandle } from './modules/core/event/infrastructure/redis-stream/decorators/redis-stream-handle.decorator';

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
  private static readonly eventSubject = new Subject<any>();

  constructor(
    @Inject(INTEGRATION_EVENT_BUS)
    private readonly eventBus: IntegrationEventBus,
  ) {}

  async publish(message: string): Promise<string | null> {
    const event = new TestStreamEvent(message);
    return this.eventBus.publish(event);
  }

  @RedisStreamHandle(TestStreamEvent.EVENT_NAME)
  async handleTestEvent(payload: any): Promise<void> {
    console.log('Received Test Event:', payload);

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
