import { describe, it, expect, beforeEach } from 'vitest';
import { TopologyRegistryService } from './topology-registry.service';
import { ExchangeType, TransportType } from './topology-registry';

describe('TopologyRegistryService', () => {
  let service: TopologyRegistryService;

  beforeEach(() => {
    service = new TopologyRegistryService();
  });

  it('registers exchanges, queues, and resolves routes by eventName', () => {
    service.register({
      exchanges: [{ name: 'mycast.events', type: ExchangeType.TOPIC }],
      queues: [
        {
          queueName: 'video.transcode',
          queueBindings: [
            { exchange: 'mycast.events', routingKey: 'video.uploaded' },
          ],
        },
      ],
      routes: [
        {
          transport: TransportType.RABBITMQ,
          destination: 'mycast.events',
          eventType: 'video.uploaded',
        },
        {
          transport: TransportType.REDIS_STREAM,
          destination: 'stream:video',
          eventType: 'video.uploaded',
        },
      ],
    });

    expect(service.getExchanges()).toEqual([
      { name: 'mycast.events', type: ExchangeType.TOPIC },
    ]);
    expect(service.resolve('video.uploaded')).toHaveLength(2);
    expect(service.resolve('unknown.event')).toEqual([]);
  });

  it('deduplicates identical routes and throws on conflicting exchange types', () => {
    const route = {
      transport: TransportType.RABBITMQ,
      destination: 'mycast.events',
      eventType: 'user.created',
    };

    service.register({
      exchanges: [{ name: 'mycast.events', type: ExchangeType.TOPIC }],
      routes: [route],
    });
    service.register({
      exchanges: [{ name: 'mycast.events', type: ExchangeType.TOPIC }],
      routes: [route],
    });

    expect(service.resolve('user.created')).toHaveLength(1);

    expect(() =>
      service.register({
        exchanges: [{ name: 'mycast.events', type: ExchangeType.FANOUT }],
      }),
    ).toThrow(/already registered/);
  });
});
