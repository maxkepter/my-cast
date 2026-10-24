import { Readable } from 'node:stream';

export interface StorageUploadPayload {
  key: string;
  body: Buffer | Uint8Array | Readable;
  originalName?: string;
  contentType?: string;
  contentLength?: number;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface StorageUploadResult {
  storageId: string;
  key: string;
  etag: string;
  originalName?: string;
}

export interface StoragePresignedUrlOptions {
  expiresIn?: number;
  contentType?: string;
}

export interface StoragePresignedDownloadResult {
  storageId: string;
  key: string;
  url: string;
  expiresIn?: number;
}

export interface StoragePresignedUploadResult {
  storageId: string;
  key: string;
  url: string;
  options?: StoragePresignedUrlOptions;
}

export const STORAGE_CONTRACT = Symbol('STORAGE_CONTRACT');

export interface StorageContract {
  /**
   * Tải tệp tin lên hệ thống lưu trữ (S3/MinIO) thông qua luồng dữ liệu hoặc Buffer.
   *
   * @param payload - Dữ liệu tệp tải lên (Buffer/Stream, metadata, contentType, v.v.).
   * @returns Thông tin kết quả lưu trữ gồm storageId, key, etag và tên gốc.
   */
  upload(payload: StorageUploadPayload): Promise<StorageUploadResult>;

  /**
   * Xóa một đối tượng lưu trữ khỏi hệ thống theo định danh `storageId`.
   *
   * @param storageId - Định danh duy nhất của đối tượng lưu trữ cần xóa.
   */
  delete(storageId: string): Promise<void>;

  /**
   * Kiểm tra sự tồn tại của một đối tượng lưu trữ trong hệ thống theo định danh `storageId`.
   *
   * @param storageId - Định danh đối tượng lưu trữ cần kiểm tra.
   * @returns `true` nếu đối tượng tồn tại, ngược lại trả về `false`.
   */
  exists(storageId: string): Promise<boolean>;

  /**
   * Sinh URL presigned có thời hạn cho phép client tải xuống (download/read) đối tượng lưu trữ.
   *
   * @param storageId - Định danh đối tượng lưu trữ.
   * @param expiresIn - Thời gian hiệu lực của URL tính bằng giây (mặc định cấu hình hệ thống).
   * @returns Thông tin presigned download URL và thời gian hết hạn.
   */
  getPresignedDownloadUrl(
    storageId: string,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult>;

  /**
   * Tải tệp tin lên hệ thống lưu trữ đồng thời sinh ngay presigned URL để tải về sau khi tải lên thành công.
   *
   * @param payload - Dữ liệu tệp tải lên.
   * @param expiresIn - Thời gian hiệu lực của URL download tính bằng giây.
   * @returns Kết quả chứa URL tải xuống vừa được sinh.
   */
  uploadGetPresignedDownloadUrl(
    payload: StorageUploadPayload,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult>;

  /**
   * Sinh URL presigned cho phép client tải dữ liệu trực tiếp (upload) lên storage node tương ứng.
   *
   * @param storageId - Định danh hoặc khóa đối tượng sẽ được lưu.
   * @param options - Tùy chọn cấu hình presigned upload (expiresIn, contentType).
   * @returns Thông tin presigned upload URL cho client.
   */
  getPresignedUploadUrl(
    storageId: string,
    options?: StoragePresignedUrlOptions,
  ): Promise<StoragePresignedUploadResult>;

  /**
   * Lấy URL tải xuống dựa theo `storageId` đã lưu trữ trong cơ sở dữ liệu.
   *
   * @param storageId - Định danh đối tượng lưu trữ.
   * @returns Thông tin đường dẫn tải xuống của đối tượng.
   */
  getUrlByStorageId(storageId: string): Promise<StoragePresignedDownloadResult>;

  // Backwards compatibility aliases
  /**
   * Alias tương thích ngược cho `getPresignedDownloadUrl`.
   *
   * @param storageId - Định danh đối tượng lưu trữ.
   * @param expiresIn - Thời gian hiệu lực tính bằng giây.
   */
  getPresignedDowloadUrl(
    storageId: string,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult>;

  /**
   * Alias tương thích ngược cho `uploadGetPresignedDownloadUrl`.
   *
   * @param payload - Dữ liệu tệp tải lên.
   * @param expiresIn - Thời gian hiệu lực tính bằng giây.
   */
  uploadGetPresignedDowloadUrl(
    payload: StorageUploadPayload,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult>;
}

export const MockStorageContract: StorageContract = {
  upload: async (
    payload: StorageUploadPayload,
  ): Promise<StorageUploadResult> => ({
    storageId: payload.key,
    key: payload.key,
    etag: 'mock-etag-12345',
    originalName: payload.originalName,
  }),
  delete: async (_storageId: string): Promise<void> => {},
  exists: async (_storageId: string): Promise<boolean> => true,
  getPresignedDownloadUrl: async (
    storageId: string,
    expiresIn = 3600,
  ): Promise<StoragePresignedDownloadResult> => ({
    storageId,
    key: storageId,
    url: `https://mock-storage.local/${storageId}?expires=${expiresIn}`,
    expiresIn,
  }),
  uploadGetPresignedDownloadUrl: async (
    payload: StorageUploadPayload,
    expiresIn = 3600,
  ): Promise<StoragePresignedDownloadResult> => ({
    storageId: payload.key,
    key: payload.key,
    url: `https://mock-storage.local/${payload.key}?expires=${expiresIn}`,
    expiresIn,
  }),
  getPresignedUploadUrl: async (
    storageId: string,
    options?: StoragePresignedUrlOptions,
  ): Promise<StoragePresignedUploadResult> => ({
    storageId,
    key: storageId,
    url: `https://mock-storage.local/upload/${storageId}?expires=${options?.expiresIn ?? 3600}`,
    options,
  }),
  getUrlByStorageId: async (
    storageId: string,
  ): Promise<StoragePresignedDownloadResult> => ({
    storageId,
    key: storageId,
    url: `https://mock-storage.local/${storageId}?expires=3600`,
    expiresIn: 3600,
  }),
  getPresignedDowloadUrl: async (
    storageId: string,
    expiresIn = 3600,
  ): Promise<StoragePresignedDownloadResult> => ({
    storageId,
    key: storageId,
    url: `https://mock-storage.local/${storageId}?expires=${expiresIn}`,
    expiresIn,
  }),
  uploadGetPresignedDowloadUrl: async (
    payload: StorageUploadPayload,
    expiresIn = 3600,
  ): Promise<StoragePresignedDownloadResult> => ({
    storageId: payload.key,
    key: payload.key,
    url: `https://mock-storage.local/${payload.key}?expires=${expiresIn}`,
    expiresIn,
  }),
};
