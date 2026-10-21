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
  upload(payload: StorageUploadPayload): Promise<StorageUploadResult>;
  delete(storageId: string): Promise<void>;
  exists(storageId: string): Promise<boolean>;
  getPresignedDownloadUrl(
    storageId: string,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult>;
  uploadGetPresignedDownloadUrl(
    payload: StorageUploadPayload,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult>;
  getPresignedUploadUrl(
    storageId: string,
    options?: StoragePresignedUrlOptions,
  ): Promise<StoragePresignedUploadResult>;
  getUrlByStorageId(storageId: string): Promise<StoragePresignedDownloadResult>;

  // Backwards compatibility aliases
  getPresignedDowloadUrl(
    storageId: string,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult>;
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
