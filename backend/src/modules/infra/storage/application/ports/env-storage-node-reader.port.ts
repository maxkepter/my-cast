import { StorageNode } from '../../domain/entities/storage-node.entity';

export const ENV_STORAGE_NODE_READER = Symbol('ENV_STORAGE_NODE_READER');

export interface EnvStorageNodeReaderPort {
  getNodes(): StorageNode[];
}
