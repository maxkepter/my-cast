import { DomainEvent } from '../../../../../common/domain/domain-event';

export const EVENT_STREAM_PORT = Symbol('EVENT_STREAM_PORT');

export interface EventStreamPort {
  publish(event: DomainEvent, destination?: string): Promise<string | null>;
  publishMany(events: DomainEvent[]): Promise<(string | null)[]>;
}
