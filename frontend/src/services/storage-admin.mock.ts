import {
  CreateStorageNodeInput,
  StorageAdminServiceContract,
  StorageNode,
  StorageNodeHealthRes,
  StorageNodeListQuery,
  StorageNodeListRes,
  UpdateStorageNodeInput,
} from '@/types/storage-admin';

export const mockStorageNodes: StorageNode[] = [
  {
    nodeId: 'minio-primary',
    name: 'MinIO Local Primary',
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    bucket: 'mycast-media',
    quotaBytes: 107374182400, // 100 GB
    usedBytes: 34359738368, // 32 GB (32%)
    isActive: true,
    isHealthy: true,
    createdAt: '2026-03-01T08:00:00.000Z',
  },
  {
    nodeId: 's3-backup-sg',
    name: 'AWS S3 Singapore Cold Storage',
    endpoint: 'https://s3.ap-southeast-1.amazonaws.com',
    region: 'ap-southeast-1',
    bucket: 'mycast-archive-sg',
    quotaBytes: 1099511627776, // 1 TB
    usedBytes: 879609302220, // ~819 GB (80%)
    isActive: true,
    isHealthy: true,
    createdAt: '2026-03-05T10:30:00.000Z',
  },
  {
    nodeId: 'edge-tokyo',
    name: 'Wasabi Tokyo Edge',
    endpoint: 'https://s3.ap-northeast-1.wasabisys.com',
    region: 'ap-northeast-1',
    bucket: 'mycast-tokyo',
    quotaBytes: 536870912000, // 500 GB
    usedBytes: 12000000000, // ~11.1 GB
    isActive: false,
    isHealthy: false,
    createdAt: '2026-03-10T14:15:00.000Z',
  },
];

export class MockStorageHttpError extends Error {
  response: {
    status: number;
    data: {
      code: string;
      message: string;
    };
  };

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'MockStorageHttpError';
    this.response = {
      status,
      data: { code, message },
    };
  }
}

export class MockStorageAdminService implements StorageAdminServiceContract {
  private nodes: StorageNode[];

  constructor(initialNodes: StorageNode[] = mockStorageNodes) {
    this.nodes = initialNodes.map((n) => ({ ...n }));
  }

  async list(query?: StorageNodeListQuery): Promise<StorageNodeListRes> {
    let result = [...this.nodes];

    if (query?.status) {
      const isHealthy = query.status === 'healthy';
      result = result.filter((n) => n.isHealthy === isHealthy);
    }

    if (query?.search) {
      const q = query.search.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.nodeId.toLowerCase().includes(q) ||
          n.bucket.toLowerCase().includes(q)
      );
    }

    return {
      totalNodes: result.length,
      nodes: result,
    };
  }

  async create(input: CreateStorageNodeInput): Promise<StorageNode> {
    const existing = this.nodes.find((n) => n.nodeId === input.id);
    if (existing) {
      throw new MockStorageHttpError(
        409,
        'STORAGE_NODE_ID_EXISTS',
        'Mã Node lưu trữ (ID) đã tồn tại trong hệ thống.'
      );
    }

    const newNode: StorageNode = {
      nodeId: input.id,
      name: input.name,
      endpoint: input.endpoint,
      region: input.region,
      bucket: input.bucket,
      quotaBytes: input.quotaBytes,
      usedBytes: 0,
      isActive: input.isActive,
      isHealthy: true,
      createdAt: new Date().toISOString(),
    };

    this.nodes.push(newNode);
    return { ...newNode };
  }

  async update(id: string, input: UpdateStorageNodeInput): Promise<StorageNode> {
    const index = this.nodes.findIndex((n) => n.nodeId === id);
    if (index === -1) {
      throw new MockStorageHttpError(
        404,
        'STORAGE_NODE_NOT_FOUND',
        'Không tìm thấy Node lưu trữ.'
      );
    }

    const current = this.nodes[index];
    const updated: StorageNode = {
      ...current,
      ...(input.quotaBytes !== undefined ? { quotaBytes: input.quotaBytes } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.endpoint !== undefined ? { endpoint: input.endpoint } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
      ...(input.bucket !== undefined ? { bucket: input.bucket } : {}),
    };

    this.nodes[index] = updated;
    return { ...updated };
  }

  async remove(id: string): Promise<void> {
    const index = this.nodes.findIndex((n) => n.nodeId === id);
    if (index === -1) {
      throw new MockStorageHttpError(
        404,
        'STORAGE_NODE_NOT_FOUND',
        'Không tìm thấy Node lưu trữ.'
      );
    }

    if (this.nodes[index].usedBytes > 0) {
      throw new MockStorageHttpError(
        409,
        'STORAGE_NODE_HAS_DATA',
        'Không thể xóa Node đang có dữ liệu hoặc object chưa dọn dẹp. Vui lòng di chuyển dữ liệu trước khi xóa.'
      );
    }

    this.nodes.splice(index, 1);
  }

  async healthCheck(id: string): Promise<StorageNodeHealthRes> {
    const node = this.nodes.find((n) => n.nodeId === id);
    if (!node) {
      throw new MockStorageHttpError(
        404,
        'STORAGE_NODE_NOT_FOUND',
        'Không tìm thấy Node lưu trữ.'
      );
    }

    node.isHealthy = true;
    return {
      nodeId: id,
      isHealthy: true,
      checkedAt: new Date().toISOString(),
    };
  }

  reset(nodes: StorageNode[] = mockStorageNodes): void {
    this.nodes = nodes.map((n) => ({ ...n }));
  }
}

export const mockStorageAdminService = new MockStorageAdminService();
