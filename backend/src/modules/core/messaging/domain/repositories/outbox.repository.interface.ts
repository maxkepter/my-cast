import { OutboxCreateReq } from '../../dtos/req.dto';
import { OutboxRes } from '../../dtos/res.dto';

export const OUTBOX_REPOSITORY = Symbol('OUTBOX_REPOSITORY');
export interface OutboxRepository {
  save(req: OutboxCreateReq, tx?: unknown): Promise<OutboxRes>;
  saveMany(reqs: OutboxCreateReq[], tx?: unknown): Promise<OutboxRes[]>;

  markAsProcessed(eventId: string): Promise<OutboxRes | null>;
  markAsFailed(eventId: string, error?: string): Promise<OutboxRes | null>;

  markByIdAsProcessed(id: string, tx?: unknown): Promise<OutboxRes | null>;
  markByIdAsFailed(
    id: string,
    error?: string,
    tx?: unknown,
  ): Promise<OutboxRes | null>;

  claimPendingOutboxMessages(
    limit: number,
    maxRetryCount?: number,
    tx?: unknown,
  ): Promise<OutboxRes[]>;

  getPendingOutboxMessages(
    limit: number,
    maxRetryCount: number,
  ): Promise<OutboxRes[]>;

  releaseStuckMessages(olderThan: Date): Promise<number>;

  deleteProcessedBefore(date: Date): Promise<number>;
}
