import { apiClient } from '@/lib/api-client';
import {
  CreateStorageNodeInput,
  StorageAdminServiceContract,
  StorageNode,
  StorageNodeHealthRes,
  StorageNodeListQuery,
  StorageNodeListRes,
  StorageQuotaUnit,
  UpdateStorageNodeInput,
} from '@/types/storage-admin';
import { mockStorageAdminService } from './storage-admin.mock';

export const isMockEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_MOCK_STORAGE === 'true';
};

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  if (i === 0) return `${bytes} B`;
  const val = bytes / Math.pow(k, i);
  return `${parseFloat(val.toFixed(dm))} ${sizes[i]}`;
}

export function toQuotaBytes(value: number, unit: StorageQuotaUnit): number {
  if (value <= 0 || isNaN(value)) return 0;
  const multipliers: Record<StorageQuotaUnit, number> = {
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  return Math.round(value * (multipliers[unit] ?? multipliers.GB));
}

export function getStorageNodeWebhookUrl(nodeId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${baseUrl}/videos/webhooks/s3?nodeId=${encodeURIComponent(nodeId)}`;
}

export function getStorageErrorMessage(error: unknown): string {
  if (!error) return 'Đã xảy ra lỗi không xác định';

  const axiosError = error as {
    response?: {
      status?: number;
      data?: {
        code?: string;
        message?: string | string[];
      };
    };
    message?: string;
  };

  const code = axiosError.response?.data?.code;
  const message = axiosError.response?.data?.message;

  if (code === 'STORAGE_NODE_HAS_DATA' || axiosError.response?.status === 409 && code?.includes('DATA')) {
    return 'Không thể xóa Node đang có dữ liệu hoặc object chưa dọn dẹp. Vui lòng di chuyển dữ liệu trước khi xóa.';
  }

  if (code === 'STORAGE_NODE_ID_EXISTS') {
    return 'Mã Node lưu trữ (ID) đã tồn tại trong hệ thống.';
  }

  if (code === 'STORAGE_NODE_UNREACHABLE' || axiosError.response?.status === 502) {
    return 'Không thể kết nối đến S3 endpoint hoặc bucket không hợp lệ. Vui lòng kiểm tra lại thông số.';
  }

  if (code === 'STORAGE_NODE_NOT_FOUND' || axiosError.response?.status === 404) {
    return 'Không tìm thấy Node lưu trữ được chỉ định.';
  }

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'Đã xảy ra lỗi khi thao tác với hệ thống lưu trữ.';
}

export class StorageAdminService implements StorageAdminServiceContract {
  async list(query?: StorageNodeListQuery): Promise<StorageNodeListRes> {
    if (isMockEnabled()) {
      return mockStorageAdminService.list(query);
    }
    const response = await apiClient.get<StorageNodeListRes>('/admin/storage-nodes', {
      params: query,
    });
    return response.data;
  }

  async create(input: CreateStorageNodeInput): Promise<StorageNode> {
    if (isMockEnabled()) {
      return mockStorageAdminService.create(input);
    }
    const response = await apiClient.post<StorageNode>('/admin/storage-nodes', input);
    return response.data;
  }

  async update(id: string, input: UpdateStorageNodeInput): Promise<StorageNode> {
    if (isMockEnabled()) {
      return mockStorageAdminService.update(id, input);
    }
    const response = await apiClient.patch<StorageNode>(`/admin/storage-nodes/${id}`, input);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    if (isMockEnabled()) {
      return mockStorageAdminService.remove(id);
    }
    await apiClient.delete(`/admin/storage-nodes/${id}`);
  }

  async healthCheck(id: string): Promise<StorageNodeHealthRes> {
    if (isMockEnabled()) {
      return mockStorageAdminService.healthCheck(id);
    }
    const response = await apiClient.post<StorageNodeHealthRes>(
      `/admin/storage-nodes/${id}/health-check`
    );
    return response.data;
  }
}

export const storageAdminService = new StorageAdminService();
