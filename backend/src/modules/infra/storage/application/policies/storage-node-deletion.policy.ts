import { Injectable } from '@nestjs/common';
import { StorageNodeHasDataException } from '../../domain/exceptions';
import { StorageNodeDeletionSnapshot } from '../types/storage-pool.type';

export type { StorageNodeDeletionSnapshot };

@Injectable()
export class StorageNodeDeletionPolicy {
  assertDeletable(snapshot: StorageNodeDeletionSnapshot): void {
    if (snapshot.usedBytes > 0 || snapshot.readyObjectCount > 0) {
      throw new StorageNodeHasDataException();
    }
  }
}
