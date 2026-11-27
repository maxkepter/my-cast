import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { ConfigService } from '@nestjs/config';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { LocalStorageException } from '../domain/exceptions/local-storage.exception';
import { FsLocalStorageService } from './fs-local-storage.service';

describe('FsLocalStorageService', () => {
  let service: FsLocalStorageService;
  let testBaseDir: string;
  let mockConfigService: ConfigService;

  beforeAll(async () => {
    testBaseDir = path.join(
      os.tmpdir(),
      `test-mycast-storage-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    );
    await fsPromises.mkdir(testBaseDir, { recursive: true });
  });

  afterAll(async () => {
    await fsPromises.rm(testBaseDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string, defaultValue?: unknown) => {
        if (key === 'LOCAL_STORAGE_BASE_DIR') return testBaseDir;
        return defaultValue;
      }),
    } as unknown as ConfigService;

    service = new FsLocalStorageService(mockConfigService);
  });

  describe('resolvePath', () => {
    it('should return baseDir when no paths provided', () => {
      expect(service.resolvePath()).toBe(testBaseDir);
    });

    it('should resolve relative path against baseDir', () => {
      const resolved = service.resolvePath('sub', 'file.txt');
      expect(resolved).toBe(path.resolve(testBaseDir, 'sub', 'file.txt'));
    });

    it('should preserve absolute path', () => {
      const absoluteTarget = path.resolve(os.tmpdir(), 'some-abs-file.txt');
      expect(service.resolvePath(absoluteTarget)).toBe(absoluteTarget);
    });
  });

  describe('createTempDir & ensureDir', () => {
    it('should create temporary directory with default prefix', async () => {
      const tempDir = await service.createTempDir();
      expect(path.isAbsolute(tempDir)).toBe(true);
      expect(tempDir.startsWith(testBaseDir)).toBe(true);
      expect(await service.exists(tempDir)).toBe(true);
    });

    it('should create temporary directory with custom prefix', async () => {
      const tempDir = await service.createTempDir('custom-prefix-');
      expect(path.basename(tempDir).startsWith('custom-prefix-')).toBe(true);
      expect(await service.exists(tempDir)).toBe(true);
    });

    it('should ensure nested directory recursively', async () => {
      const nested = path.join(testBaseDir, 'nested', 'level1', 'level2');
      await service.ensureDir(nested);
      expect(await service.exists(nested)).toBe(true);
    });
  });

  describe('writeFile & readFile', () => {
    it('should write and read string data', async () => {
      const filePath = path.join(testBaseDir, 'test-string.txt');
      await service.writeFile(filePath, 'hello world content');

      const buf = await service.readFile(filePath);
      expect(buf.toString('utf-8')).toBe('hello world content');
    });

    it('should write and read Buffer data', async () => {
      const filePath = path.join(testBaseDir, 'test-buffer.bin');
      const inputBuffer = Buffer.from([1, 2, 3, 4, 5]);
      await service.writeFile(filePath, inputBuffer);

      const readBuffer = await service.readFile(filePath);
      expect(readBuffer).toEqual(inputBuffer);
    });

    it('should write data from Readable stream', async () => {
      const filePath = path.join(testBaseDir, 'test-stream.txt');
      const stream = Readable.from(['chunk1-', 'chunk2-', 'chunk3']);

      await service.writeFile(filePath, stream);

      const readBuffer = await service.readFile(filePath);
      expect(readBuffer.toString('utf-8')).toBe('chunk1-chunk2-chunk3');
    });

    it('should throw LocalStorageException on reading non-existent file', async () => {
      const nonExistent = path.join(testBaseDir, 'missing-file.txt');
      await expect(service.readFile(nonExistent)).rejects.toThrow(
        LocalStorageException,
      );
    });
  });

  describe('createReadStream & createWriteStream', () => {
    it('should write through createWriteStream and read through createReadStream', async () => {
      const filePath = path.join(testBaseDir, 'stream-io', 'stream-test.txt');
      const writeStream = service.createWriteStream(filePath);

      await new Promise<void>((resolve, reject) => {
        writeStream.write('stream data', (err) => {
          if (err) reject(err);
          writeStream.end(resolve);
        });
      });

      const readStream = service.createReadStream(filePath);
      const chunks: Buffer[] = [];
      for await (const chunk of readStream) {
        chunks.push(Buffer.from(chunk));
      }
      const finalContent = Buffer.concat(chunks).toString('utf-8');
      expect(finalContent).toBe('stream data');
    });
  });

  describe('stat & exists', () => {
    it('should return correct stat for file', async () => {
      const filePath = path.join(testBaseDir, 'stat-test.txt');
      await service.writeFile(filePath, 'stat content');

      const statResult = await service.stat(filePath);
      expect(statResult.isFile).toBe(true);
      expect(statResult.isDirectory).toBe(false);
      expect(statResult.size).toBe(Buffer.byteLength('stat content'));
      expect(statResult.modifiedAt).toBeInstanceOf(Date);
    });

    it('should return false for exists on missing file', async () => {
      expect(await service.exists(path.join(testBaseDir, 'no-such-path'))).toBe(
        false,
      );
    });

    it('should throw LocalStorageException on stat for missing path', async () => {
      await expect(
        service.stat(path.join(testBaseDir, 'missing-stat-path')),
      ).rejects.toThrow(LocalStorageException);
    });
  });

  describe('listFiles', () => {
    it('should list files non-recursively and recursively', async () => {
      const listDir = path.join(testBaseDir, 'list-dir');
      const subDir = path.join(listDir, 'sub');
      await service.ensureDir(subDir);

      await service.writeFile(path.join(listDir, 'root1.txt'), 'r1');
      await service.writeFile(path.join(listDir, 'root2.txt'), 'r2');
      await service.writeFile(path.join(subDir, 'nested1.txt'), 'n1');

      const shallowFiles = await service.listFiles(listDir, false);
      expect(shallowFiles.length).toBe(2);
      expect(shallowFiles.some((f) => f.endsWith('root1.txt'))).toBe(true);
      expect(shallowFiles.some((f) => f.endsWith('root2.txt'))).toBe(true);

      const allFiles = await service.listFiles(listDir, true);
      expect(allFiles.length).toBe(3);
      expect(allFiles.some((f) => f.endsWith('nested1.txt'))).toBe(true);
    });
  });

  describe('deleteFile & deleteDir', () => {
    it('should delete file successfully and not throw when file does not exist', async () => {
      const filePath = path.join(testBaseDir, 'to-delete.txt');
      await service.writeFile(filePath, 'delete me');
      expect(await service.exists(filePath)).toBe(true);

      await service.deleteFile(filePath);
      expect(await service.exists(filePath)).toBe(false);

      // Safe delete - should not throw on second delete
      await expect(service.deleteFile(filePath)).resolves.not.toThrow();
    });

    it('should delete directory recursively', async () => {
      const dirToDelete = path.join(testBaseDir, 'dir-to-delete');
      await service.writeFile(
        path.join(dirToDelete, 'sub', 'f.txt'),
        'nested content',
      );
      expect(await service.exists(dirToDelete)).toBe(true);

      await service.deleteDir(dirToDelete);
      expect(await service.exists(dirToDelete)).toBe(false);
    });
  });

  describe('cleanupOrphanedDirs', () => {
    it('should delete orphaned dirs older than threshold and keep recent ones', async () => {
      const cleanupBase = path.join(testBaseDir, 'cleanup-workspace');
      await fsPromises.mkdir(cleanupBase, { recursive: true });

      const customConfig = {
        get: vi.fn(() => cleanupBase),
      } as unknown as ConfigService;
      const cleanupService = new FsLocalStorageService(customConfig);

      const oldDir = path.join(cleanupBase, 'job-old');
      const recentDir = path.join(cleanupBase, 'job-recent');
      await fsPromises.mkdir(oldDir, { recursive: true });
      await fsPromises.mkdir(recentDir, { recursive: true });

      await fsPromises.writeFile(
        path.join(oldDir, 'old-file.ts'),
        'old content test',
      );
      await fsPromises.writeFile(
        path.join(recentDir, 'recent-file.ts'),
        'recent content',
      );

      // Set mtime of oldDir to 3 hours ago
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      await fsPromises.utimes(oldDir, threeHoursAgo, threeHoursAgo);

      const result = await cleanupService.cleanupOrphanedDirs(
        2 * 60 * 60 * 1000,
      );

      expect(result.deletedDirsCount).toBe(1);
      expect(result.deletedFilesCount).toBe(1);
      expect(result.freedBytes).toBe(Buffer.byteLength('old content test'));

      expect(await cleanupService.exists(oldDir)).toBe(false);
      expect(await cleanupService.exists(recentDir)).toBe(true);
    });

    it('should return zero result when baseDir does not exist', async () => {
      const nonExistentBase = path.join(testBaseDir, 'non-existent-base-dir');
      const emptyConfig = {
        get: vi.fn(() => nonExistentBase),
      } as unknown as ConfigService;
      const emptyService = new FsLocalStorageService(emptyConfig);

      const result = await emptyService.cleanupOrphanedDirs();
      expect(result).toEqual({
        deletedDirsCount: 0,
        deletedFilesCount: 0,
        freedBytes: 0,
      });
    });
  });
});
