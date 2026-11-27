import {
  ExchangeType,
  ModuleTopology,
  TransportType,
} from '../../../../core/messaging';
import { UserCreatedEvent } from '../../../user/domain/events/user-created.event';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';

export const AUTH_MESSAGING_TOPOLOGY: ModuleTopology = {
  exchanges: [
    {
      name: 'user.events',
      type: ExchangeType.TOPIC,
      options: { durable: true },
    },
  ],
  routes: [
    {
      eventType: UserCreatedEvent.EVENT_NAME,
      transport: TransportType.RABBITMQ,
      destination: 'user.events',
    },
    {
      eventType: UserRegisteredEvent.EVENT_NAME,
      transport: TransportType.RABBITMQ,
      destination: 'user.events',
    },
  ],
};
