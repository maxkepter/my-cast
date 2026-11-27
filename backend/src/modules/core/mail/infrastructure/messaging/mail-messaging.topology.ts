import {
  ExchangeType,
  ModuleTopology,
} from '../../../messaging';
import { UserRegisteredEvent } from '../../../../features/auth/domain/events/user-registered.event';
import { UserCreatedEvent } from '../../../../features/user/domain/events/user-created.event';

export const MAIL_MESSAGING_TOPOLOGY: ModuleTopology = {
  exchanges: [
    {
      name: 'user.events',
      type: ExchangeType.TOPIC,
      options: { durable: true },
    },
  ],
  queues: [
    {
      queueName: 'mail.user-registered.queue',
      options: { durable: true },
      queueBindings: [
        {
          exchange: 'user.events',
          routingKey: UserRegisteredEvent.EVENT_NAME,
        },
      ],
    },
    {
      queueName: 'mail.user-created.queue',
      options: { durable: true },
      queueBindings: [
        {
          exchange: 'user.events',
          routingKey: UserCreatedEvent.EVENT_NAME,
        },
      ],
    },
  ],
};
