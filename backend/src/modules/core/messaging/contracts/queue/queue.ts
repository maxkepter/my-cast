import { DomainEvent } from '../../../../../common/domain/domain-event';
import type { QueueJobOptions } from '../../application/ports/queue.port';
import type { OutboxRes } from '../../dtos/res.dto';

export type { QueueJobOptions };

export const QUEUE_SERVICE = Symbol('QUEUE_SERVICE');

export interface QueueServiceContract {
  publish(
    event: DomainEvent,
    options?: QueueJobOptions,
    tx?: unknown,
  ): Promise<OutboxRes[]>;
  publishMany(
    events: DomainEvent[],
    options?: QueueJobOptions,
    tx?: unknown,
  ): Promise<OutboxRes[]>;
}
