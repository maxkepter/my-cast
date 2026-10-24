import { describe, it, expect, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StorageObject } from './domain/entities/storage.entity';
import { StorageNode } from './domain/entities/storage-node.entity';
import { STORAGE_CONTRACT } from './contracts/storage.contract';
import { STORAGE_SERVICE } from './application/ports/storage.interface';
import { S3StorageService } from './infrastructure/s3-storage.service';
import { DeleteStorageHandler } from './application/handlers/delete-storage.handler';
import { StorageInterceptor } from './infrastructure/interceptors/storage.interceptor';
import { StoragePoolManager } from './application/services/storage-pool-manager';
import { StorageNodeAdminService } from './application/services/storage-node-admin.service';
import { STORAGE_NODE_ADMIN_SERVICE } from './application/ports/storage-node-admin.port';
import { STORAGE_NODE_REPOSITORY } from './domain/repositories/storage-node.repository.interface';
import { STORAGE_OBJECT_READ_REPOSITORY } from './domain/repositories/storage-object-read.repository.interface';
import { STORAGE_POOL_MANAGER } from './application/ports/storage-pool-manager.port';
import { S3_BUCKET_PROBE } from './application/ports/s3-bucket-probe.interface';
import { StorageNodeDeletionPolicy } from './application/policies/storage-node-deletion.policy';
import { StorageNodeTypeOrmRepository } from './infrastructure/repositories/storage-node.typeorm.repository';
import { StorageObjectTypeOrmReadRepository } from './infrastructure/repositories/storage-object.typeorm.repository';
import { S3BucketProbeAdapter } from './infrastructure/adapters/s3-bucket-probe.adapter';
import { StorageExceptionInterceptor } from './infrastructure/interceptors/storage-exception.interceptor';
import { StorageListener } from './infrastructure/listeners/storage.listener';
import { S3Client } from '@aws-sdk/client-s3';
import { Reflector } from '@nestjs/core';
import { DeleteStorageEvent } from './domain/events/delete-storage.event';

describe('StorageModule Dependency Resolution', () => {
  it('resolves S3StorageService, STORAGE_CONTRACT, and STORAGE_SERVICE without circular/unknown dependencies', async () => {
    const mockStorageRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockNodeRepo = {
      find: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      findAll: vi.fn(),
      findActiveNodes: vi.fn(),
      existsById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      save: vi.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StorageNodeAdminService,
        {
          provide: STORAGE_NODE_ADMIN_SERVICE,
          useExisting: StorageNodeAdminService,
        },
        StorageNodeDeletionPolicy,
        StoragePoolManager,
        S3BucketProbeAdapter,
        StorageNodeTypeOrmRepository,
        StorageObjectTypeOrmReadRepository,
        {
          provide: STORAGE_NODE_REPOSITORY,
          useExisting: StorageNodeTypeOrmRepository,
        },
        {
          provide: STORAGE_OBJECT_READ_REPOSITORY,
          useExisting: StorageObjectTypeOrmReadRepository,
        },
        { provide: S3_BUCKET_PROBE, useExisting: S3BucketProbeAdapter },
        { provide: STORAGE_POOL_MANAGER, useExisting: StoragePoolManager },
        {
          provide: S3Client,
          useValue: new S3Client({ region: 'us-east-1' }),
        },
        {
          provide: getRepositoryToken(StorageObject),
          useValue: mockStorageRepo,
        },
        {
          provide: getRepositoryToken(StorageNode),
          useValue: mockNodeRepo,
        },
        {
          provide: S3StorageService,
          inject: [S3Client, getRepositoryToken(StorageObject), StoragePoolManager],
          useFactory: (client, repository, pool) =>
            new S3StorageService(client, undefined, repository, pool),
        },
        { provide: STORAGE_CONTRACT, useExisting: S3StorageService },
        DeleteStorageHandler,
        StorageInterceptor,
        StorageExceptionInterceptor,
        StorageListener,
        Reflector,
      ],
    }).compile();

    const s3Service = moduleRef.get<S3StorageService>(S3StorageService);
    const storageContract = moduleRef.get(STORAGE_CONTRACT);
    const storageService = moduleRef.get(STORAGE_SERVICE);
    const deleteHandler = moduleRef.get(DeleteStorageHandler);
    const interceptor = moduleRef.get(StorageInterceptor);

    expect(s3Service).toBeInstanceOf(S3StorageService);
    expect(storageContract).toBe(s3Service);
    expect(storageService).toBe(s3Service);
    expect(deleteHandler).toBeInstanceOf(DeleteStorageHandler);
    expect(interceptor).toBeInstanceOf(StorageInterceptor);

    // Verify DeleteStorageHandler uses resolved storageService
    const deleteSpy = vi.spyOn(s3Service, 'delete').mockResolvedValue(undefined);
    await deleteHandler.handle(new DeleteStorageEvent(['test-key-1']));
    expect(deleteSpy).toHaveBeenCalledWith('test-key-1');
  });
});
