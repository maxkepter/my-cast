import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InboxRepository } from '../../domain/repositories/inbox.repository.interface';
import { InboxEntity } from '../../domain/entities/inbox.entity';
import { InboxStatus } from '../../domain/enums/inbox-status.enum';
import { InboxCreateReq } from '../../dtos/req.dto';
import { InboxRes } from '../../dtos/res.dto';

/** TypeORM-backed implementation of {@link InboxRepository} with idempotent insert and optional transaction support. */
@Injectable()
export class TypeOrmInboxRepository implements InboxRepository {
  constructor(
    @InjectRepository(InboxEntity)
    private readonly repository: Repository<InboxEntity>,
  ) {}

  private getRepo(tx?: unknown): Repository<InboxEntity> {
    if (tx instanceof EntityManager) {
      return tx.getRepository(InboxEntity);
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
            entity: typeof InboxEntity,
          ) => Repository<InboxEntity>;
        }
      ).getRepository(InboxEntity);
    }
    return this.repository;
  }

  private toRes(entity: InboxEntity): InboxRes {
    return {
      id: entity.id,
      eventId: entity.eventId,
      consumer: entity.consumer,
      eventType: entity.eventType,
      payload: entity.payload,
      transport: entity.transport,
      source: entity.source,
      status: entity.status,
      retryCount: entity.retryCount,
      lastError: entity.lastError ?? null,
      processedAt: entity.processedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async tryInsert(req: InboxCreateReq, tx?: unknown): Promise<boolean> {
    const repo = this.getRepo(tx);
    const result = await repo
      .createQueryBuilder()
      .insert()
      .into(InboxEntity)
      .values(InboxEntity.create(req))
      .orIgnore()
      .execute();

    return (result.identifiers?.filter(Boolean).length ?? 0) > 0;
  }

  async findByEventAndConsumer(
    eventId: string,
    consumer: string,
  ): Promise<InboxRes | null> {
    const entity = await this.repository.findOne({
      where: { eventId, consumer },
    });
    return entity ? this.toRes(entity) : null;
  }

  async markAsProcessed(id: string, tx?: unknown): Promise<void> {
    const repo = this.getRepo(tx);
    const entity = await repo.findOne({ where: { id } });
    if (!entity) {
      return;
    }
    entity.markProcessed();
    await repo.save(entity);
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      return;
    }
    entity.markFailed(error);
    await this.repository.save(entity);
  }

  async deleteProcessedBefore(before: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(InboxEntity)
      .where('status = :status', { status: InboxStatus.PROCESSED })
      .andWhere('processedAt < :before', { before })
      .execute();

    return result.affected ?? 0;
  }
}
