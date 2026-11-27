import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  INBOX_SERVICE,
  InboxServiceContract,
  TransportType,
} from '../../../messaging';
import { DeleteStorageEvent } from '../../domain/events/delete-storage.event';
import { DeleteStorageHandler } from '../../application/handlers/delete-storage.handler';

@Injectable()
export class StorageListener {
  private readonly logger = new Logger(StorageListener.name);

  constructor(
    private readonly deleteStorageHandler: DeleteStorageHandler,
    @Inject(INBOX_SERVICE)
    private readonly inboxService: InboxServiceContract,
  ) {}

  @RabbitSubscribe({
    exchange: 'storage.events',
    routingKey: DeleteStorageEvent.EVENT_NAME,
    queue: 'storage.delete.queue',
  })
  async handleDeleteStorage(
    event: DeleteStorageEvent | Record<string, unknown> | string,
  ): Promise<void> {
    const raw = this.parsePayload(event);
    const serializedPayload =
      typeof event === 'string' ? event : JSON.stringify(raw);
    const eventId = this.extractEventId(raw, serializedPayload);

    const payload = Object.assign(
      Object.create(DeleteStorageEvent.prototype) as DeleteStorageEvent,
      raw,
      {
        id: eventId,
        occuredOn: raw.occuredOn
          ? new Date(raw.occuredOn as string | number | Date)
          : new Date(),
      },
    );

    await this.inboxService.executeOnce(
      {
        eventId,
        consumer: 'StorageListener.handleDeleteStorage',
        eventType: DeleteStorageEvent.EVENT_NAME,
        payload: serializedPayload,
        transport: TransportType.RABBITMQ,
        source: 'storage.events',
      },
      payload,
      this.deleteStorageHandler,
    );
  }

  private parsePayload(
    event: DeleteStorageEvent | Record<string, unknown> | string,
  ): Record<string, unknown> {
    if (typeof event === 'string') {
      const parsed: unknown = JSON.parse(event);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid DeleteStorageEvent JSON payload');
      }
      return parsed as Record<string, unknown>;
    }
    if (!event || typeof event !== 'object' || Array.isArray(event)) {
      throw new Error('Invalid DeleteStorageEvent payload');
    }
    return event as unknown as Record<string, unknown>;
  }

  private extractEventId(
    raw: Record<string, unknown>,
    serializedPayload: string,
  ): string {
    if (typeof raw.id === 'string' && raw.id.trim().length > 0) {
      return raw.id;
    }
    const hex = createHash('sha256').update(serializedPayload).digest('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  }
}
