import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DomainEvent } from '../../../../common/domain/domain-event';
import { IntegrationEventBus } from '../application/integration-event-bus.interface';
import { MAX_REDIS_STREAM_LENGTH } from './constant';

@Injectable()
export class RedisStreamService implements IntegrationEventBus {
  constructor(private readonly redisClient: Redis) {}

  async publish(event: DomainEvent): Promise<string | null> {
    const eventId = this.redisClient.xadd(
      event.getEventName(),
      'MAXLEN',
      '~',
      MAX_REDIS_STREAM_LENGTH,
      '*',
      'event',
      event.getEventName(),
      'payload',
      event.serialize(),
      'publishedAt',
      Date.now().toString(),
    );

    return eventId;
  }
}
