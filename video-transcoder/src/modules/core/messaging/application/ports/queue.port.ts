import { DomainEvent } from '../../../../../common/domain/domain-event';

export interface QueueJobOptions {
  delayTime?: number;
  deplayTime?: number;
  attempts?: number;
  destination?: string;
}

export const QUEUE_PORT = Symbol('QUEUE_PORT');

export interface QueuePort {
  publish<T>(event: DomainEvent, options?: QueueJobOptions): Promise<void>;
  publishMany(events: DomainEvent[], options?: QueueJobOptions): Promise<void>;
}
