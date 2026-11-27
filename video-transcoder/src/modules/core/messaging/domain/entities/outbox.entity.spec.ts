import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { TransportType } from '../../contracts/topology-registry/topology-registry';
import { OutboxStatus } from '../enums/outbox-status.enum';
import { OutboxEntity } from './outbox.entity';

describe('OutboxEntity', () => {
  const baseProps = {
    eventId: '550e8400-e29b-41d4-a716-446655440000',
    eventType: 'video.uploaded',
    payload: JSON.stringify({ videoId: 'vid-123' }),
    transport: TransportType.RABBITMQ,
    destination: 'video.events',
  };

  it('creates an entity with default status, retryCount, and null error/processedAt', () => {
    const outbox = OutboxEntity.create(baseProps);

    expect(outbox).toBeInstanceOf(OutboxEntity);
    expect(outbox.id).toBeUndefined();
    expect(outbox.eventId).toBe(baseProps.eventId);
    expect(outbox.eventType).toBe('video.uploaded');
    expect(outbox.payload).toBe('{"videoId":"vid-123"}');
    expect(outbox.transport).toBe(TransportType.RABBITMQ);
    expect(outbox.destination).toBe('video.events');
    expect(outbox.status).toBe(OutboxStatus.PENDING);
    expect(outbox.retryCount).toBe(0);
    expect(outbox.lastError).toBeNull();
    expect(outbox.processedAt).toBeNull();
  });

  it('creates an entity with explicit optional fields', () => {
    const processedAt = new Date('2026-11-26T10:00:00.000Z');
    const outbox = OutboxEntity.create({
      ...baseProps,
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      transport: TransportType.REDIS_STREAM,
      status: OutboxStatus.PROCESSED,
      retryCount: 2,
      lastError: 'previous timeout',
      processedAt,
    });

    expect(outbox.eventId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(outbox.transport).toBe(TransportType.REDIS_STREAM);
    expect(outbox.status).toBe(OutboxStatus.PROCESSED);
    expect(outbox.retryCount).toBe(2);
    expect(outbox.lastError).toBe('previous timeout');
    expect(outbox.processedAt).toBe(processedAt);
  });

  it('markFailed increments retryCount, sets FAILED status, and records error', () => {
    const outbox = OutboxEntity.create(baseProps);

    outbox.markFailed('broker unreachable');
    expect(outbox.status).toBe(OutboxStatus.FAILED);
    expect(outbox.retryCount).toBe(1);
    expect(outbox.lastError).toBe('broker unreachable');

    outbox.markFailed();
    expect(outbox.status).toBe(OutboxStatus.FAILED);
    expect(outbox.retryCount).toBe(2);
    expect(outbox.lastError).toBeNull();
  });

  it('markProcessed sets PROCESSED status, clears lastError, and sets processedAt', () => {
    const outbox = OutboxEntity.create(baseProps);
    outbox.markFailed('transient error');

    const before = new Date();
    outbox.markProcessed();
    const after = new Date();

    expect(outbox.status).toBe(OutboxStatus.PROCESSED);
    expect(outbox.lastError).toBeNull();
    expect(outbox.processedAt).toBeInstanceOf(Date);
    expect(outbox.processedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(outbox.processedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('registers TypeORM table, columns, and named indexes', () => {
    const storage = getMetadataArgsStorage();

    const table = storage.tables.find((t) => t.target === OutboxEntity);
    expect(table?.name).toBe('outbox_messages');

    const indexes = storage.indices.filter((i) => i.target === OutboxEntity);
    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'IDX_outbox_status_created_at',
          columns: ['status', 'createdAt'],
        }),
        expect.objectContaining({
          name: 'IDX_outbox_event_type',
          columns: ['eventType'],
        }),
        expect.objectContaining({
          name: 'UQ_outbox_event_target',
          columns: ['eventId', 'transport', 'destination'],
          unique: true,
        }),
      ]),
    );

    const columns = storage.columns.filter((c) => c.target === OutboxEntity);
    const columnNames = columns.map((c) => c.propertyName);
    expect(columnNames).toContain('destination');
    expect(columnNames).not.toContain('destinaiton');

    const colByName = Object.fromEntries(
      columns.map((c) => [c.propertyName, c.options]),
    );
    expect(colByName.id.primary).toBe(true);
    expect(colByName.eventId.type).toBe('uuid');
    expect(colByName.eventId.primary).toBeFalsy();
    expect(colByName.eventType.type).toBe('varchar');
    expect(colByName.payload.type).toBe('text');
    expect(colByName.status.type).toBe('enum');
    expect(colByName.transport.type).toBe('enum');
    expect(colByName.destination.type).toBe('varchar');
    expect(colByName.retryCount.type).toBe('int');
    expect(colByName.lastError.type).toBe('text');
    expect(colByName.processedAt.type).toBe('timestamptz');
    expect(colByName.createdAt.type).toBe('timestamptz');
    expect(colByName.updatedAt.type).toBe('timestamptz');

    const generated = storage.generations.find((g) => g.target === OutboxEntity);
    expect(generated?.propertyName).toBe('id');
    expect(generated?.strategy).toBe('uuid');
  });
});
