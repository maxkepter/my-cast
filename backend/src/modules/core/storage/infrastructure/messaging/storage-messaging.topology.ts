import {
  ExchangeType,
  ModuleTopology,
  TransportType,
} from '../../../messaging';
import { DeleteStorageEvent } from '../../domain/events/delete-storage.event';

export const STORAGE_MESSAGING_TOPOLOGY: ModuleTopology = {
  exchanges: [
    {
      name: 'storage.events',
      type: ExchangeType.TOPIC,
      options: { durable: true },
    },
  ],
  routes: [
    {
      transport: TransportType.RABBITMQ,
      destination: 'storage.events',
      eventType: DeleteStorageEvent.EVENT_NAME,
    },
  ],
  queues: [
    {
      queueName: 'storage.delete.queue',
      options: { durable: true },
      queueBindings: [
        {
          exchange: 'storage.events',
          routingKey: DeleteStorageEvent.EVENT_NAME,
        },
      ],
    },
  ],
};
