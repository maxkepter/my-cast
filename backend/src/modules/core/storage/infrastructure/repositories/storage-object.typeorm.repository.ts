import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageObject } from '../../domain/entities/storage.entity';
import { StorageObjectReadRepository } from '../../domain/repositories/storage-object-read.repository.interface';

@Injectable()
export class StorageObjectTypeOrmReadRepository implements StorageObjectReadRepository {
  constructor(
    @InjectRepository(StorageObject)
    private readonly repository: Repository<StorageObject>,
  ) {}

  countReadyByNodeId(nodeId: string): Promise<number> {
    return this.repository.count({
      where: { storageNodeId: nodeId, status: 'READY' },
    });
  }

  async sumReadyBytesByNodeId(nodeId: string): Promise<number> {
    const result: { total: string | null } | undefined = await this.repository
      .createQueryBuilder('storage')
      .select('COALESCE(SUM(CAST(storage.size AS BIGINT)), 0)', 'total')
      .where('storage.storageNodeId = :nodeId', { nodeId })
      .andWhere('storage.status = :status', { status: 'READY' })
      .getRawOne();

    const total = Number(result?.total ?? 0);
    if (!Number.isSafeInteger(total)) {
      throw new RangeError(
        `READY storage byte total for node ${nodeId} exceeds the safe integer range`,
      );
    }
    return total;
  }
}
