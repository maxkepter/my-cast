import { describe, it, expect, vi, beforeEach } from 'vitest';
import Redis from 'ioredis';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import {
  TopologyRegistry,
  TransportType,
} from '../../contracts/topology-registry/topology-registry';
import { RedisEventStreamAdapter } from './redis-event-stream.adapter';

class TestPodcastPublishedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'podcast.published';

  constructor(readonly podcastId: string) {
    super();
  }

  getEventName(): string {
    return TestPodcastPublishedEvent.EVENT_NAME;
  }
}

describe('RedisEventStreamAdapter', () => {
  let adapter: RedisEventStreamAdapter;
  let redis: { xadd: ReturnType<typeof vi.fn> };
  let topologyRegistry: {
    resolve: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    getExchanges: ReturnType<typeof vi.fn>;
    getQueues: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    redis = {
      xadd: vi.fn().mockResolvedValue('1700000000000-0'),
    };
    topologyRegistry = {
      resolve: vi.fn().mockReturnValue([]),
      register: vi.fn(),
      getExchanges: vi.fn().mockReturnValue([]),
      getQueues: vi.fn().mockReturnValue([]),
    };

    adapter = new RedisEventStreamAdapter(
      redis as unknown as Redis,
      topologyRegistry as unknown as TopologyRegistry,
    );
  });

  it('publishes to resolved Redis Stream targets and ignores non-Redis targets', async () => {
    const event = new TestPodcastPublishedEvent('pod-1');
    topologyRegistry.resolve.mockReturnValue([
      {
        transport: TransportType.REDIS_STREAM,
        destination: 'stream:podcasts',
        eventType: 'podcast.published',
      },
      {
        transport: TransportType.RABBITMQ,
        destination: 'podcast.exchange',
        eventType: 'podcast.published',
      },
    ]);

    const result = await adapter.publish(event);

    expect(result).toBe('1700000000000-0');
    expect(topologyRegistry.resolve).toHaveBeenCalledWith('podcast.published');
    expect(redis.xadd).toHaveBeenCalledTimes(1);
    expect(redis.xadd).toHaveBeenCalledWith(
      'stream:podcasts',
      'MAXLEN',
      '~',
      10000,
      '*',
      'eventId',
      event.id,
      'event',
      'podcast.published',
      'payload',
      event.serialize(),
      'publishedAt',
      expect.any(String),
    );
  });

  it('publishes to multiple stream targets and returns the last entry ID', async () => {
    const event = new TestPodcastPublishedEvent('pod-2');
    topologyRegistry.resolve.mockReturnValue([
      {
        transport: TransportType.REDIS_STREAM,
        destination: 'stream:podcasts',
        eventType: 'podcast.published',
      },
      {
        transport: TransportType.REDIS_STREAM,
        destination: 'stream:audit',
        eventType: 'podcast.published',
      },
    ]);
    redis.xadd
      .mockResolvedValueOnce('1700000000001-0')
      .mockResolvedValueOnce('1700000000002-0');

    const result = await adapter.publish(event);

    expect(result).toBe('1700000000002-0');
    expect(redis.xadd).toHaveBeenCalledTimes(2);
    expect(redis.xadd).toHaveBeenNthCalledWith(
      1,
      'stream:podcasts',
      'MAXLEN',
      '~',
      10000,
      '*',
      'eventId',
      event.id,
      'event',
      'podcast.published',
      'payload',
      event.serialize(),
      'publishedAt',
      expect.any(String),
    );
    expect(redis.xadd).toHaveBeenNthCalledWith(
      2,
      'stream:audit',
      'MAXLEN',
      '~',
      10000,
      '*',
      'eventId',
      event.id,
      'event',
      'podcast.published',
      'payload',
      event.serialize(),
      'publishedAt',
      expect.any(String),
    );
  });

  it('falls back to event name as stream key when no Redis Stream routes are registered', async () => {
    const event = new TestPodcastPublishedEvent('pod-3');
    topologyRegistry.resolve.mockReturnValue([]);

    const result = await adapter.publish(event);

    expect(result).toBe('1700000000000-0');
    expect(redis.xadd).toHaveBeenCalledTimes(1);
    expect(redis.xadd).toHaveBeenCalledWith(
      'podcast.published',
      'MAXLEN',
      '~',
      10000,
      '*',
      'eventId',
      event.id,
      'event',
      'podcast.published',
      'payload',
      event.serialize(),
      'publishedAt',
      expect.any(String),
    );
  });

  it('returns null when redis.xadd returns null', async () => {
    const event = new TestPodcastPublishedEvent('pod-4');
    redis.xadd.mockResolvedValueOnce(null);

    const result = await adapter.publish(event);

    expect(result).toBeNull();
  });

  it('publishMany returns empty array when events array is empty', async () => {
    const result = await adapter.publishMany([]);

    expect(result).toEqual([]);
    expect(topologyRegistry.resolve).not.toHaveBeenCalled();
    expect(redis.xadd).not.toHaveBeenCalled();
  });

  it('publishMany publishes each event and returns entry IDs with event name fallback', async () => {
    const event1 = new TestPodcastPublishedEvent('pod-5');
    const event2 = new TestPodcastPublishedEvent('pod-6');
    topologyRegistry.resolve
      .mockReturnValueOnce([
        {
          transport: TransportType.REDIS_STREAM,
          destination: 'stream:podcasts',
          eventType: 'podcast.published',
        },
      ])
      .mockReturnValueOnce([]);
    redis.xadd
      .mockResolvedValueOnce('1700000000010-0')
      .mockResolvedValueOnce('1700000000011-0');

    const result = await adapter.publishMany([event1, event2]);

    expect(result).toEqual(['1700000000010-0', '1700000000011-0']);
    expect(redis.xadd).toHaveBeenCalledTimes(2);
    expect(redis.xadd).toHaveBeenNthCalledWith(
      1,
      'stream:podcasts',
      'MAXLEN',
      '~',
      10000,
      '*',
      'eventId',
      event1.id,
      'event',
      'podcast.published',
      'payload',
      event1.serialize(),
      'publishedAt',
      expect.any(String),
    );
    expect(redis.xadd).toHaveBeenNthCalledWith(
      2,
      'podcast.published',
      'MAXLEN',
      '~',
      10000,
      '*',
      'eventId',
      event2.id,
      'event',
      'podcast.published',
      'payload',
      event2.serialize(),
      'publishedAt',
      expect.any(String),
    );
  });

  it('publishes directly to explicit destination stream key without consulting TopologyRegistry', async () => {
    const event = new TestPodcastPublishedEvent('pod-7');

    const result = await adapter.publish(event, 'stream:explicit');

    expect(result).toBe('1700000000000-0');
    expect(topologyRegistry.resolve).not.toHaveBeenCalled();
    expect(redis.xadd).toHaveBeenCalledTimes(1);
    expect(redis.xadd).toHaveBeenCalledWith(
      'stream:explicit',
      'MAXLEN',
      '~',
      10000,
      '*',
      'eventId',
      event.id,
      'event',
      'podcast.published',
      'payload',
      event.serialize(),
      'publishedAt',
      expect.any(String),
    );
  });
});
