import { describe, it, expect, vi, beforeEach } from 'vitest';
import Redis from 'ioredis';
import {
  RedisStreamEventBus,
  MAX_REDIS_STREAM_LENGTH,
} from './redis-stream-event-bus.service';
import { DomainEvent } from '../../../../../common/domain/domain-event';

class TestDomainEvent extends DomainEvent {
  static override readonly EVENT_NAME = 'test.event';

  constructor(public readonly data: string) {
    super();
  }

  override getEventName(): string {
    return TestDomainEvent.EVENT_NAME;
  }
}

describe('RedisStreamEventBus', () => {
  let service: RedisStreamEventBus;
  let redisMock: any;

  beforeEach(() => {
    redisMock = {
      xadd: vi.fn(),
    };
    service = new RedisStreamEventBus(redisMock as unknown as Redis);
  });

  it('should publish event to redis stream and return event id', async () => {
    const event = new TestDomainEvent('sample-payload');
    redisMock.xadd.mockResolvedValue('1700000000000-0');

    const result = await service.publish(event);

    expect(result).toBe('1700000000000-0');
    expect(redisMock.xadd).toHaveBeenCalledWith(
      'test.event',
      'MAXLEN',
      '~',
      MAX_REDIS_STREAM_LENGTH,
      '*',
      'event',
      'test.event',
      'payload',
      event.serialize(),
      'publishedAt',
      expect.any(String),
    );
  });
});
