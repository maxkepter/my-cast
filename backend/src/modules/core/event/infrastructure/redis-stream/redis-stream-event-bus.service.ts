import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import { IntegrationEventBus } from '../../application/integration-event-bus.interface';

export const MAX_REDIS_STREAM_LENGTH = 10000;

@Injectable()
export class RedisStreamEventBus implements IntegrationEventBus {
  constructor(private readonly redisClient: Redis) {}

  async publish(event: DomainEvent): Promise<string | null> {
    const eventId = await this.redisClient.xadd(
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
