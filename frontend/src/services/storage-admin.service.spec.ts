import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import {
  formatBytes,
  getStorageErrorMessage,
  StorageAdminService,
  storageAdminService,
  toQuotaBytes,
} from './storage-admin.service';
import {
  MockStorageAdminService,
  mockStorageAdminService,
  mockStorageNodes,
} from './storage-admin.mock';
import {
  CreateStorageNodeInput,
  StorageNode,
  StorageNodeHealthRes,
  StorageNodeListRes,
  UpdateStorageNodeInput,
} from '@/types/storage-admin';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Storage Admin Helpers', () => {
  describe('formatBytes', () => {
    it('formats 0 and invalid numbers correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(-100)).toBe('0 B');
      expect(formatBytes(NaN)).toBe('0 B');
    });

    it('formats small byte values without unit change', () => {
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(1023)).toBe('1023 B');
    });

    it('formats exact powers of 1024 correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });

    it('formats mock node sizes matching plan', () => {
      expect(formatBytes(107374182400)).toBe('100 GB');
      expect(formatBytes(34359738368)).toBe('32 GB');
      expect(formatBytes(536870912000)).toBe('500 GB');
      expect(formatBytes(12000000000)).toBe('11.18 GB');
    });

    it('respects decimal places parameter', () => {
      expect(formatBytes(12000000000, 1)).toBe('11.2 GB');
      expect(formatBytes(12000000000, 0)).toBe('11 GB');
    });
  });

  describe('toQuotaBytes', () => {
    it('converts GB to bytes accurately', () => {
      expect(toQuotaBytes(100, 'GB')).toBe(107374182400);
      expect(toQuotaBytes(500, 'GB')).toBe(536870912000);
      expect(toQuotaBytes(1, 'GB')).toBe(1073741824);
    });

    it('converts TB to bytes accurately', () => {
      expect(toQuotaBytes(1, 'TB')).toBe(1099511627776);
      expect(toQuotaBytes(2, 'TB')).toBe(2199023255552);
    });

    it('handles zero and negative inputs gracefully', () => {
      expect(toQuotaBytes(0, 'GB')).toBe(0);
      expect(toQuotaBytes(-10, 'GB')).toBe(0);
      expect(toQuotaBytes(NaN, 'TB')).toBe(0);
    });
  });

  describe('getStorageErrorMessage', () => {
    it('maps STORAGE_NODE_HAS_DATA error code', () => {
      const error = {
        response: {
          status: 409,
          data: { code: 'STORAGE_NODE_HAS_DATA' },
        },
      };
      expect(getStorageErrorMessage(error)).toBe(
        'Không thể xóa Node đang có dữ liệu hoặc object chưa dọn dẹp. Vui lòng di chuyển dữ liệu trước khi xóa.'
      );
    });

    it('maps STORAGE_NODE_ID_EXISTS error code', () => {
      const error = {
        response: {
          status: 409,
          data: { code: 'STORAGE_NODE_ID_EXISTS' },
        },
      };
      expect(getStorageErrorMessage(error)).toBe(
        'Mã Node lưu trữ (ID) đã tồn tại trong hệ thống.'
      );
    });

    it('maps STORAGE_NODE_UNREACHABLE error code and 502 status', () => {
      const error = {
        response: {
          status: 502,
          data: { code: 'STORAGE_NODE_UNREACHABLE' },
        },
      };
      expect(getStorageErrorMessage(error)).toBe(
        'Không thể kết nối đến S3 endpoint hoặc bucket không hợp lệ. Vui lòng kiểm tra lại thông số.'
      );
    });

    it('maps STORAGE_NODE_NOT_FOUND error code and 404 status', () => {
      const error = {
        response: {
          status: 404,
          data: { code: 'STORAGE_NODE_NOT_FOUND' },
        },
      };
      expect(getStorageErrorMessage(error)).toBe(
        'Không tìm thấy Node lưu trữ được chỉ định.'
      );
    });

    it('maps validation errors with array of strings', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: ['endpoint must be an URL address', 'quotaBytes must be at least 0'],
          },
        },
      };
      expect(getStorageErrorMessage(error)).toBe(
        'endpoint must be an URL address, quotaBytes must be at least 0'
      );
    });

    it('falls back to error message or default message', () => {
      expect(getStorageErrorMessage({ message: 'Network Error' })).toBe('Network Error');
      expect(getStorageErrorMessage(null)).toBe('Đã xảy ra lỗi không xác định');
      expect(getStorageErrorMessage({})).toBe('Đã xảy ra lỗi khi thao tác với hệ thống lưu trữ.');
    });
  });
});

describe('StorageAdminService (API Client)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports singleton instance storageAdminService', () => {
    expect(storageAdminService).toBeInstanceOf(StorageAdminService);
  });

  it('calls GET /admin/storage-nodes with query params in list()', async () => {
    const mockRes: StorageNodeListRes = {
      totalNodes: 3,
      nodes: mockStorageNodes,
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockRes });

    const query = { status: 'healthy' as const, search: 'minio' };
    const result = await storageAdminService.list(query);

    expect(apiClient.get).toHaveBeenCalledWith('/admin/storage-nodes', {
      params: query,
    });
    expect(result).toEqual(mockRes);
  });

  it('calls POST /admin/storage-nodes in create()', async () => {
    const input: CreateStorageNodeInput = {
      id: 'node-new',
      name: 'New Node',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      bucket: 'mycast-new',
      forcePathStyle: true,
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      quotaBytes: 107374182400,
      isActive: true,
    };
    const createdNode: StorageNode = {
      nodeId: input.id,
      name: input.name,
      endpoint: input.endpoint,
      region: input.region,
      bucket: input.bucket,
      quotaBytes: input.quotaBytes,
      usedBytes: 0,
      isActive: true,
      isHealthy: true,
      createdAt: '2026-03-24T00:00:00.000Z',
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: createdNode });

    const result = await storageAdminService.create(input);

    expect(apiClient.post).toHaveBeenCalledWith('/admin/storage-nodes', input);
    expect(result).toEqual(createdNode);
  });

  it('calls PATCH /admin/storage-nodes/:id in update()', async () => {
    const updateInput: UpdateStorageNodeInput = {
      quotaBytes: 214748364800,
      isActive: false,
    };
    const updatedNode: StorageNode = {
      ...mockStorageNodes[0],
      quotaBytes: 214748364800,
      isActive: false,
    };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: updatedNode });

    const result = await storageAdminService.update('minio-primary', updateInput);

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/admin/storage-nodes/minio-primary',
      updateInput
    );
    expect(result).toEqual(updatedNode);
  });

  it('calls DELETE /admin/storage-nodes/:id in remove()', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined });

    await storageAdminService.remove('minio-primary');

    expect(apiClient.delete).toHaveBeenCalledWith('/admin/storage-nodes/minio-primary');
  });

  it('calls POST /admin/storage-nodes/:id/health-check in healthCheck()', async () => {
    const mockHealth: StorageNodeHealthRes = {
      nodeId: 'minio-primary',
      isHealthy: true,
      checkedAt: '2026-03-24T12:00:00.000Z',
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockHealth });

    const result = await storageAdminService.healthCheck('minio-primary');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/storage-nodes/minio-primary/health-check'
    );
    expect(result).toEqual(mockHealth);
  });
});

describe('MockStorageAdminService', () => {
  let mockService: MockStorageAdminService;

  beforeEach(() => {
    mockService = new MockStorageAdminService();
    mockStorageAdminService.reset();
  });

  it('exports singleton mockStorageAdminService', async () => {
    expect(mockStorageAdminService).toBeInstanceOf(MockStorageAdminService);
    const res = await mockStorageAdminService.list();
    expect(res.totalNodes).toBe(3);
  });

  it('initializes with mockStorageNodes', async () => {
    const res = await mockService.list();
    expect(res.totalNodes).toBe(3);
    expect(res.nodes).toHaveLength(3);
  });

  it('filters nodes by health status and search query', async () => {
    const healthyRes = await mockService.list({ status: 'healthy' });
    expect(healthyRes.nodes.every((n) => n.isHealthy)).toBe(true);

    const unhealthyRes = await mockService.list({ status: 'unhealthy' });
    expect(unhealthyRes.nodes.every((n) => !n.isHealthy)).toBe(true);
    expect(unhealthyRes.nodes[0].nodeId).toBe('edge-tokyo');

    const searchRes = await mockService.list({ search: 'wasabi' });
    expect(searchRes.nodes).toHaveLength(1);
    expect(searchRes.nodes[0].nodeId).toBe('edge-tokyo');
  });

  it('creates new node and prevents duplicate id', async () => {
    const input: CreateStorageNodeInput = {
      id: 'new-mock-node',
      name: 'New Mock Node',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      bucket: 'mock-bucket',
      forcePathStyle: true,
      accessKeyId: 'key',
      secretAccessKey: 'sec',
      quotaBytes: 107374182400,
      isActive: true,
    };

    const created = await mockService.create(input);
    expect(created.nodeId).toBe('new-mock-node');

    await expect(mockService.create(input)).rejects.toThrow();
  });

  it('updates an existing node', async () => {
    const updated = await mockService.update('minio-primary', {
      isActive: false,
      quotaBytes: 200000000000,
    });
    expect(updated.isActive).toBe(false);
    expect(updated.quotaBytes).toBe(200000000000);
  });

  it('refuses deletion when node has data', async () => {
    await expect(mockService.remove('minio-primary')).rejects.toThrow();
  });

  it('allows deletion when node has 0 used bytes', async () => {
    const input: CreateStorageNodeInput = {
      id: 'empty-node',
      name: 'Empty Node',
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      bucket: 'empty-bucket',
      forcePathStyle: true,
      accessKeyId: 'key',
      secretAccessKey: 'sec',
      quotaBytes: 107374182400,
      isActive: true,
    };
    await mockService.create(input);

    await expect(mockService.remove('empty-node')).resolves.toBeUndefined();
    const res = await mockService.list({ search: 'empty-node' });
    expect(res.nodes).toHaveLength(0);
  });

  it('performs healthCheck and updates node status', async () => {
    const health = await mockService.healthCheck('edge-tokyo');
    expect(health.isHealthy).toBe(true);

    const res = await mockService.list({ search: 'edge-tokyo' });
    expect(res.nodes[0].isHealthy).toBe(true);
  });
});
