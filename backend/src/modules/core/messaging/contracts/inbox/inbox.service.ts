import { Inject, Injectable } from '@nestjs/common';
import { Handler } from '../../../../../common/application/handler';
import {
  INBOX_REPOSITORY,
  InboxRepository,
} from '../../domain/repositories/inbox.repository.interface';
import { InboxCreateReq } from '../../dtos/req.dto';
import { InboxRes } from '../../dtos/res.dto';
import { InboxServiceContract } from './inbox';

/** Public facade for idempotent inbox deduplication and single-execution handling. */
@Injectable()
export class InboxService implements InboxServiceContract {
  constructor(
    @Inject(INBOX_REPOSITORY)
    private readonly inboxRepository: InboxRepository,
  ) {}

  tryInsert(req: InboxCreateReq, tx?: unknown): Promise<boolean> {
    return this.inboxRepository.tryInsert(req, tx);
  }

  findByEventAndConsumer(
    eventId: string,
    consumer: string,
  ): Promise<InboxRes | null> {
    return this.inboxRepository.findByEventAndConsumer(eventId, consumer);
  }

  markAsProcessed(id: string, tx?: unknown): Promise<void> {
    return this.inboxRepository.markAsProcessed(id, tx);
  }

  markAsFailed(id: string, error: string): Promise<void> {
    return this.inboxRepository.markAsFailed(id, error);
  }

  deleteProcessedBefore(before: Date): Promise<number> {
    return this.inboxRepository.deleteProcessedBefore(before);
  }

  async executeOnce<T>(
    req: InboxCreateReq,
    data: T,
    handler: Handler<T>,
    tx?: unknown,
  ): Promise<boolean> {
    const inserted = await this.inboxRepository.tryInsert(req, tx);
    if (!inserted) {
      return false;
    }

    const record = await this.inboxRepository.findByEventAndConsumer(
      req.eventId,
      req.consumer,
    );
    if (!record) {
      throw new Error(
        `Inbox record not found after insert for event "${req.eventId}" and consumer "${req.consumer}"`,
      );
    }

    try {
      await handler.handle(data);
      await this.inboxRepository.markAsProcessed(record.id, tx);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.inboxRepository.markAsFailed(record.id, message);
      throw error;
    }
  }
}
