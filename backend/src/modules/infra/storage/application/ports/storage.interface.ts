import {
  StorageContract,
  STORAGE_CONTRACT,
  StorageUploadPayload,
  StorageUploadResult,
  StoragePresignedUrlOptions,
  StoragePresignedDownloadResult,
  StoragePresignedUploadResult,
} from '../../contracts/storage.contract';

export const STORAGE_SERVICE = STORAGE_CONTRACT;
export type StorageService = StorageContract;

export type {
  StorageUploadPayload,
  StorageUploadResult,
  StoragePresignedUrlOptions,
  StoragePresignedDownloadResult,
  StoragePresignedUploadResult,
};
