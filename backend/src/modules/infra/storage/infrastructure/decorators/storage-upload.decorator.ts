import { SetMetadata } from '@nestjs/common';
import { StorageUploadOption } from '../../application/types/storage-pool.type';

export const STORAGE_OPTIONS = 'STORAGE_OPTIONS';

export const StorageUpload = (options: StorageUploadOption[]) => {
  return SetMetadata(STORAGE_OPTIONS, options);
};
