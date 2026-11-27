import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageListener } from './storage.listener';
import { DeleteStorageEvent } from '../../domain/events/delete-storage.event';
import { DeleteStorageHandler } from '../../application/handlers/delete-storage.handler';
import {
  InboxCreateReq,
  InboxServiceContract,
  TransportType,
} from '../../../messaging';
import { Handler } from '../../../../../common/application/handler';

describe('StorageListener', () => {
  let deleteStorageHandler: { handle: ReturnType<typeof vi.fn> };
  let inboxService: InboxServiceContract & {
    executeOnce: ReturnType<typeof vi.fn>;
  };
  let listener: StorageListener;

  beforeEach(() => {
    deleteStorageHandler = {
      handle: vi.fn().mockResolvedValue(undefined),
    };
    inboxService = {
      tryInsert: vi.fn(),
      findByEventAndConsumer: vi.fn(),
      markAsProcessed: vi.fn(),
      markAsFailed: vi.fn(),
      deleteProcessedBefore: vi.fn(),
      executeOnce: vi.fn(
        async (
          _req: InboxCreateReq,
          data: unknown,
          handler: Handler<unknown>,
        ) => {
          await handler.handle(data);
          return true;
        },
      ),
    };
    listener = new StorageListener(
      deleteStorageHandler as unknown as DeleteStorageHandler,
      inboxService,
    );
  });

  it('delegates plain object payload to INBOX_SERVICE.executeOnce and DeleteStorageHandler', async () => {
    const rawEvent = {
      id: '11111111-1111-4111-8111-111111111111',
      occuredOn: '2026-11-27T00:00:00.000Z',
      storageIds: ['storage-1', 'storage-2'],
    };

    await listener.handleDeleteStorage(rawEvent);

    expect(inboxService.executeOnce).toHaveBeenCalledTimes(1);
    const [req, hydratedEvent, handler] = inboxService.executeOnce.mock.calls[0];
    expect(req).toEqual({
      eventId: '11111111-1111-4111-8111-111111111111',
      consumer: 'StorageListener.handleDeleteStorage',
      eventType: DeleteStorageEvent.EVENT_NAME,
      payload: JSON.stringify(rawEvent),
      transport: TransportType.RABBITMQ,
      source: 'storage.events',
    });
    expect(hydratedEvent).toBeInstanceOf(DeleteStorageEvent);
    expect(hydratedEvent.storageIds).toEqual(['storage-1', 'storage-2']);
    expect(hydratedEvent.keys).toEqual(['storage-1', 'storage-2']);
    expect(handler).toBe(deleteStorageHandler);
    expect(deleteStorageHandler.handle).toHaveBeenCalledWith(hydratedEvent);
  });

  it('deserializes JSON string payload and delegates to INBOX_SERVICE.executeOnce', async () => {
    const event = new DeleteStorageEvent(['storage-json-1']);
    const serialized = event.serialize();

    await listener.handleDeleteStorage(serialized);

    expect(inboxService.executeOnce).toHaveBeenCalledTimes(1);
    const [req, hydratedEvent] = inboxService.executeOnce.mock.calls[0];
    expect(req.eventId).toBe(event.id);
    expect(req.payload).toBe(serialized);
    expect(hydratedEvent).toBeInstanceOf(DeleteStorageEvent);
    expect(hydratedEvent.storageIds).toEqual(['storage-json-1']);
    expect(deleteStorageHandler.handle).toHaveBeenCalledTimes(1);
  });

  it('derives deterministic UUID fallback when event id is missing', async () => {
    const payload = { storageIds: ['storage-no-id'] };

    await listener.handleDeleteStorage(payload);
    await listener.handleDeleteStorage({ storageIds: ['storage-no-id'] });

    const firstId = inboxService.executeOnce.mock.calls[0][0].eventId;
    const secondId = inboxService.executeOnce.mock.calls[1][0].eventId;
    expect(firstId).toBe(secondId);
    expect(firstId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('skips handler invocation when inboxService.executeOnce deduplicates delivery', async () => {
    inboxService.executeOnce.mockResolvedValueOnce(false);

    await listener.handleDeleteStorage({
      id: '22222222-2222-4222-8222-222222222222',
      storageIds: ['storage-dup'],
    });

    expect(inboxService.executeOnce).toHaveBeenCalledTimes(1);
    expect(deleteStorageHandler.handle).not.toHaveBeenCalled();
  });

  it('throws on invalid JSON string payload without calling executeOnce', async () => {
    await expect(
      listener.handleDeleteStorage('not-valid-json'),
    ).rejects.toThrow();
    expect(inboxService.executeOnce).not.toHaveBeenCalled();
  });
});
