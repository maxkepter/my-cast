import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LocalFileStat,
  LocalStorageCleanResult,
  LocalStorageService,
} from '../contracts/local-storage.contract';
import { LocalStorageException } from '../domain/exceptions/local-storage.exception';

@Injectable()
export class FsLocalStorageService implements LocalStorageService {
  private readonly logger = new Logger(FsLocalStorageService.name);
  private readonly baseDir: string;

  constructor(private readonly config: ConfigService) {
    this.baseDir = this.config.get<string>(
      'LOCAL_STORAGE_BASE_DIR',
      path.join(os.tmpdir(), 'mycast-transcode'),
    );
  }

  async createTempDir(prefix = 'job-'): Promise<string> {
    try {
      await this.ensureDir(this.baseDir);
      const tempPath = await fsPromises.mkdtemp(
        path.join(this.baseDir, prefix),
      );
      return path.resolve(tempPath);
    } catch (error) {
      if (error instanceof LocalStorageException) throw error;
      throw new LocalStorageException(
        `Failed to create temporary directory with prefix "${prefix}"`,
        error,
      );
    }
  }

  async ensureDir(dirPath: string): Promise<void> {
    try {
      const resolved = this.resolvePath(dirPath);
      await fsPromises.mkdir(resolved, { recursive: true });
    } catch (error) {
      throw new LocalStorageException(
        `Failed to ensure directory at "${dirPath}"`,
        error,
      );
    }
  }

  async writeFile(
    filePath: string,
    data: Buffer | Uint8Array | string | Readable,
  ): Promise<string> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      await this.ensureDir(path.dirname(resolvedPath));

      if (
        data instanceof Readable ||
        (typeof data === 'object' &&
          data !== null &&
          'pipe' in data &&
          typeof (data as { pipe: unknown }).pipe === 'function')
      ) {
        await pipeline(data as Readable, fs.createWriteStream(resolvedPath));
      } else {
        await fsPromises.writeFile(resolvedPath, data);
      }
      return resolvedPath;
    } catch (error) {
      if (error instanceof LocalStorageException) throw error;
      throw new LocalStorageException(
        `Failed to write file at "${filePath}"`,
        error,
      );
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      return await fsPromises.readFile(resolvedPath);
    } catch (error) {
      throw new LocalStorageException(
        `Failed to read file at "${filePath}"`,
        error,
      );
    }
  }

  createReadStream(filePath: string): Readable {
    const resolvedPath = this.resolvePath(filePath);
    return fs.createReadStream(resolvedPath);
  }

  createWriteStream(filePath: string): Writable {
    const resolvedPath = this.resolvePath(filePath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    return fs.createWriteStream(resolvedPath);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(filePath);
      await fsPromises.rm(resolvedPath, { force: true });
    } catch (error) {
      throw new LocalStorageException(
        `Failed to delete file at "${filePath}"`,
        error,
      );
    }
  }

  async deleteDir(dirPath: string): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(dirPath);
      await fsPromises.rm(resolvedPath, { recursive: true, force: true });
    } catch (error) {
      throw new LocalStorageException(
        `Failed to delete directory at "${dirPath}"`,
        error,
      );
    }
  }

  async exists(targetPath: string): Promise<boolean> {
    try {
      const resolvedPath = this.resolvePath(targetPath);
      await fsPromises.access(resolvedPath);
      return true;
    } catch {
      return false;
    }
  }

  async stat(targetPath: string): Promise<LocalFileStat> {
    try {
      const resolvedPath = this.resolvePath(targetPath);
      const s = await fsPromises.stat(resolvedPath);
      return {
        size: s.size,
        isDirectory: s.isDirectory(),
        isFile: s.isFile(),
        modifiedAt: s.mtime,
      };
    } catch (error) {
      throw new LocalStorageException(`Failed to stat "${targetPath}"`, error);
    }
  }

  async listFiles(dirPath: string, recursive = false): Promise<string[]> {
    try {
      const resolvedDir = this.resolvePath(dirPath);
      const collect = async (currentDir: string): Promise<string[]> => {
        const entries = await fsPromises.readdir(currentDir, {
          withFileTypes: true,
        });
        const files: string[] = [];
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (recursive) {
              const subFiles = await collect(fullPath);
              files.push(...subFiles);
            }
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
        return files;
      };
      return await collect(resolvedDir);
    } catch (error) {
      throw new LocalStorageException(
        `Failed to list files in "${dirPath}"`,
        error,
      );
    }
  }

  resolvePath(...paths: string[]): string {
    if (paths.length === 0) {
      return this.baseDir;
    }
    if (path.isAbsolute(paths[0])) {
      return path.resolve(...paths);
    }
    return path.resolve(this.baseDir, ...paths);
  }

  async cleanupOrphanedDirs(
    maxAgeMs = 2 * 60 * 60 * 1000,
  ): Promise<LocalStorageCleanResult> {
    try {
      const isBaseExists = await this.exists(this.baseDir);
      if (!isBaseExists) {
        return { deletedDirsCount: 0, deletedFilesCount: 0, freedBytes: 0 };
      }

      const now = Date.now();
      const entries = await fsPromises.readdir(this.baseDir, {
        withFileTypes: true,
      });
      let deletedDirsCount = 0;
      let deletedFilesCount = 0;
      let freedBytes = 0;

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const dirFullPath = path.join(this.baseDir, entry.name);
        try {
          const s = await fsPromises.stat(dirFullPath);
          const ageMs = now - s.mtime.getTime();

          if (ageMs > maxAgeMs) {
            const files = await this.listFiles(dirFullPath, true);
            for (const file of files) {
              try {
                const fStat = await fsPromises.stat(file);
                freedBytes += fStat.size;
                deletedFilesCount++;
              } catch {
                // Ignore stat errors for individual files
              }
            }
            await fsPromises.rm(dirFullPath, { recursive: true, force: true });
            deletedDirsCount++;
          }
        } catch (dirErr) {
          this.logger.warn(
            `Failed to cleanup orphaned directory at ${dirFullPath}: ${dirErr}`,
          );
        }
      }

      return { deletedDirsCount, deletedFilesCount, freedBytes };
    } catch (error) {
      throw new LocalStorageException(
        'Failed to cleanup orphaned directories',
        error,
      );
    }
  }
}
