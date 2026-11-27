import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  HttpException,
  HttpStatus,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { StoragePoolManagerPort } from '../application/ports/storage-pool-manager.port';
import { StorageNode } from '../domain/entities/storage-node.entity';
import { StorageObject } from '../domain/entities/storage.entity';
import { StorageObjectStatus } from '../domain/enums/storage-object-status.enum';
import { S3StorageService } from './s3-storage.service';

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}));

describe('S3StorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSignedUrl).mockResolvedValue(
      'https://s3.local/mycast/videos/sample.mp4?X-Amz-Signature=abc',
    );
  });

  describe('getPresignedUploadUrl', () => {
    it('persists PENDING StorageObject and returns presigned upload URL with nodeId', async () => {
      const s3Client = { send: vi.fn() } as unknown as S3Client;
      const node = {
        nodeId: 'node-1',
        bucket: 'mycast-bucket',
      } as StorageNode;

      const pool = {
        selectNode: vi.fn().mockReturnValue(node),
        getClientForNode: vi.fn().mockReturnValue(s3Client),
        getHealthyClients: vi.fn().mockReturnValue([
          { nodeId: 'node-1', client: s3Client, config: node },
        ]),
      } as unknown as StoragePoolManagerPort;

      const savedEntities: StorageObject[] = [];
      const storageRepo = {
        findOne: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockImplementation(async (record: StorageObject) => {
          savedEntities.push(record);
          return record;
        }),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(
        undefined,
        undefined,
        storageRepo,
        pool,
      );

      const options = {
        expiresIn: 900,
        contentType: 'video/mp4',
        originalName: 'demo.mp4',
        contentLength: 2048,
      };
      const result = await service.getPresignedUploadUrl(
        'videos/vid-1/video',
        options,
      );

      expect(getSignedUrl).toHaveBeenCalledTimes(1);
      const [signedClient, signedCommand, signOpts] =
        vi.mocked(getSignedUrl).mock.calls[0];
      expect(signedClient).toBe(s3Client);
      expect(signedCommand).toBeInstanceOf(PutObjectCommand);
      expect(signOpts).toEqual({ expiresIn: 900 });

      expect(savedEntities).toHaveLength(1);
      expect(savedEntities[0]).toMatchObject({
        storageKey: 'videos/vid-1/video',
        originName: 'demo.mp4',
        bucket: 'mycast-bucket',
        contentType: 'video/mp4',
        size: '2048',
        storageNodeId: 'node-1',
        status: StorageObjectStatus.PENDING,
      });

      expect(result).toEqual({
        storageId: 'videos/vid-1/video',
        key: 'videos/vid-1/video',
        url: 'https://s3.local/mycast/videos/sample.mp4?X-Amz-Signature=abc',
        nodeId: 'node-1',
        options,
      });
    });

    it('upserts existing StorageObject back to PENDING with default expiresIn 3600', async () => {
      const s3Client = { send: vi.fn() } as unknown as S3Client;
      const existing = StorageObject.create({
        storageKey: 'videos/vid-1/video',
        originName: 'old.mp4',
        bucket: 'old-bucket',
        contentType: 'video/mp4',
        etag: 'stale-etag',
        storageNodeId: 'node-old',
        status: StorageObjectStatus.FAILED,
      });

      const storageRepo = {
        findOne: vi.fn().mockResolvedValue(existing),
        save: vi.fn().mockImplementation(async (record: StorageObject) => record),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(s3Client, 'direct-bucket', storageRepo);

      const result = await service.getPresignedUploadUrl('videos/vid-1/video', {
        contentType: 'video/webm',
        originalName: 'retry.webm',
        contentLength: 4096,
      });

      expect(vi.mocked(getSignedUrl).mock.calls[0][2]).toEqual({
        expiresIn: 3600,
      });
      expect(existing.status).toBe(StorageObjectStatus.PENDING);
      expect(existing.originName).toBe('retry.webm');
      expect(existing.bucket).toBe('direct-bucket');
      expect(existing.contentType).toBe('video/webm');
      expect(existing.size).toBe('4096');
      expect(existing.etag).toBeUndefined();
      expect(existing.storageNodeId).toBeNull();
      expect(result).toEqual({
        storageId: 'videos/vid-1/video',
        key: 'videos/vid-1/video',
        url: 'https://s3.local/mycast/videos/sample.mp4?X-Amz-Signature=abc',
        options: {
          contentType: 'video/webm',
          originalName: 'retry.webm',
          contentLength: 4096,
        },
      });
    });

    it('throws 507 INSUFFICIENT_STORAGE when no healthy storage node is available', async () => {
      const pool = {
        selectNode: vi.fn(() => {
          throw new Error('No healthy active storage nodes are available');
        }),
        getHealthyClients: vi.fn().mockReturnValue([]),
      } as unknown as StoragePoolManagerPort;

      const storageRepo = {
        findOne: vi.fn(),
        save: vi.fn(),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(
        undefined,
        undefined,
        storageRepo,
        pool,
      );

      await expect(
        service.getPresignedUploadUrl('videos/vid-1/video'),
      ).rejects.toMatchObject({
        status: HttpStatus.INSUFFICIENT_STORAGE,
        message: 'No active storage node available to accept upload',
      });
      await expect(
        service.getPresignedUploadUrl('videos/vid-1/video'),
      ).rejects.toBeInstanceOf(HttpException);
      expect(storageRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateVideoStatus', () => {
    it('updates status and returns StorageUploadResult when S3 client/pool is unconfigured', async () => {
      const entity = StorageObject.create({
        storageKey: 'videos/sample.mp4',
        originName: 'sample.mp4',
        bucket: 'mycast',
        etag: 'etag-123',
        status: StorageObjectStatus.PENDING,
      });

      const storageRepo = {
        findOne: vi.fn().mockResolvedValue(entity),
        save: vi.fn().mockImplementation(async (record: StorageObject) => record),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(undefined, undefined, storageRepo);

      const result = await service.updateVideoStatus(
        'videos/sample.mp4',
        StorageObjectStatus.READY,
      );

      expect(storageRepo.findOne).toHaveBeenCalledWith({
        where: { storageKey: 'videos/sample.mp4' },
      });
      expect(entity.status).toBe(StorageObjectStatus.READY);
      expect(storageRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual({
        storageId: 'videos/sample.mp4',
        key: 'videos/sample.mp4',
        etag: 'etag-123',
        originalName: 'sample.mp4',
      });
    });

    it('verifies S3 object with HeadObjectCommand and backfills etag & size on READY', async () => {
      const entity = StorageObject.create({
        storageKey: 'videos/vid-1/video',
        originName: 'sample.mp4',
        bucket: 'mycast-bucket',
        storageNodeId: 'node-1',
        status: StorageObjectStatus.PENDING,
      });

      const s3Send = vi.fn().mockResolvedValue({
        ETag: '"etag-from-s3"',
        ContentLength: 5242880,
      });
      const s3Client = { send: s3Send } as unknown as S3Client;
      const node = {
        nodeId: 'node-1',
        bucket: 'mycast-bucket',
      } as StorageNode;
      const pool = {
        getHealthyClients: vi
          .fn()
          .mockReturnValue([
            { nodeId: 'node-1', client: s3Client, config: node },
          ]),
        getClientForNode: vi.fn().mockReturnValue(s3Client),
      } as unknown as StoragePoolManagerPort;

      const storageRepo = {
        findOne: vi.fn().mockResolvedValue(entity),
        save: vi.fn().mockImplementation(async (record: StorageObject) => record),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(
        undefined,
        undefined,
        storageRepo,
        pool,
      );

      const result = await service.updateVideoStatus(
        'videos/vid-1/video',
        StorageObjectStatus.READY,
      );

      expect(s3Send).toHaveBeenCalledTimes(1);
      expect(s3Send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
      expect(entity.status).toBe(StorageObjectStatus.READY);
      expect(entity.etag).toBe('etag-from-s3');
      expect(entity.size).toBe('5242880');
      expect(storageRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual({
        storageId: 'videos/vid-1/video',
        key: 'videos/vid-1/video',
        etag: 'etag-from-s3',
        originalName: 'sample.mp4',
        nodeId: 'node-1',
      });
    });

    it('throws NotFoundException when S3 HeadObjectCommand returns 404 NotFound on READY', async () => {
      const entity = StorageObject.create({
        storageKey: 'videos/vid-missing/video',
        originName: 'missing.mp4',
        bucket: 'mycast-bucket',
        storageNodeId: 'node-1',
        status: StorageObjectStatus.PENDING,
      });

      const notFoundError = Object.assign(new Error('NotFound'), {
        name: 'NotFound',
        $metadata: { httpStatusCode: 404 },
      });
      const s3Client = {
        send: vi.fn().mockRejectedValue(notFoundError),
      } as unknown as S3Client;
      const node = {
        nodeId: 'node-1',
        bucket: 'mycast-bucket',
      } as StorageNode;
      const pool = {
        getHealthyClients: vi
          .fn()
          .mockReturnValue([
            { nodeId: 'node-1', client: s3Client, config: node },
          ]),
        getClientForNode: vi.fn().mockReturnValue(s3Client),
      } as unknown as StoragePoolManagerPort;

      const storageRepo = {
        findOne: vi.fn().mockResolvedValue(entity),
        save: vi.fn(),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(
        undefined,
        undefined,
        storageRepo,
        pool,
      );

      await expect(
        service.updateVideoStatus(
          'videos/vid-missing/video',
          StorageObjectStatus.READY,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(storageRepo.save).not.toHaveBeenCalled();
    });

    it('throws PayloadTooLargeException when S3 object exceeds 104_857_600 bytes on READY', async () => {
      const entity = StorageObject.create({
        storageKey: 'videos/vid-huge/video',
        originName: 'huge.mp4',
        bucket: 'mycast-bucket',
        status: StorageObjectStatus.PENDING,
      });

      const s3Client = {
        send: vi.fn().mockResolvedValue({
          ETag: '"huge-etag"',
          ContentLength: 104_857_601,
        }),
      } as unknown as S3Client;

      const storageRepo = {
        findOne: vi.fn().mockResolvedValue(entity),
        save: vi.fn(),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(
        s3Client,
        'mycast-bucket',
        storageRepo,
      );

      await expect(
        service.updateVideoStatus(
          'videos/vid-huge/video',
          StorageObjectStatus.READY,
        ),
      ).rejects.toThrow(PayloadTooLargeException);
      expect(storageRepo.save).not.toHaveBeenCalled();
    });

    it('updates status to FAILED without calling HeadObjectCommand and preserves nodeId', async () => {
      const entity = StorageObject.create({
        storageKey: 'videos/vid-fail/video',
        originName: 'fail.mp4',
        bucket: 'mycast-bucket',
        etag: 'etag-999',
        storageNodeId: 'node-2',
        status: StorageObjectStatus.READY,
      });

      const s3Send = vi.fn();
      const s3Client = { send: s3Send } as unknown as S3Client;

      const storageRepo = {
        findOne: vi.fn().mockResolvedValue(entity),
        save: vi.fn().mockImplementation(async (record: StorageObject) => record),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(
        s3Client,
        'mycast-bucket',
        storageRepo,
      );

      const result = await service.updateVideoStatus(
        'videos/vid-fail/video',
        StorageObjectStatus.FAILED,
      );

      expect(s3Send).not.toHaveBeenCalled();
      expect(entity.status).toBe(StorageObjectStatus.FAILED);
      expect(storageRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual({
        storageId: 'videos/vid-fail/video',
        key: 'videos/vid-fail/video',
        etag: 'etag-999',
        originalName: 'fail.mp4',
        nodeId: 'node-2',
      });
    });

    it('throws NotFoundException when storageKey does not exist', async () => {
      const storageRepo = {
        findOne: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      } as unknown as Repository<StorageObject>;

      const service = new S3StorageService(undefined, undefined, storageRepo);

      await expect(
        service.updateVideoStatus('missing-key', StorageObjectStatus.FAILED),
      ).rejects.toThrow(NotFoundException);
      expect(storageRepo.save).not.toHaveBeenCalled();
    });
  });
});
