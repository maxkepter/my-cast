import { EntityManager, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransportType } from '../../contracts/topology-registry/topology-registry';
import { InboxEntity } from '../../domain/entities/inbox.entity';
import { InboxStatus } from '../../domain/enums/inbox-status.enum';
import { InboxCreateReq } from '../../dtos/req.dto';
import { TypeOrmInboxRepository } from './typeorm-inbox.repository';

function createReq(overrides: Partial<InboxCreateReq> = {}): InboxCreateReq {
  return {
    eventId: '11111111-1111-4111-8111-111111111111',
    consumer: 'transcoder-consumer',
    eventType: 'video.uploaded',
    payload: JSON.stringify({ videoId: 'v-1' }),
    transport: TransportType.RABBITMQ,
    source: 'video.exchange',
    ...overrides,
  };
}

function createEntity(overrides: Partial<InboxEntity> = {}): InboxEntity {
  const entity = InboxEntity.create(createReq());
  entity.id = 'inbox-uuid-1';
  entity.createdAt = new Date('2026-11-26T00:00:00.000Z');
  entity.updatedAt = new Date('2026-11-26T00:00:00.000Z');
  Object.assign(entity, overrides);
  return entity;
}

describe('TypeOrmInboxRepository', () => {
  let repo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let sut: TypeOrmInboxRepository;

  beforeEach(() => {
    repo = {
      findOne: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    sut = new TypeOrmInboxRepository(
      repo as unknown as Repository<InboxEntity>,
    );
  });

  describe('tryInsert', () => {
    it('returns true when insert orIgnore creates a new row', async () => {
      const qb = {
        insert: vi.fn().mockReturnThis(),
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        orIgnore: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ identifiers: [{ id: 'inbox-1' }] }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const inserted = await sut.tryInsert(createReq());

      expect(inserted).toBe(true);
      expect(qb.into).toHaveBeenCalledWith(InboxEntity);
      expect(qb.values.mock.calls[0][0]).toBeInstanceOf(InboxEntity);
      expect(qb.orIgnore).toHaveBeenCalledTimes(1);
    });

    it('returns false when duplicate event+consumer is ignored', async () => {
      const qb = {
        insert: vi.fn().mockReturnThis(),
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        orIgnore: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ identifiers: [] }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const inserted = await sut.tryInsert(createReq());

      expect(inserted).toBe(false);
    });

    it('returns false when identifiers contains only null/undefined', async () => {
      const qb = {
        insert: vi.fn().mockReturnThis(),
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        orIgnore: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ identifiers: [null] }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const inserted = await sut.tryInsert(createReq());

      expect(inserted).toBe(false);
    });

    it('propagates EntityManager transaction when tx is provided', async () => {
      const qb = {
        insert: vi.fn().mockReturnThis(),
        into: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        orIgnore: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ identifiers: [{ id: 'inbox-1' }] }),
      };
      const txRepo = { createQueryBuilder: vi.fn().mockReturnValue(qb) };
      const getRepositorySpy = vi.fn().mockReturnValue(txRepo);
      const em = Object.create(EntityManager.prototype) as EntityManager;
      em.getRepository = getRepositorySpy;

      const inserted = await sut.tryInsert(createReq(), em);

      expect(inserted).toBe(true);
      expect(getRepositorySpy).toHaveBeenCalledWith(InboxEntity);
      expect(txRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findByEventAndConsumer', () => {
    it('returns null when no matching inbox record exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const res = await sut.findByEventAndConsumer('ev-1', 'consumer-1');

      expect(res).toBeNull();
    });

    it('returns mapped InboxRes when matching record exists', async () => {
      const entity = createEntity();
      repo.findOne.mockResolvedValue(entity);

      const res = await sut.findByEventAndConsumer(
        entity.eventId,
        entity.consumer,
      );

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { eventId: entity.eventId, consumer: entity.consumer },
      });
      expect(res).toEqual({
        id: entity.id,
        eventId: entity.eventId,
        consumer: entity.consumer,
        eventType: entity.eventType,
        payload: entity.payload,
        transport: entity.transport,
        source: entity.source,
        status: InboxStatus.PENDING,
        retryCount: 0,
        lastError: null,
        processedAt: null,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      });
    });
  });

  describe('markAsProcessed', () => {
    it('does nothing when entity is not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await sut.markAsProcessed('missing-id');

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('marks entity processed and saves via tx repository when provided', async () => {
      const entity = createEntity({ lastError: 'transient' });
      const txRepo = {
        findOne: vi.fn().mockResolvedValue(entity),
        save: vi.fn().mockResolvedValue(entity),
      };
      const tx = { getRepository: vi.fn().mockReturnValue(txRepo) };

      await sut.markAsProcessed(entity.id, tx);

      expect(tx.getRepository).toHaveBeenCalledWith(InboxEntity);
      expect(txRepo.findOne).toHaveBeenCalledWith({
        where: { id: entity.id },
      });
      expect(entity.status).toBe(InboxStatus.PROCESSED);
      expect(entity.lastError).toBeNull();
      expect(entity.processedAt).toBeInstanceOf(Date);
      expect(txRepo.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('markAsFailed', () => {
    it('does nothing when entity is not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await sut.markAsFailed('missing-id', 'boom');

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('marks entity failed, increments retryCount, and saves', async () => {
      const entity = createEntity({ retryCount: 0 });
      repo.findOne.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);

      await sut.markAsFailed(entity.id, 'handler failed');

      expect(entity.status).toBe(InboxStatus.FAILED);
      expect(entity.retryCount).toBe(1);
      expect(entity.lastError).toBe('handler failed');
      expect(repo.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('deleteProcessedBefore', () => {
    it('deletes PROCESSED inbox rows before cutoff and returns affected count', async () => {
      const before = new Date('2026-11-20T00:00:00.000Z');
      const qb = {
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 4 }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const count = await sut.deleteProcessedBefore(before);

      expect(qb.delete).toHaveBeenCalled();
      expect(qb.from).toHaveBeenCalledWith(InboxEntity);
      expect(qb.where).toHaveBeenCalledWith('status = :status', {
        status: InboxStatus.PROCESSED,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('processedAt < :before', {
        before,
      });
      expect(count).toBe(4);
    });

    it('returns 0 when affected is undefined', async () => {
      const qb = {
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({}),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const count = await sut.deleteProcessedBefore(new Date());
      expect(count).toBe(0);
    });
  });
});
