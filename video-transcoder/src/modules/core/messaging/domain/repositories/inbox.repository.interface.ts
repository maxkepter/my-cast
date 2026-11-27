import { InboxCreateReq } from '../../dtos/req.dto';
import { InboxRes } from '../../dtos/res.dto';

export const INBOX_REPOSITORY = Symbol('INBOX_REPOSITORY');

export interface InboxRepository {
  tryInsert(req: InboxCreateReq, tx?: unknown): Promise<boolean>;

  findByEventAndConsumer(
    eventId: string,
    consumer: string,
  ): Promise<InboxRes | null>;

  markAsProcessed(id: string, tx?: unknown): Promise<void>;
  markAsFailed(id: string, error: string): Promise<void>;
  deleteProcessedBefore(before: Date): Promise<number>;
}
