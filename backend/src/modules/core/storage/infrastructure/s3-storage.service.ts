/*
https://docs.nestjs.com/providers#services
*/

import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  Optional,
  PayloadTooLargeException,
} from '@nestjs/common';
import {
  StorageContract,
  StorageUploadPayload,
  StorageUploadResult,
  StoragePresignedUrlOptions,
  StoragePresignedDownloadResult,
  StoragePresignedUploadResult,
} from '../contracts/storage.contract';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Repository } from 'typeorm';
import { StorageObject } from '../domain/entities/storage.entity';
import { StorageObjectStatus } from '../domain/enums/storage-object-status.enum';
import { StoragePoolManagerPort } from '../application/ports/storage-pool-manager.port';

const MAX_PRESIGNED_UPLOAD_BYTES = 104_857_600;

@Injectable()
export class S3StorageService implements StorageContract {
  constructor(
    private readonly client: S3Client | undefined,
    private readonly bucket: string | undefined,
    private readonly storageRepo: Repository<StorageObject>,
    @Optional() private readonly pool?: StoragePoolManagerPort,
  ) {}

  private resolveNode(nodeId?: string): {
    client: S3Client;
    bucket: string;
    nodeId: string;
  } {
    if (this.pool) {
      const config = nodeId
        ? this.pool.getHealthyClients().find((node) => node.nodeId === nodeId)
            ?.config
        : this.pool.selectNode();
      if (!config)
        throw new Error(`No healthy storage node for ${nodeId ?? 'upload'}`);
      return {
        client: this.pool.getClientForNode(config.nodeId),
        bucket: config.bucket,
        nodeId: config.nodeId,
      };
    }
    if (!this.client || !this.bucket)
      throw new Error('Storage client is not configured');
    return { client: this.client, bucket: this.bucket, nodeId: '' };
  }

  private async resolveStorageNode(
    storageId: string,
  ): Promise<{ client: S3Client; bucket: string; nodeId: string }> {
    const storage = await this.storageRepo.findOne({
      where: { storageKey: storageId },
    });
    if (!storage)
      throw new NotFoundException(`Storage with ID ${storageId} not found`);
    return this.resolveNode(storage.storageNodeId ?? undefined);
  }

  async getUrlByStorageId(
    storageId: string,
  ): Promise<StoragePresignedDownloadResult> {
    await this.resolveStorageNode(storageId);
    return this.getPresignedDownloadUrl(storageId);
  }

  private hasConfiguredStorage(): boolean {
    return Boolean(this.pool || (this.client && this.bucket));
  }

  private isS3NotFoundError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const candidate = error as {
      name?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };
    return (
      candidate.name === 'NotFound' ||
      candidate.name === 'NoSuchKey' ||
      candidate.Code === 'NotFound' ||
      candidate.Code === 'NoSuchKey' ||
      candidate.$metadata?.httpStatusCode === 404
    );
  }

  async updateVideoStatus(
    storageKey: string,
    status: StorageObjectStatus,
  ): Promise<StorageUploadResult> {
    const storage = await this.storageRepo.findOne({
      where: { storageKey },
    });
    if (!storage) {
      throw new NotFoundException(`Storage with ID ${storageKey} not found`);
    }

    if (status === StorageObjectStatus.READY && this.hasConfiguredStorage()) {
      const node = this.resolveNode(storage.storageNodeId || undefined);
      let headResult: { ETag?: string; ContentLength?: number };
      try {
        headResult = await node.client.send(
          new HeadObjectCommand({
            Bucket: node.bucket,
            Key: storageKey,
          }),
        );
      } catch (error) {
        if (this.isS3NotFoundError(error)) {
          throw new NotFoundException(
            `Uploaded object ${storageKey} not found in storage`,
          );
        }
        throw error;
      }

      if (
        headResult?.ContentLength !== undefined &&
        headResult.ContentLength > MAX_PRESIGNED_UPLOAD_BYTES
      ) {
        throw new PayloadTooLargeException(
          `Uploaded object ${storageKey} exceeds maximum allowed size`,
        );
      }

      if (headResult?.ETag) {
        storage.etag = headResult.ETag.replace(/"/g, '');
      }
      if (headResult?.ContentLength !== undefined) {
        storage.size = String(headResult.ContentLength);
      }
    }

    storage.status = status;
    const entity = await this.storageRepo.save(storage);

    return {
      storageId: entity.storageKey,
      key: entity.storageKey,
      etag: entity.etag ?? '',
      originalName: entity.originName,
      ...(entity.storageNodeId ? { nodeId: entity.storageNodeId } : {}),
    };
  }

  async upload(payload: StorageUploadPayload): Promise<StorageUploadResult> {
    const node = this.resolveNode();
    const command = new PutObjectCommand({
      Bucket: node.bucket,
      Key: payload.key,
      Body: payload.body,
      ContentType: payload.contentType,
      ContentLength: payload.contentLength,
      CacheControl: payload.cacheControl,
      Metadata: payload.metadata,
    });

    const result = await node.client.send(command);
    const etag = (result.ETag ?? '').replace(/"/g, '');

    const record = StorageObject.create({
      storageKey: payload.key,
      originName: payload.originalName,
      bucket: node.bucket,
      contentType: payload.contentType,
      size: payload.contentLength,
      etag,
    });
    record.storageNodeId = node.nodeId;
    const entity = await this.storageRepo.save(record);

    return {
      storageId: entity.storageKey,
      key: entity.storageKey,
      etag,
      originalName: payload.originalName,
    };
  }

  async delete(storageId: string): Promise<void> {
    const node = await this.resolveStorageNode(storageId);
    await node.client.send(
      new DeleteObjectCommand({
        Bucket: node.bucket,
        Key: storageId,
      }),
    );
    await this.storageRepo.delete({ storageKey: storageId });
  }

  async exists(storageId: string): Promise<boolean> {
    try {
      const node = await this.resolveStorageNode(storageId);
      await node.client.send(
        new HeadObjectCommand({
          Bucket: node.bucket,
          Key: storageId,
        }),
      );

      return true;
    } catch {
      return false;
    }
  }

  async getPresignedDownloadUrl(
    storageId: string,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult> {
    const node = await this.resolveStorageNode(storageId);
    const command = new GetObjectCommand({
      Bucket: node.bucket,
      Key: storageId,
    });

    const url = await getSignedUrl(node.client, command, {
      expiresIn: expiresIn ?? 3600,
    });

    return { storageId, key: storageId, url, expiresIn: expiresIn ?? 3600 };
  }

  async uploadGetPresignedDownloadUrl(
    payload: StorageUploadPayload,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult> {
    const uploadResponse = await this.upload(payload);
    return this.getPresignedDownloadUrl(uploadResponse.storageId, expiresIn);
  }

  // Backwards compatibility alias
  async getPresignedDowloadUrl(
    storageId: string,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult> {
    return this.getPresignedDownloadUrl(storageId, expiresIn);
  }

  // Backwards compatibility alias
  async uploadGetPresignedDowloadUrl(
    payload: StorageUploadPayload,
    expiresIn?: number,
  ): Promise<StoragePresignedDownloadResult> {
    return this.uploadGetPresignedDownloadUrl(payload, expiresIn);
  }

  async getPresignedUploadUrl(
    storageId: string,
    options?: StoragePresignedUrlOptions,
  ): Promise<StoragePresignedUploadResult> {
    let node: { client: S3Client; bucket: string; nodeId: string };
    try {
      node = this.resolveNode();
    } catch {
      throw new HttpException(
        'No active storage node available to accept upload',
        HttpStatus.INSUFFICIENT_STORAGE,
      );
    }

    const command = new PutObjectCommand({
      Bucket: node.bucket,
      Key: storageId,
      ContentType: options?.contentType,
    });

    const url = await getSignedUrl(node.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    });

    const existing = await this.storageRepo.findOne({
      where: { storageKey: storageId },
    });

    if (existing) {
      existing.originName = options?.originalName ?? existing.originName ?? '';
      existing.bucket = node.bucket;
      existing.contentType =
        options?.contentType ??
        existing.contentType ??
        'application/octet-stream';
      if (options?.contentLength !== undefined) {
        existing.size = String(options.contentLength);
      }
      existing.etag = undefined;
      existing.storageNodeId = node.nodeId || null;
      existing.status = StorageObjectStatus.PENDING;
      await this.storageRepo.save(existing);
    } else {
      const record = StorageObject.create({
        storageKey: storageId,
        originName: options?.originalName,
        bucket: node.bucket,
        contentType: options?.contentType,
        size: options?.contentLength,
        storageNodeId: node.nodeId || null,
        status: StorageObjectStatus.PENDING,
      });
      await this.storageRepo.save(record);
    }

    return {
      storageId,
      key: storageId,
      url,
      ...(node.nodeId ? { nodeId: node.nodeId } : {}),
      options,
    };
  }
}
