export interface StorageNode {
  nodeId: string;
  name: string;
  endpoint: string;
  region: string;
  bucket: string;
  quotaBytes: number;
  usedBytes: number;
  isActive: boolean;
  isHealthy: boolean;
  createdAt: string;
}

export interface StorageNodeListRes {
  totalNodes: number;
  nodes: StorageNode[];
}

export interface CreateStorageNodeInput {
  id: string;
  name: string;
  endpoint: string;
  region: string;
  bucket: string;
  forcePathStyle: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  quotaBytes: number;
  isActive: boolean;
}

export interface UpdateStorageNodeInput {
  quotaBytes?: number;
  isActive?: boolean;
  endpoint?: string;
  region?: string;
  bucket?: string;
  forcePathStyle?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface StorageNodeHealthRes {
  nodeId: string;
  isHealthy: boolean;
  checkedAt: string;
}

export interface StorageNodeListQuery {
  status?: 'healthy' | 'unhealthy';
  search?: string;
}

export type StorageQuotaUnit = 'GB' | 'TB';

export interface StorageApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface StorageAdminServiceContract {
  list(query?: StorageNodeListQuery): Promise<StorageNodeListRes>;
  create(input: CreateStorageNodeInput): Promise<StorageNode>;
  update(id: string, input: UpdateStorageNodeInput): Promise<StorageNode>;
  remove(id: string): Promise<void>;
  healthCheck(id: string): Promise<StorageNodeHealthRes>;
}
