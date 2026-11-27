import { EntityManager, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransportType } from '../../contracts/topology-registry/topology-registry';
import { OutboxEntity } from '../../domain/entities/outbox.entity';
import { OutboxStatus } from '../../domain/enums/outbox-status.enum';
import { OutboxCreateReq } from '../../dtos/req.dto';
import { TypeOrmOutboxRepository } from './typeorm-outbox.repository';

function createReq(overrides: Partial<OutboxCreateReq> = {}): OutboxCreateReq {
  return {
    eventId: '11111111-1111-4111-8111-111111111111',
    eventType: 'video.uploaded',
    payload: JSON.stringify({ videoId: 'v-1' }),
    transport: TransportType.RABBITMQ,
    destination: 'video.exchange',
    ...overrides,
  };
}

function createEntity(overrides: Partial<OutboxEntity> = {}): OutboxEntity {
  const entity = OutboxEntity.create(createReq());
  entity.id = 'outbox-uuid-1';
  entity.createdAt = new Date('2026-11-26T00:00:00.000Z');
  entity.updatedAt = new Date('2026-11-26T00:00:00.000Z');
  Object.assign(entity, overrides);
  return entity;
}

describe('TypeOrmOutboxRepository', () => {
  let repo: {
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
    manager: { transaction: ReturnType<typeof vi.fn> };
  };
  let sut: TypeOrmOutboxRepository;

  beforeEach(() => {
    repo = {
      save: vi.fn(),
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
      manager: {
        transaction: vi.fn(),
      },
    };
    sut = new TypeOrmOutboxRepository(
      repo as unknown as Repository<OutboxEntity>,
    );
  });

  describe('save', () => {
    it('persists a new outbox entity on the default repository and maps to OutboxRes', async () => {
      const req = createReq();
      const saved = createEntity();
      repo.save.mockResolvedValue(saved);

      const res = await sut.save(req);

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(repo.save.mock.calls[0][0]).toBeInstanceOf(OutboxEntity);
      expect(res).toEqual({
        id: saved.id,
        eventId: saved.eventId,
        eventType: saved.eventType,
        payload: saved.payload,
        transport: saved.transport,
        destination: saved.destination,
        status: OutboxStatus.PENDING,
        retryCount: 0,
        lastError: null,
        processedAt: null,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      });
    });

    it('uses the transactional repository when duck-typed tx is provided', async () => {
      const txRepo = { save: vi.fn().mockResolvedValue(createEntity()) };
      const tx = { getRepository: vi.fn().mockReturnValue(txRepo) };

      await sut.save(createReq(), tx);

      expect(tx.getRepository).toHaveBeenCalledWith(OutboxEntity);
      expect(txRepo.save).toHaveBeenCalledTimes(1);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('uses the transactional repository when EntityManager instance is provided', async () => {
      const txRepo = { save: vi.fn().mockResolvedValue(createEntity()) };
      const getRepositorySpy = vi.fn().mockReturnValue(txRepo);
      const em = Object.create(EntityManager.prototype) as EntityManager;
      em.getRepository = getRepositorySpy;

      await sut.save(createReq(), em);

      expect(getRepositorySpy).toHaveBeenCalledWith(OutboxEntity);
      expect(txRepo.save).toHaveBeenCalledTimes(1);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('saveMany', () => {
    it('returns an empty array without hitting the repository when reqs is empty', async () => {
      const res = await sut.saveMany([]);
      expect(res).toEqual([]);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('saves all entities via tx repository and maps them to OutboxRes[]', async () => {
      const reqs = [
        createReq({ eventId: '11111111-1111-4111-8111-111111111111' }),
        createReq({ eventId: '22222222-2222-4222-8222-222222222222' }),
      ];
      const saved = reqs.map((r) => createEntity({ eventId: r.eventId }));
      const txRepo = { save: vi.fn().mockResolvedValue(saved) };
      const tx = { getRepository: vi.fn().mockReturnValue(txRepo) };

      const res = await sut.saveMany(reqs, tx);

      expect(tx.getRepository).toHaveBeenCalledWith(OutboxEntity);
      expect(txRepo.save).toHaveBeenCalledTimes(1);
      expect(res).toHaveLength(2);
      expect(res.map((r) => r.eventId)).toEqual([
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
      ]);
    });
  });

  describe('markAsProcessed', () => {
    it('returns null when no matching outbox record exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const res = await sut.markAsProcessed('missing-id');

      expect(res).toBeNull();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('marks entity processed, saves, and returns OutboxRes', async () => {
      const entity = createEntity({ lastError: 'old error' });
      repo.findOne.mockResolvedValue(entity);
      repo.save.mockImplementation(async (e: OutboxEntity) => e);

      const res = await sut.markAsProcessed(entity.eventId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { eventId: entity.eventId },
      });
      expect(res?.status).toBe(OutboxStatus.PROCESSED);
      expect(res?.lastError).toBeNull();
      expect(res?.processedAt).toBeInstanceOf(Date);
    });
  });

  describe('markAsFailed', () => {
    it('returns null when no matching outbox record exists', async () => {
      repo.findOne.mockResolvedValue(null);

      const res = await sut.markAsFailed('missing-id', 'boom');

      expect(res).toBeNull();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('marks entity failed, increments retryCount, and records error', async () => {
      const entity = createEntity({ retryCount: 1 });
      repo.findOne.mockResolvedValue(entity);
      repo.save.mockImplementation(async (e: OutboxEntity) => e);

      const res = await sut.markAsFailed(entity.eventId, 'broker timeout');

      expect(res?.status).toBe(OutboxStatus.FAILED);
      expect(res?.retryCount).toBe(2);
      expect(res?.lastError).toBe('broker timeout');
    });
  });

  describe('getPendingOutboxMessages', () => {
    it('queries PENDING and FAILED messages below maxRetryCount ordered by createdAt ASC', async () => {
      const entities = [createEntity()];
      const qb = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(entities),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const res = await sut.getPendingOutboxMessages(25, 5);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('outbox');
      expect(qb.where).toHaveBeenCalledWith(
        'outbox.status IN (:...statuses)',
        {
          statuses: [OutboxStatus.PENDING, OutboxStatus.FAILED],
        },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'outbox.retryCount < :maxRetryCount',
        { maxRetryCount: 5 },
      );
      expect(qb.orderBy).toHaveBeenCalledWith('outbox.createdAt', 'ASC');
      expect(qb.take).toHaveBeenCalledWith(25);
      expect(res).toHaveLength(1);
      expect(res[0].eventId).toBe(entities[0].eventId);
    });
  });

  describe('releaseStuckMessages', () => {
    it('resets stuck messages updated before olderThan and returns affected count', async () => {
      const olderThan = new Date('2026-11-26T10:00:00.000Z');
      const qb = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 3 }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const count = await sut.releaseStuckMessages(olderThan);

      expect(qb.update).toHaveBeenCalledWith(OutboxEntity);
      expect(qb.where).toHaveBeenCalledWith('status IN (:...statuses)', {
        statuses: [
          OutboxStatus.FAILED,
          OutboxStatus.PENDING,
          OutboxStatus.PROCESSING,
        ],
      });
      expect(qb.andWhere).toHaveBeenCalledWith('updatedAt < :olderThan', {
        olderThan,
      });
      expect(count).toBe(3);
    });

    it('returns 0 when affected is undefined', async () => {
      const qb = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({}),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const count = await sut.releaseStuckMessages(new Date());
      expect(count).toBe(0);
    });
  });

  describe('deleteProcessedBefore', () => {
    it('deletes PROCESSED messages before date and returns affected count', async () => {
      const cutoff = new Date('2026-11-20T00:00:00.000Z');
      const qb = {
        delete: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 7 }),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const count = await sut.deleteProcessedBefore(cutoff);

      expect(qb.delete).toHaveBeenCalled();
      expect(qb.from).toHaveBeenCalledWith(OutboxEntity);
      expect(qb.where).toHaveBeenCalledWith('status = :status', {
        status: OutboxStatus.PROCESSED,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('processedAt < :date', {
        date: cutoff,
      });
      expect(count).toBe(7);
    });
  });

  describe('markByIdAsProcessed', () => {
    it('returns null when no row matches id', async () => {
      repo.findOne.mockResolvedValue(null);

      const res = await sut.markByIdAsProcessed('missing-uuid');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'missing-uuid' },
      });
      expect(res).toBeNull();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('marks matching row processed and returns OutboxRes', async () => {
      const entity = createEntity({
        id: 'row-1',
        status: OutboxStatus.PROCESSING,
      });
      repo.findOne.mockResolvedValue(entity);
      repo.save.mockImplementation(async (e: OutboxEntity) => e);

      const res = await sut.markByIdAsProcessed('row-1');

      expect(res?.id).toBe('row-1');
      expect(res?.status).toBe(OutboxStatus.PROCESSED);
      expect(res?.processedAt).toBeInstanceOf(Date);
    });
  });

  describe('markByIdAsFailed', () => {
    it('returns null when no row matches id', async () => {
      repo.findOne.mockResolvedValue(null);

      const res = await sut.markByIdAsFailed('missing-uuid', 'err');

      expect(res).toBeNull();
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('increments retryCount, sets FAILED status, and records error by id', async () => {
      const entity = createEntity({
        id: 'row-2',
        status: OutboxStatus.PROCESSING,
        retryCount: 2,
      });
      repo.findOne.mockResolvedValue(entity);
      repo.save.mockImplementation(async (e: OutboxEntity) => e);

      const res = await sut.markByIdAsFailed('row-2', 'redis down');

      expect(res?.id).toBe('row-2');
      expect(res?.status).toBe(OutboxStatus.FAILED);
      expect(res?.retryCount).toBe(3);
      expect(res?.lastError).toBe('redis down');
    });
  });

  describe('claimPendingOutboxMessages', () => {
    it('returns empty array when no pending messages are locked', async () => {
      const selectQb = {
        setLock: vi.fn().mockReturnThis(),
        setOnLocked: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };
      const txRepo = {
        createQueryBuilder: vi.fn().mockReturnValue(selectQb),
      };
      const em = {
        getRepository: vi.fn().mockReturnValue(txRepo),
      };
      repo.manager.transaction.mockImplementation(
        async (cb: (m: typeof em) => Promise<unknown>) => cb(em),
      );

      const res = await sut.claimPendingOutboxMessages(50, 5);

      expect(res).toEqual([]);
      expect(selectQb.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(selectQb.setOnLocked).toHaveBeenCalledWith('skip_locked');
      expect(txRepo.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('claims rows with FOR UPDATE SKIP LOCKED and updates status to PROCESSING', async () => {
      const e1 = createEntity({ id: 'outbox-1' });
      const e2 = createEntity({ id: 'outbox-2' });
      const selectQb = {
        setLock: vi.fn().mockReturnThis(),
        setOnLocked: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([e1, e2]),
      };
      const updateQb = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        whereInIds: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 2 }),
      };
      const txRepo = {
        createQueryBuilder: vi
          .fn()
          .mockReturnValueOnce(selectQb)
          .mockReturnValueOnce(updateQb),
      };
      const em = {
        getRepository: vi.fn().mockReturnValue(txRepo),
      };
      repo.manager.transaction.mockImplementation(
        async (cb: (m: typeof em) => Promise<unknown>) => cb(em),
      );

      const res = await sut.claimPendingOutboxMessages(100, 5);

      expect(updateQb.update).toHaveBeenCalledWith(OutboxEntity);
      expect(updateQb.set).toHaveBeenCalledWith({
        status: OutboxStatus.PROCESSING,
        updatedAt: expect.any(Date),
      });
      expect(updateQb.whereInIds).toHaveBeenCalledWith([
        'outbox-1',
        'outbox-2',
      ]);
      expect(res).toHaveLength(2);
      expect(res[0].status).toBe(OutboxStatus.PROCESSING);
      expect(res[1].status).toBe(OutboxStatus.PROCESSING);
    });
  });
});
