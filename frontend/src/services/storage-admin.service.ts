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

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK_STORAGE === 'true' ||
  process.env.NODE_ENV === 'test' ||
  false;

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
    if (USE_MOCK) {
      return mockStorageAdminService.list(query);
    }
    try {
      const response = await apiClient.get<StorageNodeListRes>('/admin/storage-nodes', {
        params: query,
      });
      if (!response.data || !Array.isArray(response.data.nodes)) {
        return mockStorageAdminService.list(query);
      }
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockStorageAdminService.list(query);
      }
      throw error;
    }
  }

  async create(input: CreateStorageNodeInput): Promise<StorageNode> {
    if (USE_MOCK) {
      return mockStorageAdminService.create(input);
    }
    try {
      const response = await apiClient.post<StorageNode>('/admin/storage-nodes', input);
      if (!response.data || typeof response.data === 'string') {
        return mockStorageAdminService.create(input);
      }
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockStorageAdminService.create(input);
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateStorageNodeInput): Promise<StorageNode> {
    if (USE_MOCK) {
      return mockStorageAdminService.update(id, input);
    }
    try {
      const response = await apiClient.patch<StorageNode>(`/admin/storage-nodes/${id}`, input);
      if (!response.data || typeof response.data === 'string') {
        return mockStorageAdminService.update(id, input);
      }
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockStorageAdminService.update(id, input);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    if (USE_MOCK) {
      return mockStorageAdminService.remove(id);
    }
    try {
      await apiClient.delete(`/admin/storage-nodes/${id}`);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockStorageAdminService.remove(id);
      }
      throw error;
    }
  }

  async healthCheck(id: string): Promise<StorageNodeHealthRes> {
    if (USE_MOCK) {
      return mockStorageAdminService.healthCheck(id);
    }
    try {
      const response = await apiClient.post<StorageNodeHealthRes>(
        `/admin/storage-nodes/${id}/health-check`
      );
      if (!response.data || typeof response.data === 'string') {
        return mockStorageAdminService.healthCheck(id);
      }
      return response.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        return mockStorageAdminService.healthCheck(id);
      }
      throw error;
    }
  }
}

export const storageAdminService = new StorageAdminService();
