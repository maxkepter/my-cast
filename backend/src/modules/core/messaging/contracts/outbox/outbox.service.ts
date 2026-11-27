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
} from '../topology-registry/topology-registry';
import { OutboxServiceContract } from './outbox';

/** Public facade for persisting and managing transactional outbox messages. */
@Injectable()
export class OutboxService implements OutboxServiceContract {
  constructor(
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    @Inject(TOPOLOGY_REGISTRY)
    private readonly topologyRegistry: TopologyRegistry,
  ) {}

  save(req: OutboxCreateReq, tx?: unknown): Promise<OutboxRes> {
    return this.outboxRepository.save(req, tx);
  }

  saveMany(reqs: OutboxCreateReq[], tx?: unknown): Promise<OutboxRes[]> {
    return this.outboxRepository.saveMany(reqs, tx);
  }

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
      const targets = this.topologyRegistry.resolve(eventName);

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

  markAsProcessed(eventId: string): Promise<OutboxRes | null> {
    return this.outboxRepository.markAsProcessed(eventId);
  }

  markAsFailed(eventId: string, error?: string): Promise<OutboxRes | null> {
    return this.outboxRepository.markAsFailed(eventId, error);
  }

  getPendingOutboxMessages(
    limit: number,
    maxRetryCount: number,
  ): Promise<OutboxRes[]> {
    return this.outboxRepository.getPendingOutboxMessages(limit, maxRetryCount);
  }

  releaseStuckMessages(olderThan: Date): Promise<number> {
    return this.outboxRepository.releaseStuckMessages(olderThan);
  }

  deleteProcessedBefore(date: Date): Promise<number> {
    return this.outboxRepository.deleteProcessedBefore(date);
  }
}
