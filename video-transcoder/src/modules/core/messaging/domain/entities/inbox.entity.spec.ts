import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { TransportType } from '../../contracts/topology-registry/topology-registry';
import { InboxStatus } from '../enums/inbox-status.enum';
import { InboxEntity } from './inbox.entity';

describe('InboxEntity', () => {
  const baseProps = {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    consumer: 'video-transcoder-consumer',
    eventType: 'video.uploaded',
    payload: JSON.stringify({ videoId: 'vid-123' }),
    transport: TransportType.RABBITMQ,
    source: 'video.events',
  };

  it('creates an entity with default status, retryCount, and null error/processedAt', () => {
    const inbox = InboxEntity.create(baseProps);

    expect(inbox).toBeInstanceOf(InboxEntity);
    expect(inbox.eventId).toBe(baseProps.eventId);
    expect(inbox.consumer).toBe('video-transcoder-consumer');
    expect(inbox.eventType).toBe('video.uploaded');
    expect(inbox.payload).toBe('{"videoId":"vid-123"}');
    expect(inbox.transport).toBe(TransportType.RABBITMQ);
    expect(inbox.source).toBe('video.events');
    expect(inbox.status).toBe(InboxStatus.PENDING);
    expect(inbox.retryCount).toBe(0);
    expect(inbox.lastError).toBeNull();
    expect(inbox.processedAt).toBeNull();
  });

  it('creates an entity with explicit optional fields', () => {
    const processedAt = new Date('2026-11-26T10:00:00.000Z');
    const inbox = InboxEntity.create({
      ...baseProps,
      transport: TransportType.REDIS_STREAM,
      status: InboxStatus.PROCESSED,
      retryCount: 3,
      lastError: 'stale error',
      processedAt,
    });

    expect(inbox.transport).toBe(TransportType.REDIS_STREAM);
    expect(inbox.status).toBe(InboxStatus.PROCESSED);
    expect(inbox.retryCount).toBe(3);
    expect(inbox.lastError).toBe('stale error');
    expect(inbox.processedAt).toBe(processedAt);
  });

  it('markFailed increments retryCount, sets FAILED status, and records error', () => {
    const inbox = InboxEntity.create(baseProps);

    inbox.markFailed('handler threw');
    expect(inbox.status).toBe(InboxStatus.FAILED);
    expect(inbox.retryCount).toBe(1);
    expect(inbox.lastError).toBe('handler threw');

    inbox.markFailed();
    expect(inbox.status).toBe(InboxStatus.FAILED);
    expect(inbox.retryCount).toBe(2);
    expect(inbox.lastError).toBeNull();
  });

  it('markProcessed sets PROCESSED status, clears lastError, and sets processedAt', () => {
    const inbox = InboxEntity.create(baseProps);
    inbox.markFailed('transient error');

    const before = new Date();
    inbox.markProcessed();
    const after = new Date();

    expect(inbox.status).toBe(InboxStatus.PROCESSED);
    expect(inbox.lastError).toBeNull();
    expect(inbox.processedAt).toBeInstanceOf(Date);
    expect(inbox.processedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(inbox.processedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('registers TypeORM table, columns, and unique/composite indexes', () => {
    const storage = getMetadataArgsStorage();

    const table = storage.tables.find((t) => t.target === InboxEntity);
    expect(table?.name).toBe('inbox_messages');

    const indexes = storage.indices.filter((i) => i.target === InboxEntity);
    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'UQ_inbox_event_consumer',
          columns: ['eventId', 'consumer'],
          unique: true,
        }),
        expect.objectContaining({
          name: 'IDX_inbox_status_created_at',
          columns: ['status', 'createdAt'],
        }),
      ]),
    );

    const columns = storage.columns.filter((c) => c.target === InboxEntity);
    const colByName = Object.fromEntries(
      columns.map((c) => [c.propertyName, c.options]),
    );
    expect(colByName.eventId.type).toBe('uuid');
    expect(colByName.consumer.type).toBe('varchar');
    expect(colByName.eventType.type).toBe('varchar');
    expect(colByName.payload.type).toBe('text');
    expect(colByName.transport.type).toBe('enum');
    expect(colByName.source.type).toBe('varchar');
    expect(colByName.status.type).toBe('enum');
    expect(colByName.retryCount.type).toBe('int');
    expect(colByName.lastError.type).toBe('text');
    expect(colByName.processedAt.type).toBe('timestamptz');
    expect(colByName.createdAt.type).toBe('timestamptz');
    expect(colByName.updatedAt.type).toBe('timestamptz');

    const generated = storage.generations.find((g) => g.target === InboxEntity);
    expect(generated?.propertyName).toBe('id');
    expect(generated?.strategy).toBe('uuid');
  });
});
