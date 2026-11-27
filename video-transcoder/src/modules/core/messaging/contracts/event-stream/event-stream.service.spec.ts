import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import { OutboxStatus } from '../../domain/enums/outbox-status.enum';
import { OutboxRepository } from '../../domain/repositories/outbox.repository.interface';
import { OutboxRes } from '../../dtos/res.dto';
import {
  TopologyRegistry,
  TransportType,
} from '../topology-registry/topology-registry';
import { EventStreamService } from './event-stream.service';

class TestStreamEvent extends DomainEvent {
  constructor(readonly name: string) {
    super();
  }

  getEventName(): string {
    return this.name;
  }
}

describe('EventStreamService', () => {
  let outboxRepository: OutboxRepository;
  let topologyRegistry: TopologyRegistry;
  let service: EventStreamService;

  const makeOutboxRes = (overrides?: Partial<OutboxRes>): OutboxRes => ({
    id: 'outbox-uuid-1',
    eventId: 'event-uuid-1',
    eventType: 'stream.started',
    payload: '{}',
    transport: TransportType.REDIS_STREAM,
    destination: 'video.stream',
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
    service = new EventStreamService(outboxRepository, topologyRegistry);
  });

  it('persists only REDIS_STREAM targets to outboxRepository with optional tx', async () => {
    const event = new TestStreamEvent('stream.started');
    const saved = [makeOutboxRes({ eventId: event.id })];
    const tx = { id: 'tx-1' };

    vi.mocked(topologyRegistry.resolve).mockReturnValue([
      {
        transport: TransportType.REDIS_STREAM,
        destination: 'video.stream',
        eventType: 'stream.started',
      },
      {
        transport: TransportType.RABBITMQ,
        destination: 'mycast.events',
        eventType: 'stream.started',
      },
    ]);
    vi.mocked(outboxRepository.saveMany).mockResolvedValue(saved);

    const result = await service.publish(event, tx);

    expect(topologyRegistry.resolve).toHaveBeenCalledWith('stream.started');
    expect(outboxRepository.saveMany).toHaveBeenCalledWith(
      [
        {
          eventId: event.id,
          eventType: 'stream.started',
          payload: event.serialize(),
          transport: TransportType.REDIS_STREAM,
          destination: 'video.stream',
        },
      ],
      tx,
    );
    expect(result).toEqual(saved);
  });

  it('returns [] for empty events or when no REDIS_STREAM targets match', async () => {
    expect(await service.publishMany([])).toEqual([]);
    expect(outboxRepository.saveMany).not.toHaveBeenCalled();

    const event = new TestStreamEvent('queue.only');
    vi.mocked(topologyRegistry.resolve).mockReturnValue([
      {
        transport: TransportType.RABBITMQ,
        destination: 'mycast.events',
        eventType: 'queue.only',
      },
    ]);

    expect(await service.publish(event)).toEqual([]);
    expect(outboxRepository.saveMany).not.toHaveBeenCalled();
  });

  it('persists multiple events in publishMany', async () => {
    const events = [
      new TestStreamEvent('stream.started'),
      new TestStreamEvent('stream.ended'),
    ];
    const saved = [
      makeOutboxRes({ id: 'outbox-1', eventId: events[0].id }),
      makeOutboxRes({
        id: 'outbox-2',
        eventId: events[1].id,
        eventType: 'stream.ended',
      }),
    ];

    vi.mocked(topologyRegistry.resolve).mockImplementation((name) => [
      {
        transport: TransportType.REDIS_STREAM,
        destination: 'video.stream',
        eventType: name,
      },
    ]);
    vi.mocked(outboxRepository.saveMany).mockResolvedValue(saved);

    const result = await service.publishMany(events);

    expect(outboxRepository.saveMany).toHaveBeenCalledWith(
      [
        {
          eventId: events[0].id,
          eventType: 'stream.started',
          payload: events[0].serialize(),
          transport: TransportType.REDIS_STREAM,
          destination: 'video.stream',
        },
        {
          eventId: events[1].id,
          eventType: 'stream.ended',
          payload: events[1].serialize(),
          transport: TransportType.REDIS_STREAM,
          destination: 'video.stream',
        },
      ],
      undefined,
    );
    expect(result).toEqual(saved);
  });
});
