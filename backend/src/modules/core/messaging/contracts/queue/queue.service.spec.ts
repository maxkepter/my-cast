import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import { OutboxStatus } from '../../domain/enums/outbox-status.enum';
import { OutboxRepository } from '../../domain/repositories/outbox.repository.interface';
import { OutboxRes } from '../../dtos/res.dto';
import {
  TopologyRegistry,
  TransportType,
} from '../topology-registry/topology-registry';
import { QueueService } from './queue.service';

class TestQueueEvent extends DomainEvent {
  constructor(readonly name: string) {
    super();
  }

  getEventName(): string {
    return this.name;
  }
}

describe('QueueService', () => {
  let outboxRepository: OutboxRepository;
  let topologyRegistry: TopologyRegistry;
  let service: QueueService;

  const makeOutboxRes = (overrides?: Partial<OutboxRes>): OutboxRes => ({
    id: 'outbox-uuid-1',
    eventId: 'event-uuid-1',
    eventType: 'video.uploaded',
    payload: '{}',
    transport: TransportType.RABBITMQ,
    destination: 'mycast.events',
    status: OutboxStatus.PENDING,
    retryCount: 0,
    lastError: null,
    processedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    outboxRepository = {
      save: vi.fn(),
      saveMany: vi.fn().mockResolvedValue([]),
      markAsProcessed: vi.fn(),
      markAsFailed: vi.fn(),
      markByIdAsProcessed: vi.fn(),
      markByIdAsFailed: vi.fn(),
      claimPendingOutboxMessages: vi.fn(),
      getPendingOutboxMessages: vi.fn(),
      releaseStuckMessages: vi.fn(),
      deleteProcessedBefore: vi.fn(),
    };
    topologyRegistry = {
      register: vi.fn(),
      getExchanges: vi.fn().mockReturnValue([]),
      getQueues: vi.fn().mockReturnValue([]),
      resolve: vi.fn().mockReturnValue([]),
    };
    service = new QueueService(outboxRepository, topologyRegistry);
  });

  it('persists only RABBITMQ targets to outboxRepository with optional tx', async () => {
    const event = new TestQueueEvent('video.uploaded');
    const saved = [makeOutboxRes({ eventId: event.id })];
    const tx = { id: 'tx-1' };

    vi.mocked(topologyRegistry.resolve).mockReturnValue([
      {
        transport: TransportType.RABBITMQ,
        destination: 'mycast.events',
        eventType: 'video.uploaded',
      },
      {
        transport: TransportType.REDIS_STREAM,
        destination: 'video.stream',
        eventType: 'video.uploaded',
      },
    ]);
    vi.mocked(outboxRepository.saveMany).mockResolvedValue(saved);

    const result = await service.publish(event, { delayTime: 5000 }, tx);

    expect(topologyRegistry.resolve).toHaveBeenCalledWith('video.uploaded');
    expect(outboxRepository.saveMany).toHaveBeenCalledWith(
      [
        {
          eventId: event.id,
          eventType: 'video.uploaded',
          payload: event.serialize(),
          transport: TransportType.RABBITMQ,
          destination: 'mycast.events',
        },
      ],
      tx,
    );
    expect(result).toEqual(saved);
  });

  it('returns [] for empty events or when no RABBITMQ targets match', async () => {
    expect(await service.publishMany([])).toEqual([]);
    expect(outboxRepository.saveMany).not.toHaveBeenCalled();

    const event = new TestQueueEvent('stream.only');
    vi.mocked(topologyRegistry.resolve).mockReturnValue([
      {
        transport: TransportType.REDIS_STREAM,
        destination: 'video.stream',
        eventType: 'stream.only',
      },
    ]);

    expect(await service.publish(event)).toEqual([]);
    expect(outboxRepository.saveMany).not.toHaveBeenCalled();
  });

  it('persists multiple events in publishMany', async () => {
    const events = [
      new TestQueueEvent('video.uploaded'),
      new TestQueueEvent('video.transcoded'),
    ];
    const saved = [
      makeOutboxRes({ id: 'outbox-1', eventId: events[0].id }),
      makeOutboxRes({
        id: 'outbox-2',
        eventId: events[1].id,
        eventType: 'video.transcoded',
      }),
    ];

    vi.mocked(topologyRegistry.resolve).mockImplementation((name) => [
      {
        transport: TransportType.RABBITMQ,
        destination: 'mycast.events',
        eventType: name,
      },
    ]);
    vi.mocked(outboxRepository.saveMany).mockResolvedValue(saved);

    const result = await service.publishMany(events);

    expect(outboxRepository.saveMany).toHaveBeenCalledWith(
      [
        {
          eventId: events[0].id,
          eventType: 'video.uploaded',
          payload: events[0].serialize(),
          transport: TransportType.RABBITMQ,
          destination: 'mycast.events',
        },
        {
          eventId: events[1].id,
          eventType: 'video.transcoded',
          payload: events[1].serialize(),
          transport: TransportType.RABBITMQ,
          destination: 'mycast.events',
        },
      ],
      undefined,
    );
    expect(result).toEqual(saved);
  });
});
