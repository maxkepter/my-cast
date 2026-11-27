import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxProcessorService } from '../../application/services/outbox-processor.service';

/** Scheduled 1-minute cron job that triggers transactional outbox relay. */
@Injectable()
export class OutboxProcessorCron {
  private readonly logger = new Logger(OutboxProcessorCron.name);

  constructor(
    private readonly outboxProcessorService: OutboxProcessorService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleOutboxProcessing(): Promise<void> {
    try {
      await this.outboxProcessorService.processPendingMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Outbox cron execution failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
