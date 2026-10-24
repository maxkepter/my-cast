import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CLIENT_SERVICE,
  ClientService,
} from '../../../client/application/client-service.interface';
import {
  StorageContract,
  StoragePresignedDownloadResult,
  StoragePresignedUploadResult,
  StoragePresignedUrlOptions,
  StorageUploadPayload,
  StorageUploadResult,
} from '../contracts/storage.contract';
import {
  StorageClientException,
  StorageConnectionException,
  StorageNotFoundException,
} from '../domain/exceptions/storage-client.exception';

@Injectable()
export class HttpCloudStorageService implements StorageContract {
  private readonly logger = new Logger(HttpCloudStorageService.name);
  private readonly basePath: string;

  constructor(
    @Inject(CLIENT_SERVICE) private readonly client: ClientService,
    private readonly config: ConfigService,
  ) {
    this.basePath = this.config.get<string>(
      'BACKEND_STORAGE_PREFIX',
      '/api/v1/storage',
    );
  }

  async upload(payload: StorageUploadPayload): Promise<StorageUploadResult> {
    const url = `${this.basePath}/upload`;
    const headers = this.buildUploadHeaders(payload);

    try {
      return await this.client.post<StorageUploadResult>(url, payload.body, {
        headers,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(storageId: string): Promise<void> {
    const url = `${this.basePath}/${encodeURIComponent(storageId)}`;
    try {
      await this.client.delete(url);
    } catch (error) {
      this.handleError(error, storageId);
    }
  }

  async exists(storageId: string): Promise<boolean> {
    const url = `${this.basePath}/${encodeURIComponent(storageId)}/exists`;
    try {
      const res = await this.client.get<{ exists: boolean }>(url);
      if (res && typeof res.exists === 'boolean') {
        return res.exists;
      }
      return Boolean(res);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return false;
      }
      this.handleError(error, storageId);
    }
  }

  async getPresignedDownloadUrl(
    storageId: string,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult> {
    const url = `${this.basePath}/${encodeURIComponent(storageId)}/presigned-download`;
    try {
      return await this.client.get<StoragePresignedDownloadResult>(url, {
        params: expiresIn !== undefined ? { expiresIn } : undefined,
      });
    } catch (error) {
      this.handleError(error, storageId);
    }
  }

  async uploadGetPresignedDownloadUrl(
    payload: StorageUploadPayload,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult> {
    const url = `${this.basePath}/upload-presigned-download`;
    const headers = this.buildUploadHeaders(payload);

    try {
      return await this.client.post<StoragePresignedDownloadResult>(
        url,
        payload.body,
        {
          headers,
          params: expiresIn !== undefined ? { expiresIn } : undefined,
        },
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPresignedUploadUrl(
    storageId: string,
    options?: StoragePresignedUrlOptions,
  ): Promise<StoragePresignedUploadResult> {
    const url = `${this.basePath}/presigned-upload`;
    try {
      return await this.client.post<StoragePresignedUploadResult>(url, {
        storageId,
        options,
      });
    } catch (error) {
      this.handleError(error, storageId);
    }
  }

  async getUrlByStorageId(
    storageId: string,
  ): Promise<StoragePresignedDownloadResult> {
    const url = `${this.basePath}/${encodeURIComponent(storageId)}/url`;
    try {
      return await this.client.get<StoragePresignedDownloadResult>(url);
    } catch (error) {
      this.handleError(error, storageId);
    }
  }

  async getPresignedDowloadUrl(
    storageId: string,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult> {
    return this.getPresignedDownloadUrl(storageId, expiresIn);
  }

  async uploadGetPresignedDowloadUrl(
    payload: StorageUploadPayload,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult> {
    return this.uploadGetPresignedDownloadUrl(payload, expiresIn);
  }

  private buildUploadHeaders(
    payload: StorageUploadPayload,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'x-storage-key': payload.key,
    };
    if (payload.contentType) {
      headers['content-type'] = payload.contentType;
    }
    if (payload.contentLength !== undefined) {
      headers['content-length'] = String(payload.contentLength);
    }
    if (payload.originalName) {
      headers['x-original-name'] = payload.originalName;
    }
    if (payload.cacheControl) {
      headers['x-cache-control'] = payload.cacheControl;
    }
    if (payload.metadata) {
      headers['x-metadata'] = JSON.stringify(payload.metadata);
    }
    return headers;
  }

  private handleError(error: any, storageId?: string): never {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Storage request failed';

    if (status === 404 && storageId) {
      throw new StorageNotFoundException(storageId, error);
    }

    const isNetworkOr5xx =
      !error?.response ||
      (typeof status === 'number' && status >= 500) ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ETIMEDOUT';

    if (isNetworkOr5xx) {
      throw new StorageConnectionException(message, error);
    }

    throw new StorageClientException(message, status, error);
  }
}
