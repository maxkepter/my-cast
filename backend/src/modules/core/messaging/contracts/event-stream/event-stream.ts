import { DomainEvent } from '../../../../../common/domain/domain-event';
import type { OutboxRes } from '../../dtos/res.dto';

export const EVENT_STREAM_SERVICE = Symbol('EVENT_STREAM_SERVICE');

export interface EventStreamServiceContract {
  publish(event: DomainEvent, tx?: unknown): Promise<OutboxRes[]>;

  publishMany(events: DomainEvent[], tx?: unknown): Promise<OutboxRes[]>;
}
