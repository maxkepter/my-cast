import {
  StorageContract,
  STORAGE_CONTRACT,
  StorageUploadPayload,
  StorageUploadResult,
  StoragePresignedUrlOptions,
  StoragePresignedDownloadResult,
  StoragePresignedUploadResult,
} from '../../contracts/storage.contract';

/**
 * Token injection đại diện cho port dịch vụ lưu trữ (StorageService) trong ứng dụng.
 * Tái sử dụng `STORAGE_CONTRACT` để đảm bảo tính nhất quán trên toàn hệ thống.
 */
export const STORAGE_SERVICE = STORAGE_CONTRACT;

/**
 * Port giao tiếp ứng dụng cho các tác vụ lưu trữ tệp tin.
 * Kế thừa định nghĩa hợp đồng từ `StorageContract`.
 */
export type StorageService = StorageContract;

export type {
  StorageUploadPayload,
  StorageUploadResult,
  StoragePresignedUrlOptions,
  StoragePresignedDownloadResult,
  StoragePresignedUploadResult,
};
