import { Handler } from '../../../../../common/application/handler';
import { InboxCreateReq } from '../../dtos/req.dto';
import { InboxRes } from '../../dtos/res.dto';

export const INBOX_SERVICE = Symbol('INBOX_SERVICE');

export interface InboxServiceContract {
  tryInsert(req: InboxCreateReq, tx?: unknown): Promise<boolean>;

  findByEventAndConsumer(
    eventId: string,
    consumer: string,
  ): Promise<InboxRes | null>;

  markAsProcessed(id: string, tx?: unknown): Promise<void>;

  markAsFailed(id: string, error: string): Promise<void>;

  deleteProcessedBefore(before: Date): Promise<number>;

  executeOnce<T>(
    req: InboxCreateReq,
    data: T,
    handler: Handler<T>,
    tx?: unknown,
  ): Promise<boolean>;
}
