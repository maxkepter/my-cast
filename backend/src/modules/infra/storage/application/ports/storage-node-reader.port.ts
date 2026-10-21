import { StorageNode } from '../../domain/entities/storage-node.entity';

export const STORAGE_NODE_READER = Symbol('STORAGE_NODE_READER');

export interface StorageNodeReader {
  getNodes(): StorageNode[];
}
