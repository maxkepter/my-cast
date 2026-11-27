import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import {
  TopologyRegistry,
  TransportType,
} from '../../contracts/topology-registry/topology-registry';
import { RabbitmqQueueAdapter } from './rabbitmq-queue.adapter';

class TestVideoUploadedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'video.uploaded';

  constructor(readonly videoId: string) {
    super();
  }

  getEventName(): string {
    return TestVideoUploadedEvent.EVENT_NAME;
  }
}

describe('RabbitmqQueueAdapter', () => {
  let adapter: RabbitmqQueueAdapter;
  let amqpConnection: { publish: ReturnType<typeof vi.fn> };
  let topologyRegistry: {
    resolve: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    getExchanges: ReturnType<typeof vi.fn>;
    getQueues: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    amqpConnection = {
      publish: vi.fn().mockResolvedValue(true),
    };
    topologyRegistry = {
      resolve: vi.fn().mockReturnValue([]),
      register: vi.fn(),
      getExchanges: vi.fn().mockReturnValue([]),
      getQueues: vi.fn().mockReturnValue([]),
    };

    adapter = new RabbitmqQueueAdapter(
      amqpConnection as unknown as AmqpConnection,
      topologyRegistry as unknown as TopologyRegistry,
    );
  });

  it('publishes to resolved RabbitMQ exchange targets and ignores non-RabbitMQ targets', async () => {
    const event = new TestVideoUploadedEvent('vid-1');
    topologyRegistry.resolve.mockReturnValue([
      {
        transport: TransportType.RABBITMQ,
        destination: 'video.exchange',
        eventType: 'video.uploaded',
      },
      {
        transport: TransportType.REDIS_STREAM,
        destination: 'video.stream',
        eventType: 'video.uploaded',
      },
    ]);

    await adapter.publish(event);

    expect(topologyRegistry.resolve).toHaveBeenCalledWith('video.uploaded');
    expect(amqpConnection.publish).toHaveBeenCalledTimes(1);
    expect(amqpConnection.publish).toHaveBeenCalledWith(
      'video.exchange',
      'video.uploaded',
      JSON.parse(event.serialize()),
    );
  });

  it('publishes to multiple RabbitMQ targets when multiple routes match', async () => {
    const event = new TestVideoUploadedEvent('vid-2');
    topologyRegistry.resolve.mockReturnValue([
      {
        transport: TransportType.RABBITMQ,
        destination: 'video.exchange',
        eventType: 'video.uploaded',
      },
      {
        transport: TransportType.RABBITMQ,
        destination: 'analytics.exchange',
        eventType: 'video.uploaded',
      },
    ]);

    await adapter.publish(event);

    expect(amqpConnection.publish).toHaveBeenCalledTimes(2);
    expect(amqpConnection.publish).toHaveBeenNthCalledWith(
      1,
      'video.exchange',
      'video.uploaded',
      JSON.parse(event.serialize()),
    );
    expect(amqpConnection.publish).toHaveBeenNthCalledWith(
      2,
      'analytics.exchange',
      'video.uploaded',
      JSON.parse(event.serialize()),
    );
  });

  it('falls back to default exchange when no RabbitMQ routes are registered', async () => {
    const event = new TestVideoUploadedEvent('vid-3');
    topologyRegistry.resolve.mockReturnValue([]);

    await adapter.publish(event);

    expect(amqpConnection.publish).toHaveBeenCalledTimes(1);
    expect(amqpConnection.publish).toHaveBeenCalledWith(
      '',
      'video.uploaded',
      JSON.parse(event.serialize()),
    );
  });

  it('passes x-delay header when options.delayTime is provided', async () => {
    const event = new TestVideoUploadedEvent('vid-4');
    topologyRegistry.resolve.mockReturnValue([
      {
        transport: TransportType.RABBITMQ,
        destination: 'video.delayed',
        eventType: 'video.uploaded',
      },
    ]);

    await adapter.publish(event, { delayTime: 5000 });

    expect(amqpConnection.publish).toHaveBeenCalledWith(
      'video.delayed',
      'video.uploaded',
      JSON.parse(event.serialize()),
      { headers: { 'x-delay': 5000 } },
    );
  });

  it('supports legacy options.deplayTime and prefers delayTime when both are provided', async () => {
    const event = new TestVideoUploadedEvent('vid-5');
    topologyRegistry.resolve.mockReturnValue([]);

    await adapter.publish(event, { deplayTime: 2500 });
    expect(amqpConnection.publish).toHaveBeenLastCalledWith(
      '',
      'video.uploaded',
      JSON.parse(event.serialize()),
      { headers: { 'x-delay': 2500 } },
    );

    await adapter.publish(event, { delayTime: 0, deplayTime: 2500 });
    expect(amqpConnection.publish).toHaveBeenLastCalledWith(
      '',
      'video.uploaded',
      JSON.parse(event.serialize()),
      { headers: { 'x-delay': 0 } },
    );
  });

  it('publishMany skips publishing when events array is empty', async () => {
    await adapter.publishMany([]);

    expect(topologyRegistry.resolve).not.toHaveBeenCalled();
    expect(amqpConnection.publish).not.toHaveBeenCalled();
  });

  it('publishMany publishes each event with options and default exchange fallback', async () => {
    const event1 = new TestVideoUploadedEvent('vid-6');
    const event2 = new TestVideoUploadedEvent('vid-7');
    topologyRegistry.resolve
      .mockReturnValueOnce([
        {
          transport: TransportType.RABBITMQ,
          destination: 'video.exchange',
          eventType: 'video.uploaded',
        },
      ])
      .mockReturnValueOnce([]);

    await adapter.publishMany([event1, event2], { delayTime: 1500 });

    expect(amqpConnection.publish).toHaveBeenCalledTimes(2);
    expect(amqpConnection.publish).toHaveBeenNthCalledWith(
      1,
      'video.exchange',
      'video.uploaded',
      JSON.parse(event1.serialize()),
      { headers: { 'x-delay': 1500 } },
    );
    expect(amqpConnection.publish).toHaveBeenNthCalledWith(
      2,
      '',
      'video.uploaded',
      JSON.parse(event2.serialize()),
      { headers: { 'x-delay': 1500 } },
    );
  });

  it('publishes directly to options.destination without consulting TopologyRegistry when provided', async () => {
    const event = new TestVideoUploadedEvent('vid-8');

    await adapter.publish(event, { destination: 'targeted.exchange' });

    expect(topologyRegistry.resolve).not.toHaveBeenCalled();
    expect(amqpConnection.publish).toHaveBeenCalledTimes(1);
    expect(amqpConnection.publish).toHaveBeenCalledWith(
      'targeted.exchange',
      'video.uploaded',
      JSON.parse(event.serialize()),
    );
  });
});
