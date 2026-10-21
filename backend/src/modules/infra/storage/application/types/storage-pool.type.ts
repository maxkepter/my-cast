import { S3Client } from '@aws-sdk/client-s3';
import type { Request } from 'express';
import { StorageNode } from '../../domain/entities/storage-node.entity';

export interface StoragePoolEntry {
  client: S3Client;
  config: StorageNode;
  isHealthy: boolean;
}

export type StoragePathResolver = (req: Request) => string;

export interface StorageUploadOption {
  field: string;
  path: string | StoragePathResolver;
}

export interface S3BucketProbeConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export interface StorageNodeDeletionSnapshot {
  usedBytes: number;
  readyObjectCount: number;
}
