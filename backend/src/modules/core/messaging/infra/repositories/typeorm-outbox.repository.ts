import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OutboxRepository } from '../../domain/repositories/outbox.repository.interface';
import { OutboxEntity } from '../../domain/entities/outbox.entity';
import { OutboxStatus } from '../../domain/enums/outbox-status.enum';
import { OutboxCreateReq } from '../../dtos/req.dto';
import { OutboxRes } from '../../dtos/res.dto';

/** TypeORM-backed implementation of {@link OutboxRepository} supporting optional transaction propagation. */
@Injectable()
export class TypeOrmOutboxRepository implements OutboxRepository {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly repository: Repository<OutboxEntity>,
  ) {}

  private getRepo(tx?: unknown): Repository<OutboxEntity> {
    if (tx instanceof EntityManager) {
      return tx.getRepository(OutboxEntity);
    }
    if (
      typeof tx === 'object' &&
      tx !== null &&
      'getRepository' in tx &&
      typeof (tx as { getRepository: unknown }).getRepository === 'function'
    ) {
      return (
        tx as {
          getRepository: (
            entity: typeof OutboxEntity,
          ) => Repository<OutboxEntity>;
        }
      ).getRepository(OutboxEntity);
    }
    return this.repository;
  }

  private toRes(entity: OutboxEntity): OutboxRes {
    return {
      id: entity.id,
      eventId: entity.eventId,
      eventType: entity.eventType,
      payload: entity.payload,
      transport: entity.transport,
      destination: entity.destination,
      status: entity.status,
      retryCount: entity.retryCount,
      lastError: entity.lastError ?? null,
      processedAt: entity.processedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async save(req: OutboxCreateReq, tx?: unknown): Promise<OutboxRes> {
    const repo = this.getRepo(tx);
    const saved = await repo.save(OutboxEntity.create(req));
    return this.toRes(saved);
  }

  async saveMany(reqs: OutboxCreateReq[], tx?: unknown): Promise<OutboxRes[]> {
    if (reqs.length === 0) {
      return [];
    }
    const repo = this.getRepo(tx);
    const entities = reqs.map((req) => OutboxEntity.create(req));
    const saved = await repo.save(entities);
    return saved.map((entity) => this.toRes(entity));
  }

  async markAsProcessed(eventId: string): Promise<OutboxRes | null> {
    const entity = await this.repository.findOne({ where: { eventId } });
    if (!entity) {
      return null;
    }
    entity.markProcessed();
    const saved = await this.repository.save(entity);
    return this.toRes(saved);
  }

  async markAsFailed(
    eventId: string,
    error?: string,
  ): Promise<OutboxRes | null> {
    const entity = await this.repository.findOne({ where: { eventId } });
    if (!entity) {
      return null;
    }
    entity.markFailed(error);
    const saved = await this.repository.save(entity);
    return this.toRes(saved);
  }

  async markByIdAsProcessed(
    id: string,
    tx?: unknown,
  ): Promise<OutboxRes | null> {
    const repo = this.getRepo(tx);
    const entity = await repo.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    entity.markProcessed();
    const saved = await repo.save(entity);
    return this.toRes(saved);
  }

  async markByIdAsFailed(
    id: string,
    error?: string,
    tx?: unknown,
  ): Promise<OutboxRes | null> {
    const repo = this.getRepo(tx);
    const entity = await repo.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    entity.markFailed(error);
    const saved = await repo.save(entity);
    return this.toRes(saved);
  }

  async claimPendingOutboxMessages(
    limit: number,
    maxRetryCount = 5,
    tx?: unknown,
  ): Promise<OutboxRes[]> {
    const runClaim = async (
      repo: Repository<OutboxEntity>,
    ): Promise<OutboxRes[]> => {
      const entities = await repo
        .createQueryBuilder('outbox')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where('outbox.status IN (:...statuses)', {
          statuses: [OutboxStatus.PENDING, OutboxStatus.FAILED],
        })
        .andWhere('outbox.retryCount < :maxRetryCount', { maxRetryCount })
        .orderBy('outbox.createdAt', 'ASC')
        .take(limit)
        .getMany();

      if (entities.length === 0) {
        return [];
      }

      const ids = entities.map((entity) => entity.id);
      const now = new Date();
      await repo
        .createQueryBuilder()
        .update(OutboxEntity)
        .set({ status: OutboxStatus.PROCESSING, updatedAt: now })
        .whereInIds(ids)
        .execute();

      return entities.map((entity) => {
        entity.status = OutboxStatus.PROCESSING;
        entity.updatedAt = now;
        return this.toRes(entity);
      });
    };

    if (tx) {
      return runClaim(this.getRepo(tx));
    }

    return this.repository.manager.transaction((em) =>
      runClaim(em.getRepository(OutboxEntity)),
    );
  }

  async getPendingOutboxMessages(
    limit: number,
    maxRetryCount: number,
  ): Promise<OutboxRes[]> {
    const entities = await this.repository
      .createQueryBuilder('outbox')
      .where('outbox.status IN (:...statuses)', {
        statuses: [OutboxStatus.PENDING, OutboxStatus.FAILED],
      })
      .andWhere('outbox.retryCount < :maxRetryCount', { maxRetryCount })
      .orderBy('outbox.createdAt', 'ASC')
      .take(limit)
      .getMany();

    return entities.map((entity) => this.toRes(entity));
  }

  async releaseStuckMessages(olderThan: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(OutboxEntity)
      .set({ status: OutboxStatus.PENDING, updatedAt: new Date() })
      .where('status IN (:...statuses)', {
        statuses: [
          OutboxStatus.FAILED,
          OutboxStatus.PENDING,
          OutboxStatus.PROCESSING,
        ],
      })
      .andWhere('updatedAt < :olderThan', { olderThan })
      .execute();

    return result.affected ?? 0;
  }

  async deleteProcessedBefore(date: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(OutboxEntity)
      .where('status = :status', { status: OutboxStatus.PROCESSED })
      .andWhere('processedAt < :date', { date })
      .execute();

    return result.affected ?? 0;
  }
}
