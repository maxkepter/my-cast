import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import { EventStreamPort } from '../../application/ports/event-stream.port';
import {
  TOPOLOGY_REGISTRY,
  TopologyRegistry,
  TransportType,
} from '../../contracts/topology-registry/topology-registry';

const STREAM_MAX_LEN = 10000;

@Injectable()
export class RedisEventStreamAdapter implements EventStreamPort {
  constructor(
    private readonly redis: Redis,
    @Inject(TOPOLOGY_REGISTRY)
    private readonly topologyRegistry: TopologyRegistry,
  ) {}

  async publish(
    event: DomainEvent,
    destination?: string,
  ): Promise<string | null> {
    const eventName = event.getEventName();
    const streamKeys =
      destination !== undefined
        ? [destination]
        : (() => {
            const targets = this.topologyRegistry
              .resolve(eventName)
              .filter(
                (target) => target.transport === TransportType.REDIS_STREAM,
              );
            return targets.length > 0
              ? targets.map((target) => target.destination)
              : [eventName];
          })();

    const serializedPayload = event.serialize();
    const publishedAt = Date.now().toString();
    let lastEntryId: string | null = null;

    for (const streamKey of streamKeys) {
      const entryId = await this.redis.xadd(
        streamKey,
        'MAXLEN',
        '~',
        STREAM_MAX_LEN,
        '*',
        'eventId',
        event.id,
        'event',
        eventName,
        'payload',
        serializedPayload,
        'publishedAt',
        publishedAt,
      );
      lastEntryId = entryId;
    }

    return lastEntryId;
  }

  async publishMany(events: DomainEvent[]): Promise<(string | null)[]> {
    if (events.length === 0) {
      return [];
    }

    const entryIds: (string | null)[] = [];
    for (const event of events) {
      entryIds.push(await this.publish(event));
    }
    return entryIds;
  }
}
