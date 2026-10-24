import { DomainEvent } from '../../../../common/domain/domain-event';

export const INTEGRATION_EVENT_BUS = Symbol('INTEGRATION_EVENT_BUS');

export interface IntegrationEventBus {
  publish(event: DomainEvent): Promise<string | null>;
}

export const MockIntegrationEventBus: IntegrationEventBus = {
  publish: async (_event: DomainEvent): Promise<string | null> =>
    'mock-stream-msg-id-123',
};
