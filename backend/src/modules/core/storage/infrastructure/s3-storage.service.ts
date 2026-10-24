/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, NotFoundException, Optional } from '@nestjs/common';
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
import { StoragePoolManagerPort } from '../application/ports/storage-pool-manager.port';
import { StorageService } from '../application/ports/storage.interface';

@Injectable()
export class S3StorageService implements StorageContract, StorageService {
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
    const node = this.resolveNode();
    const command = new PutObjectCommand({
      Bucket: node.bucket,
      Key: storageId,
      ContentType: options?.contentType,
    });

    const url = await getSignedUrl(node.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    });

    return { storageId, key: storageId, url, options };
  }
}
