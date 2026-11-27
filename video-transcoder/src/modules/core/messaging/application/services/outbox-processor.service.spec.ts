import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransportType } from '../../contracts/topology-registry/topology-registry';
import { OutboxStatus } from '../../domain/enums/outbox-status.enum';
import { OutboxRepository } from '../../domain/repositories/outbox.repository.interface';
import { OutboxRes } from '../../dtos/res.dto';
import { EventStreamPort } from '../ports/event-stream.port';
import { QueuePort } from '../ports/queue.port';
import { OutboxProcessorService } from './outbox-processor.service';

describe('OutboxProcessorService', () => {
  let outboxRepository: OutboxRepository;
  let queuePort: QueuePort;
  let eventStreamPort: EventStreamPort;
  let service: OutboxProcessorService;

  const makeOutboxRes = (overrides?: Partial<OutboxRes>): OutboxRes => ({
    id: 'outbox-uuid-1',
    eventId: 'event-uuid-1',
    eventType: 'video.uploaded',
    payload: '{"videoId":"v-1"}',
    transport: TransportType.RABBITMQ,
    destination: 'mycast.events',
    status: OutboxStatus.PROCESSING,
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
      saveMany: vi.fn(),
      markAsProcessed: vi.fn(),
      markAsFailed: vi.fn(),
      markByIdAsProcessed: vi.fn().mockResolvedValue(null),
      markByIdAsFailed: vi.fn().mockResolvedValue(null),
      claimPendingOutboxMessages: vi.fn().mockResolvedValue([]),
      getPendingOutboxMessages: vi.fn(),
      releaseStuckMessages: vi.fn().mockResolvedValue(0),
      deleteProcessedBefore: vi.fn(),
    };
    queuePort = {
      publish: vi.fn().mockResolvedValue(undefined),
      publishMany: vi.fn().mockResolvedValue(undefined),
    };
    eventStreamPort = {
      publish: vi.fn().mockResolvedValue('1700000000000-0'),
      publishMany: vi.fn().mockResolvedValue([]),
    };
    service = new OutboxProcessorService(
      outboxRepository,
      queuePort,
      eventStreamPort,
    );
  });

  it('releases stuck messages and returns empty summary when no messages are claimed', async () => {
    const summary = await service.processPendingMessages();

    expect(outboxRepository.releaseStuckMessages).toHaveBeenCalledWith(
      expect.any(Date),
    );
    expect(outboxRepository.claimPendingOutboxMessages).toHaveBeenCalledWith(
      100,
      5,
    );
    expect(summary).toEqual({
      claimed: 0,
      processed: 0,
      failed: 0,
      skipped: false,
    });
  });

  it('dispatches RABBITMQ and REDIS_STREAM messages and marks each by id as processed', async () => {
    const rabbitMsg = makeOutboxRes({
      id: 'outbox-rabbit-1',
      eventId: 'evt-1',
      eventType: 'video.uploaded',
      payload: '{"videoId":"1"}',
      transport: TransportType.RABBITMQ,
      destination: 'mycast.events',
    });
    const streamMsg = makeOutboxRes({
      id: 'outbox-stream-1',
      eventId: 'evt-2',
      eventType: 'video.played',
      payload: '{"videoId":"2"}',
      transport: TransportType.REDIS_STREAM,
      destination: 'video.stream',
    });

    vi.mocked(outboxRepository.claimPendingOutboxMessages).mockResolvedValue([
      rabbitMsg,
      streamMsg,
    ]);

    const summary = await service.processPendingMessages();

    expect(queuePort.publish).toHaveBeenCalledTimes(1);
    const [publishedRabbitEvent, rabbitOpts] = vi.mocked(queuePort.publish).mock
      .calls[0];
    expect(publishedRabbitEvent.id).toBe('evt-1');
    expect(publishedRabbitEvent.getEventName()).toBe('video.uploaded');
    expect(publishedRabbitEvent.serialize()).toBe('{"videoId":"1"}');
    expect(rabbitOpts).toEqual({ destination: 'mycast.events' });

    expect(eventStreamPort.publish).toHaveBeenCalledTimes(1);
    const [publishedStreamEvent, streamDest] = vi.mocked(
      eventStreamPort.publish,
    ).mock.calls[0];
    expect(publishedStreamEvent.id).toBe('evt-2');
    expect(publishedStreamEvent.getEventName()).toBe('video.played');
    expect(publishedStreamEvent.serialize()).toBe('{"videoId":"2"}');
    expect(streamDest).toBe('video.stream');

    expect(outboxRepository.markByIdAsProcessed).toHaveBeenCalledWith(
      'outbox-rabbit-1',
    );
    expect(outboxRepository.markByIdAsProcessed).toHaveBeenCalledWith(
      'outbox-stream-1',
    );
    expect(summary).toEqual({
      claimed: 2,
      processed: 2,
      failed: 0,
      skipped: false,
    });
  });

  it('logs error and marks failed messages by id without aborting remaining batch', async () => {
    const loggerSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    const failingMsg = makeOutboxRes({
      id: 'outbox-fail-1',
      transport: TransportType.RABBITMQ,
      destination: 'mycast.events',
    });
    const succeedingMsg = makeOutboxRes({
      id: 'outbox-ok-2',
      transport: TransportType.REDIS_STREAM,
      destination: 'video.stream',
    });

    vi.mocked(outboxRepository.claimPendingOutboxMessages).mockResolvedValue([
      failingMsg,
      succeedingMsg,
    ]);
    vi.mocked(queuePort.publish).mockRejectedValueOnce(new Error('AMQP down'));

    const summary = await service.processPendingMessages();

    expect(loggerSpy).toHaveBeenCalled();
    expect(outboxRepository.markByIdAsFailed).toHaveBeenCalledWith(
      'outbox-fail-1',
      'AMQP down',
    );
    expect(outboxRepository.markByIdAsProcessed).toHaveBeenCalledWith(
      'outbox-ok-2',
    );
    expect(summary).toEqual({
      claimed: 2,
      processed: 1,
      failed: 1,
      skipped: false,
    });

    loggerSpy.mockRestore();
  });

  it('skips overlapping execution when already processing and resets guard in finally', async () => {
    let releaseStuckResolve!: (val: number) => void;
    vi.mocked(outboxRepository.releaseStuckMessages).mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          releaseStuckResolve = resolve;
        }),
    );

    const firstRun = service.processPendingMessages();
    const overlappingRun = await service.processPendingMessages();

    expect(overlappingRun).toEqual({
      claimed: 0,
      processed: 0,
      failed: 0,
      skipped: true,
    });
    expect(outboxRepository.releaseStuckMessages).toHaveBeenCalledTimes(1);

    releaseStuckResolve(0);
    const firstSummary = await firstRun;
    expect(firstSummary.skipped).toBe(false);

    const nextRun = await service.processPendingMessages();
    expect(nextRun.skipped).toBe(false);
    expect(outboxRepository.releaseStuckMessages).toHaveBeenCalledTimes(2);
  });
});
