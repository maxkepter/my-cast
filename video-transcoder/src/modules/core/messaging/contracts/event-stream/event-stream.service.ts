import { Inject, Injectable } from '@nestjs/common';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import {
  OUTBOX_REPOSITORY,
  OutboxRepository,
} from '../../domain/repositories/outbox.repository.interface';
import { OutboxCreateReq } from '../../dtos/req.dto';
import { OutboxRes } from '../../dtos/res.dto';
import {
  TOPOLOGY_REGISTRY,
  TopologyRegistry,
  TransportType,
} from '../topology-registry/topology-registry';
import { EventStreamServiceContract } from './event-stream';

/** Public facade for persisting Redis Stream domain events into the transactional outbox. */
@Injectable()
export class EventStreamService implements EventStreamServiceContract {
  constructor(
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    @Inject(TOPOLOGY_REGISTRY)
    private readonly topologyRegistry: TopologyRegistry,
  ) {}

  publish(event: DomainEvent, tx?: unknown): Promise<OutboxRes[]> {
    return this.publishMany([event], tx);
  }

  async publishMany(
    events: DomainEvent[],
    tx?: unknown,
  ): Promise<OutboxRes[]> {
    if (events.length === 0) {
      return [];
    }

    const reqs: OutboxCreateReq[] = events.flatMap((event) => {
      const eventName = event.getEventName();
      const payload = event.serialize();
      const targets = this.topologyRegistry
        .resolve(eventName)
        .filter((target) => target.transport === TransportType.REDIS_STREAM);

      return targets.map((target) => ({
        eventId: event.id,
        eventType: eventName,
        payload,
        transport: target.transport,
        destination: target.destination,
      }));
    });

    if (reqs.length === 0) {
      return [];
    }

    return this.outboxRepository.saveMany(reqs, tx);
  }
}
