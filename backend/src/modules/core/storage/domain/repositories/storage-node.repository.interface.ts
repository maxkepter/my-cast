import { UpdateStorageNodeReq } from '../../dtos/req.dto';
import { StorageNode } from '../entities/storage-node.entity';

export interface StorageNodeRepository {
  findById(nodeId: string): Promise<StorageNode | null>;
  findAll(): Promise<StorageNode[]>;
  findActiveNodes(): Promise<StorageNode[]>;
  existsById(nodeId: string): Promise<boolean>;
  create(input: Partial<StorageNode>): StorageNode;
  update(nodeId: string, changes: UpdateStorageNodeReq | { isHealthy: boolean }): Promise<StorageNode | null>;
  delete(nodeId: string): Promise<void>;
  save(node: StorageNode): Promise<StorageNode>;
}

export const STORAGE_NODE_REPOSITORY = Symbol('STORAGE_NODE_REPOSITORY');
