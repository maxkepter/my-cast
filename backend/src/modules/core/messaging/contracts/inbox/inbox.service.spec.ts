import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Handler } from '../../../../../common/application/handler';
import { InboxRepository } from '../../domain/repositories/inbox.repository.interface';
import { InboxStatus } from '../../domain/enums/inbox-status.enum';
import { InboxCreateReq } from '../../dtos/req.dto';
import { InboxRes } from '../../dtos/res.dto';
import { TransportType } from '../topology-registry/topology-registry';
import { InboxService } from './inbox.service';

describe('InboxService', () => {
  let inboxRepository: InboxRepository;
  let service: InboxService;

  const req: InboxCreateReq = {
    eventId: '11111111-1111-1111-1111-111111111111',
    consumer: 'video-transcoder-consumer',
    eventType: 'video.uploaded',
    payload: '{"videoId":"v1"}',
    transport: TransportType.RABBITMQ,
    source: 'mycast.events',
  };

  const record: InboxRes = {
    id: '22222222-2222-2222-2222-222222222222',
    eventId: req.eventId,
    consumer: req.consumer,
    eventType: req.eventType,
    payload: req.payload,
    transport: req.transport,
    source: req.source,
    status: InboxStatus.PENDING,
    retryCount: 0,
    lastError: null,
    processedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    inboxRepository = {
      tryInsert: vi.fn(),
      findByEventAndConsumer: vi.fn(),
      markAsProcessed: vi.fn(),
      markAsFailed: vi.fn(),
      deleteProcessedBefore: vi.fn(),
    };
    service = new InboxService(inboxRepository);
  });

  it('delegates CRUD/idempotency methods to inboxRepository', async () => {
    const tx = { id: 'tx-1' };
    const before = new Date('2026-01-02T00:00:00Z');

    vi.mocked(inboxRepository.tryInsert).mockResolvedValue(true);
    vi.mocked(inboxRepository.findByEventAndConsumer).mockResolvedValue(record);
    vi.mocked(inboxRepository.markAsProcessed).mockResolvedValue(undefined);
    vi.mocked(inboxRepository.markAsFailed).mockResolvedValue(undefined);
    vi.mocked(inboxRepository.deleteProcessedBefore).mockResolvedValue(3);

    expect(await service.tryInsert(req, tx)).toBe(true);
    expect(inboxRepository.tryInsert).toHaveBeenCalledWith(req, tx);

    expect(
      await service.findByEventAndConsumer(req.eventId, req.consumer),
    ).toEqual(record);
    expect(inboxRepository.findByEventAndConsumer).toHaveBeenCalledWith(
      req.eventId,
      req.consumer,
    );

    await service.markAsProcessed(record.id, tx);
    expect(inboxRepository.markAsProcessed).toHaveBeenCalledWith(record.id, tx);

    await service.markAsFailed(record.id, 'err');
    expect(inboxRepository.markAsFailed).toHaveBeenCalledWith(record.id, 'err');

    expect(await service.deleteProcessedBefore(before)).toBe(3);
    expect(inboxRepository.deleteProcessedBefore).toHaveBeenCalledWith(before);
  });

  it('executeOnce runs handler, marks processed, and returns true on first insert', async () => {
    const tx = { id: 'tx-exec' };
    const data = { videoId: 'v1' };
    const handler: Handler<typeof data> = {
      handle: vi.fn().mockResolvedValue(undefined),
    };

    vi.mocked(inboxRepository.tryInsert).mockResolvedValue(true);
    vi.mocked(inboxRepository.findByEventAndConsumer).mockResolvedValue(record);

    const result = await service.executeOnce(req, data, handler, tx);

    expect(result).toBe(true);
    expect(inboxRepository.tryInsert).toHaveBeenCalledWith(req, tx);
    expect(inboxRepository.findByEventAndConsumer).toHaveBeenCalledWith(
      req.eventId,
      req.consumer,
    );
    expect(handler.handle).toHaveBeenCalledWith(data);
    expect(inboxRepository.markAsProcessed).toHaveBeenCalledWith(record.id, tx);
    expect(inboxRepository.markAsFailed).not.toHaveBeenCalled();
  });

  it('executeOnce returns false immediately on duplicate without running handler', async () => {
    const handler: Handler<{ videoId: string }> = {
      handle: vi.fn(),
    };

    vi.mocked(inboxRepository.tryInsert).mockResolvedValue(false);

    const result = await service.executeOnce(req, { videoId: 'v1' }, handler);

    expect(result).toBe(false);
    expect(inboxRepository.findByEventAndConsumer).not.toHaveBeenCalled();
    expect(handler.handle).not.toHaveBeenCalled();
    expect(inboxRepository.markAsProcessed).not.toHaveBeenCalled();
    expect(inboxRepository.markAsFailed).not.toHaveBeenCalled();
  });

  it('executeOnce marks failed and rethrows when handler throws', async () => {
    const boom = new Error('transcode failed');
    const handler: Handler<{ videoId: string }> = {
      handle: vi.fn().mockRejectedValue(boom),
    };

    vi.mocked(inboxRepository.tryInsert).mockResolvedValue(true);
    vi.mocked(inboxRepository.findByEventAndConsumer).mockResolvedValue(record);

    await expect(
      service.executeOnce(req, { videoId: 'v1' }, handler),
    ).rejects.toThrow('transcode failed');

    expect(inboxRepository.markAsProcessed).not.toHaveBeenCalled();
    expect(inboxRepository.markAsFailed).toHaveBeenCalledWith(
      record.id,
      'transcode failed',
    );
  });
});
