import { S3Client } from '@aws-sdk/client-s3';
import { StorageNode } from '../../domain/entities/storage-node.entity';

export const STORAGE_POOL_MANAGER = Symbol('STORAGE_POOL_MANAGER');

export interface StoragePoolManagerPort {
  loadNode(node: StorageNode): Promise<void> | void;
  refreshNode(node: StorageNode): Promise<void> | void;
  removeNode(id: string): Promise<void> | void;
  getClientForNode(nodeId: string): S3Client;
  selectNode(): StorageNode;
  getHealthyClients(): Array<{
    nodeId: string;
    client: S3Client;
    config: StorageNode;
  }>;
}

// Backwards compatibility alias for port name
export type StoragePoolManager = StoragePoolManagerPort;
