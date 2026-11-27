import { Inject, Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import { TransportType } from '../../contracts/topology-registry/topology-registry';
import {
  OUTBOX_REPOSITORY,
  OutboxRepository,
} from '../../domain/repositories/outbox.repository.interface';
import { OutboxRes } from '../../dtos/res.dto';
import { EVENT_STREAM_PORT, EventStreamPort } from '../ports/event-stream.port';
import { QUEUE_PORT, QueuePort } from '../ports/queue.port';

export interface OutboxProcessSummary {
  claimed: number;
  processed: number;
  failed: number;
  skipped: boolean;
}

class RehydratedOutboxEvent extends DomainEvent {
  constructor(private readonly outboxMessage: OutboxRes) {
    super();
    (this as { id: string }).id = outboxMessage.eventId;
  }

  getEventName(): string {
    return this.outboxMessage.eventType;
  }

  override serialize(): string {
    return this.outboxMessage.payload;
  }
}

/** Relays claimed transactional outbox messages to RabbitMQ and Redis Streams. */
@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private readonly batchSize = 100;
  private readonly maxRetryCount = 5;
  private readonly stuckThresholdMs = 5 * 60 * 1000;
  private isProcessing = false;

  constructor(
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: OutboxRepository,
    @Inject(QUEUE_PORT)
    private readonly queuePort: QueuePort,
    @Inject(EVENT_STREAM_PORT)
    private readonly eventStreamPort: EventStreamPort,
  ) {}

  async processPendingMessages(): Promise<OutboxProcessSummary> {
    if (this.isProcessing) {
      return { claimed: 0, processed: 0, failed: 0, skipped: true };
    }

    this.isProcessing = true;
    try {
      const olderThan = new Date(Date.now() - this.stuckThresholdMs);
      await this.outboxRepository.releaseStuckMessages(olderThan);

      const messages = await this.outboxRepository.claimPendingOutboxMessages(
        this.batchSize,
        this.maxRetryCount,
      );

      let processed = 0;
      let failed = 0;

      for (const msg of messages) {
        try {
          const event = new RehydratedOutboxEvent(msg);

          if (msg.transport === TransportType.RABBITMQ) {
            await this.queuePort.publish(event, {
              destination: msg.destination,
            });
          } else if (msg.transport === TransportType.REDIS_STREAM) {
            await this.eventStreamPort.publish(event, msg.destination);
          } else {
            throw new Error(
              `Unsupported outbox transport: ${String(msg.transport)}`,
            );
          }

          await this.outboxRepository.markByIdAsProcessed(msg.id);
          processed += 1;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to process outbox message ${msg.id} (${msg.eventType}): ${errorMessage}`,
            error instanceof Error ? error.stack : undefined,
          );
          await this.outboxRepository.markByIdAsFailed(msg.id, errorMessage);
          failed += 1;
        }
      }

      return {
        claimed: messages.length,
        processed,
        failed,
        skipped: false,
      };
    } finally {
      this.isProcessing = false;
    }
  }
}
