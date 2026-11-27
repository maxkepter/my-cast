import { Inject, Injectable } from '@nestjs/common';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import { QueueJobOptions } from '../../application/ports/queue.port';
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
import { QueueServiceContract } from './queue';

/** Public facade for persisting RabbitMQ domain events into the transactional outbox. */
@Injectable()
export class QueueService implements QueueServiceContract {
  constructor(
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    @Inject(TOPOLOGY_REGISTRY)
    private readonly topologyRegistry: TopologyRegistry,
  ) {}

  publish(
    event: DomainEvent,
    options?: QueueJobOptions,
    tx?: unknown,
  ): Promise<OutboxRes[]> {
    return this.publishMany([event], options, tx);
  }

  async publishMany(
    events: DomainEvent[],
    _options?: QueueJobOptions,
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
        .filter((target) => target.transport === TransportType.RABBITMQ);

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
