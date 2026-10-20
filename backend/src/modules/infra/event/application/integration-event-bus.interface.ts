import { DomainEvent } from '../../../../common/domain/domain-event';

export interface IntegrationEventBus {
  publish(event: DomainEvent): Promise<void>;
}
