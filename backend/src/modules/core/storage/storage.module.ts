import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../features/auth/auth.module';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageObject } from './domain/entities/storage.entity';
import { StorageNode } from './domain/entities/storage-node.entity';
import { S3Client } from '@aws-sdk/client-s3';

import { StorageAdminController } from './infrastructure/controllers/storage-admin.controller';
import { S3StorageService } from './infrastructure/s3-storage.service';
import { StorageInterceptor } from './infrastructure/interceptors/storage.interceptor';
import { StorageExceptionInterceptor } from './infrastructure/interceptors/storage-exception.interceptor';
import { StorageListener } from './infrastructure/listeners/storage.listener';
import { DeleteStorageHandler } from './application/handlers/delete-storage.handler';
import { STORAGE_SERVICE } from './application/ports/storage.interface';
import { STORAGE_CONTRACT } from './contracts/storage.contract';
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

@Global()
@Module({
  imports: [
    AuthModule,
    ConfigModule,
    TypeOrmModule.forFeature([StorageObject, StorageNode]),
  ],
  controllers: [StorageAdminController],
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
      useFactory: () => new S3Client({ region: 'us-east-1' }),
    },
    {
      provide: S3StorageService,
      inject: [S3Client, getRepositoryToken(StorageObject), StoragePoolManager],
      useFactory: (
        client: S3Client,
        repository: Repository<StorageObject>,
        pool: StoragePoolManager,
      ) => new S3StorageService(client, undefined, repository, pool),
    },
    { provide: STORAGE_CONTRACT, useExisting: S3StorageService },
    DeleteStorageHandler,
    StorageInterceptor,
    StorageExceptionInterceptor,
    StorageListener,
  ],
  exports: [
    STORAGE_CONTRACT,
    STORAGE_SERVICE,
    S3StorageService,
    STORAGE_NODE_ADMIN_SERVICE,
    StorageNodeAdminService,
    STORAGE_POOL_MANAGER,
    StoragePoolManager,
    DeleteStorageHandler,
    StorageInterceptor,
    StorageExceptionInterceptor,
    StorageListener,
  ],
})
export class StorageModule {}
