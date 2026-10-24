import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageModule } from './storage.module';
import {
  LOCAL_STORAGE_SERVICE,
  LocalStorageService,
} from './local-storage/contracts/local-storage.contract';
import {
  CLOUD_STORAGE_SERVICE,
  STORAGE_CONTRACT,
  StorageContract,
} from './cloud-storage/contracts/storage.contract';
import { FsLocalStorageService } from './local-storage/services/fs-local-storage.service';
import { HttpCloudStorageService } from './cloud-storage/services/http-cloud-storage.service';

@Module({
  imports: [StorageModule],
})
class TestConsumerModule {}

describe('StorageModule Integration', () => {
  let moduleRef: TestingModule;
  let consumerModuleRef: TestingModule;
  let localStorageService: LocalStorageService;
  let storageContract: StorageContract;
  let cloudStorageService: StorageContract;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [StorageModule],
    }).compile();

    consumerModuleRef = await Test.createTestingModule({
      imports: [TestConsumerModule],
    }).compile();

    localStorageService = moduleRef.get<LocalStorageService>(
      LOCAL_STORAGE_SERVICE,
    );
    storageContract = moduleRef.get<StorageContract>(STORAGE_CONTRACT);
    cloudStorageService = moduleRef.get<StorageContract>(CLOUD_STORAGE_SERVICE);
  });

  afterAll(async () => {
    await moduleRef.close();
    await consumerModuleRef.close();
  });

  describe('Dependency Injection Resolution', () => {
    it('should successfully resolve LOCAL_STORAGE_SERVICE token to FsLocalStorageService', () => {
      expect(localStorageService).toBeDefined();
      expect(localStorageService).toBeInstanceOf(FsLocalStorageService);
    });

    it('should successfully resolve STORAGE_CONTRACT and CLOUD_STORAGE_SERVICE to HttpCloudStorageService', () => {
      expect(storageContract).toBeDefined();
      expect(storageContract).toBeInstanceOf(HttpCloudStorageService);
      expect(cloudStorageService).toBeDefined();
      expect(cloudStorageService).toBeInstanceOf(HttpCloudStorageService);
      expect(storageContract).toBe(cloudStorageService);
    });

    it('should resolve exported storage tokens in an importing downstream module', () => {
      const consumerLocalStorage = consumerModuleRef.get<LocalStorageService>(
        LOCAL_STORAGE_SERVICE,
      );
      const consumerStorageContract =
        consumerModuleRef.get<StorageContract>(STORAGE_CONTRACT);
      const consumerCloudStorage = consumerModuleRef.get<StorageContract>(
        CLOUD_STORAGE_SERVICE,
      );

      expect(consumerLocalStorage).toBeDefined();
      expect(consumerLocalStorage).toBeInstanceOf(FsLocalStorageService);
      expect(consumerStorageContract).toBeDefined();
      expect(consumerStorageContract).toBeInstanceOf(HttpCloudStorageService);
      expect(consumerCloudStorage).toBeDefined();
      expect(consumerCloudStorage).toBeInstanceOf(HttpCloudStorageService);
    });
  });

  describe('LocalStorageService File System Execution', () => {
    it('should create directory, write and read file, then clean up recursively', async () => {
      const tempDir = await localStorageService.createTempDir(
        'storage-integ-test-',
      );
      expect(await localStorageService.exists(tempDir)).toBe(true);

      const filePath = localStorageService.resolvePath(
        tempDir,
        'nested',
        'file.txt',
      );
      const fileData = 'integration test payload content';

      await localStorageService.writeFile(filePath, fileData);
      expect(await localStorageService.exists(filePath)).toBe(true);

      const buffer = await localStorageService.readFile(filePath);
      expect(buffer.toString('utf-8')).toBe(fileData);

      const stat = await localStorageService.stat(filePath);
      expect(stat.isFile).toBe(true);
      expect(stat.size).toBe(Buffer.byteLength(fileData));

      await localStorageService.deleteDir(tempDir);
      expect(await localStorageService.exists(tempDir)).toBe(false);
    });
  });

  describe('StorageContract Method Availability', () => {
    it('should expose all required contract methods on resolved HttpCloudStorageService', () => {
      expect(typeof storageContract.upload).toBe('function');
      expect(typeof storageContract.delete).toBe('function');
      expect(typeof storageContract.exists).toBe('function');
      expect(typeof storageContract.getPresignedDownloadUrl).toBe('function');
      expect(typeof storageContract.uploadGetPresignedDownloadUrl).toBe(
        'function',
      );
      expect(typeof storageContract.getPresignedUploadUrl).toBe('function');
      expect(typeof storageContract.getUrlByStorageId).toBe('function');
      expect(typeof storageContract.getPresignedDowloadUrl).toBe('function');
      expect(typeof storageContract.uploadGetPresignedDowloadUrl).toBe(
        'function',
      );
    });
  });
});
