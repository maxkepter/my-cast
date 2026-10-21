import { EventHandler } from '../../../../common/application/event/event-handler.interface';
import { DomainEvent } from '../../../../common/domain/domain-event';

export abstract class RedisStreamHandler implements EventHandler<DomainEvent> {
  handle(data: DomainEvent): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
