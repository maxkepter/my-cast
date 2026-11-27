import { DomainEvent } from '../../../../../common/domain/domain-event';
import { OutboxCreateReq } from '../../dtos/req.dto';
import { OutboxRes } from '../../dtos/res.dto';

export const OUTBOX_SERVICE = Symbol('OUTBOX_SERVICE');

export interface OutboxServiceContract {
  save(req: OutboxCreateReq, tx?: unknown): Promise<OutboxRes>;

  saveMany(reqs: OutboxCreateReq[], tx?: unknown): Promise<OutboxRes[]>;

  publish(event: DomainEvent, tx?: unknown): Promise<OutboxRes[]>;

  publishMany(events: DomainEvent[], tx?: unknown): Promise<OutboxRes[]>;

  markAsProcessed(eventId: string): Promise<OutboxRes | null>;

  markAsFailed(eventId: string, error?: string): Promise<OutboxRes | null>;

  getPendingOutboxMessages(
    limit: number,
    maxRetryCount: number,
  ): Promise<OutboxRes[]>;

  releaseStuckMessages(olderThan: Date): Promise<number>;

  deleteProcessedBefore(date: Date): Promise<number>;
}
