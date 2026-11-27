import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import { OutboxRepository } from '../../domain/repositories/outbox.repository.interface';
import { OutboxStatus } from '../../domain/enums/outbox-status.enum';
import { OutboxCreateReq } from '../../dtos/req.dto';
import { OutboxRes } from '../../dtos/res.dto';
import {
  TopologyRegistry,
  TransportType,
} from '../topology-registry/topology-registry';
import { OutboxService } from './outbox.service';

class TestVideoUploadedEvent extends DomainEvent {
  constructor(readonly videoId: string) {
    super();
  }

  getEventName(): string {
    return 'video.uploaded';
  }
}

class TestUserCreatedEvent extends DomainEvent {
  constructor(readonly userId: string) {
    super();
  }

  getEventName(): string {
    return 'user.created';
  }
}

describe('OutboxService', () => {
  let outboxRepository: OutboxRepository;
  let topologyRegistry: TopologyRegistry;
  let service: OutboxService;

  const makeOutboxRes = (overrides: Partial<OutboxRes> = {}): OutboxRes => ({
    id: 'outbox-uuid-1',
    eventId: '11111111-1111-1111-1111-111111111111',
    eventType: 'video.uploaded',
    payload: '{}',
    transport: TransportType.RABBITMQ,
    destination: 'mycast.events',
    status: OutboxStatus.PENDING,
    retryCount: 0,
    lastError: null,
    processedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    outboxRepository = {
      save: vi.fn(),
      saveMany: vi.fn(),
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
      getExchanges: vi.fn(),
      getQueues: vi.fn(),
      resolve: vi.fn(),
    };
    service = new OutboxService(outboxRepository, topologyRegistry);
  });

  it('delegates save, saveMany, and lifecycle methods to outboxRepository', async () => {
    const req: OutboxCreateReq = {
      eventId: '11111111-1111-1111-1111-111111111111',
      eventType: 'video.uploaded',
      payload: '{"videoId":"v1"}',
      transport: TransportType.RABBITMQ,
      destination: 'mycast.events',
    };
    const res = makeOutboxRes();
    const tx = { id: 'tx-1' };
    const date = new Date('2026-01-02T00:00:00Z');

    vi.mocked(outboxRepository.save).mockResolvedValue(res);
    vi.mocked(outboxRepository.saveMany).mockResolvedValue([res]);
    vi.mocked(outboxRepository.markAsProcessed).mockResolvedValue(res);
    vi.mocked(outboxRepository.markAsFailed).mockResolvedValue(res);
    vi.mocked(outboxRepository.getPendingOutboxMessages).mockResolvedValue([
      res,
    ]);
    vi.mocked(outboxRepository.releaseStuckMessages).mockResolvedValue(2);
    vi.mocked(outboxRepository.deleteProcessedBefore).mockResolvedValue(5);

    expect(await service.save(req, tx)).toEqual(res);
    expect(outboxRepository.save).toHaveBeenCalledWith(req, tx);

    expect(await service.saveMany([req], tx)).toEqual([res]);
    expect(outboxRepository.saveMany).toHaveBeenCalledWith([req], tx);

    expect(await service.markAsProcessed(req.eventId)).toEqual(res);
    expect(outboxRepository.markAsProcessed).toHaveBeenCalledWith(req.eventId);

    expect(await service.markAsFailed(req.eventId, 'boom')).toEqual(res);
    expect(outboxRepository.markAsFailed).toHaveBeenCalledWith(
      req.eventId,
      'boom',
    );

    expect(await service.getPendingOutboxMessages(10, 3)).toEqual([res]);
    expect(outboxRepository.getPendingOutboxMessages).toHaveBeenCalledWith(
      10,
      3,
    );

    expect(await service.releaseStuckMessages(date)).toBe(2);
    expect(outboxRepository.releaseStuckMessages).toHaveBeenCalledWith(date);

    expect(await service.deleteProcessedBefore(date)).toBe(5);
    expect(outboxRepository.deleteProcessedBefore).toHaveBeenCalledWith(date);
  });

  it('publish resolves RouteTarget[] via TopologyRegistry and persists via saveMany', async () => {
    const event = new TestVideoUploadedEvent('vid-1');
    const tx = { id: 'tx-publish' };
    const saved = [
      makeOutboxRes({
        eventId: event.id,
        transport: TransportType.RABBITMQ,
        destination: 'mycast.events',
      }),
      makeOutboxRes({
        eventId: event.id,
        transport: TransportType.REDIS_STREAM,
        destination: 'stream:video',
      }),
    ];

    vi.mocked(topologyRegistry.resolve).mockReturnValue([
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
    ]);
    vi.mocked(outboxRepository.saveMany).mockResolvedValue(saved);

    const result = await service.publish(event, tx);

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
        {
          eventId: event.id,
          eventType: 'video.uploaded',
          payload: event.serialize(),
          transport: TransportType.REDIS_STREAM,
          destination: 'stream:video',
        },
      ],
      tx,
    );
    expect(result).toEqual(saved);
  });

  it('publishMany batches all resolved routes across multiple events and skips saveMany when empty', async () => {
    expect(await service.publishMany([])).toEqual([]);
    expect(outboxRepository.saveMany).not.toHaveBeenCalled();

    const event1 = new TestVideoUploadedEvent('vid-1');
    const event2 = new TestUserCreatedEvent('usr-1');

    vi.mocked(topologyRegistry.resolve).mockImplementation((name) => {
      if (name === 'video.uploaded') {
        return [
          {
            transport: TransportType.RABBITMQ,
            destination: 'mycast.events',
            eventType: 'video.uploaded',
          },
        ];
      }
      return [];
    });

    const saved = [makeOutboxRes({ eventId: event1.id })];
    vi.mocked(outboxRepository.saveMany).mockResolvedValue(saved);

    const result = await service.publishMany([event1, event2]);

    expect(outboxRepository.saveMany).toHaveBeenCalledTimes(1);
    expect(outboxRepository.saveMany).toHaveBeenCalledWith(
      [
        {
          eventId: event1.id,
          eventType: 'video.uploaded',
          payload: event1.serialize(),
          transport: TransportType.RABBITMQ,
          destination: 'mycast.events',
        },
      ],
      undefined,
    );
    expect(result).toEqual(saved);
  });

  it('publishMany returns [] without calling saveMany when no routes match any event', async () => {
    const event = new TestUserCreatedEvent('usr-2');
    vi.mocked(topologyRegistry.resolve).mockReturnValue([]);

    const result = await service.publishMany([event]);

    expect(result).toEqual([]);
    expect(outboxRepository.saveMany).not.toHaveBeenCalled();
  });
});
