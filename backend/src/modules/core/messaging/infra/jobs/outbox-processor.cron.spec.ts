import { Logger } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OutboxProcessorService } from '../../application/services/outbox-processor.service';
import { OutboxProcessorCron } from './outbox-processor.cron';

describe('OutboxProcessorCron', () => {
  let outboxProcessorService: OutboxProcessorService;
  let cron: OutboxProcessorCron;

  beforeEach(() => {
    outboxProcessorService = {
      processPendingMessages: vi.fn().mockResolvedValue({
        claimed: 0,
        processed: 0,
        failed: 0,
        skipped: false,
      }),
    } as unknown as OutboxProcessorService;
    cron = new OutboxProcessorCron(outboxProcessorService);
  });

  it('delegates handleOutboxProcessing to OutboxProcessorService', async () => {
    await cron.handleOutboxProcessing();

    expect(outboxProcessorService.processPendingMessages).toHaveBeenCalledTimes(
      1,
    );
  });

  it('catches and logs unexpected errors without throwing', async () => {
    const loggerSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    vi.mocked(
      outboxProcessorService.processPendingMessages,
    ).mockRejectedValueOnce(new Error('DB connection lost'));

    await expect(cron.handleOutboxProcessing()).resolves.toBeUndefined();
    expect(loggerSpy).toHaveBeenCalled();

    loggerSpy.mockRestore();
  });
});
