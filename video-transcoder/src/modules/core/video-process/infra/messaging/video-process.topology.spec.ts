import { describe, expect, it } from 'vitest';
import {
  ExchangeType,
  TopologyRegistryService,
  TransportType,
} from '../../../messaging';
import {
  VIDEO_EVENTS_EXCHANGE,
  VIDEO_PROCESS_TOPOLOGY,
  VIDEO_TRANSCODE_DLX,
  VIDEO_TRANSCODE_DLQ,
  VIDEO_TRANSCODE_QUEUE,
  VIDEO_TRANSCODE_QUEUE_ARGUMENTS,
} from './video-process.topology';

describe('video process topology', () => {
  it('declares matching durable queue and dead-letter bindings', () => {
    expect(VIDEO_TRANSCODE_QUEUE_ARGUMENTS).toEqual({
      'x-dead-letter-exchange': 'video.transcode.dlx',
      'x-dead-letter-routing-key': 'video.transcode.dlq',
    });
    expect(VIDEO_PROCESS_TOPOLOGY.exchanges).toEqual([
      {
        name: VIDEO_EVENTS_EXCHANGE,
        type: ExchangeType.TOPIC,
        options: { durable: true },
      },
      {
        name: VIDEO_TRANSCODE_DLX,
        type: ExchangeType.DIRECT,
        options: { durable: true },
      },
    ]);
    expect(VIDEO_PROCESS_TOPOLOGY.queues).toEqual([
      {
        queueName: VIDEO_TRANSCODE_QUEUE,
        options: { durable: true, arguments: VIDEO_TRANSCODE_QUEUE_ARGUMENTS },
        queueBindings: [
          { exchange: VIDEO_EVENTS_EXCHANGE, routingKey: 'video.upload' },
        ],
      },
      {
        queueName: VIDEO_TRANSCODE_DLQ,
        options: { durable: true },
        queueBindings: [
          { exchange: VIDEO_TRANSCODE_DLX, routingKey: VIDEO_TRANSCODE_DLQ },
        ],
      },
    ]);
  });

  it('resolves both outcome events to their Redis streams', () => {
    const registry = new TopologyRegistryService();
    registry.register(VIDEO_PROCESS_TOPOLOGY);
    for (const eventType of [
      'video.process.failed',
      'video.process.completed',
    ]) {
      expect(registry.resolve(eventType)).toEqual([
        {
          transport: TransportType.REDIS_STREAM,
          destination: eventType,
          eventType,
        },
      ]);
    }
  });
});
