import { Injectable } from '@nestjs/common';
import { StorageNodeHasDataException } from '../../domain/exceptions';

@Injectable()
export class StorageNodeDeletionPolicy {
  assertDeletable(usedBytes: number, readyObjectCount: number): void {
    if (usedBytes > 0 || readyObjectCount > 0) {
      throw new StorageNodeHasDataException();
    }
  }
}
