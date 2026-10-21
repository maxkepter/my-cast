import { Injectable } from '@nestjs/common';
import { StorageNodeSource } from '../../domain/enums/storage-node-source.enum';
import { StorageLoadMode } from '../../domain/enums/storage-mode.enum';
export type StorageMode = StorageLoadMode;
export const StorageMode = StorageLoadMode;
import {
  EnvStorageNodeReadOnlyException,
  StorageModeReadOnlyException,
} from '../../domain/exceptions';

@Injectable()
export class StorageModePolicy {
  assertDbWriteAllowed(mode: StorageMode): void {
    if (mode === StorageMode.ENV) {
      throw new StorageModeReadOnlyException();
    }
  }

  assertNodeWritable(mode: StorageMode, source: StorageNodeSource): void {
    if (source === StorageNodeSource.ENV) {
      throw new EnvStorageNodeReadOnlyException();
    }
    this.assertDbWriteAllowed(mode);
  }

  allowsSource(mode: StorageMode, source: StorageNodeSource): boolean {
    return (
      mode === StorageMode.BOTH ||
      (mode as unknown as StorageNodeSource) === source
    );
  }
}
