import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ClientService } from '../../../../infra/client/application/client-service.interface';
import { HttpCloudStorageService } from './http-cloud-storage.service';
import {
  StorageClientException,
  StorageConnectionException,
  StorageNotFoundException,
} from '../domain/exceptions/storage-client.exception';
import {
  MockStorageContract,
  StorageUploadPayload,
} from '../contracts/storage.contract';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('HttpCloudStorageService', () => {
  let service: HttpCloudStorageService;
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let mockConfig: {
    get: ReturnType<typeof vi.fn>;
  };

  const mockedAxiosGet = vi.mocked(axios.get);

  beforeEach(() => {
    mockedAxiosGet.mockReset();

    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    mockConfig = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'BACKEND_STORAGE_PREFIX') return '/api/v1/storage';
        return defaultValue;
      }),
    };

    service = new HttpCloudStorageService(
      mockClient as unknown as ClientService,
      mockConfig as unknown as ConfigService,
    );
  });

  describe('upload', () => {
    it('should upload payload with headers and return result', async () => {
      const payload: StorageUploadPayload = {
        key: 'videos/test.mp4',
        body: Buffer.from('test-video-content'),
        originalName: 'source.mp4',
        contentType: 'video/mp4',
        contentLength: 18,
        cacheControl: 'public, max-age=3600',
        metadata: { resolution: '1080p' },
      };

      const expectedResult = {
        storageId: 's-123',
        key: 'videos/test.mp4',
        etag: 'etag-abc',
        originalName: 'source.mp4',
      };

      mockClient.post.mockResolvedValueOnce(expectedResult);

      const result = await service.upload(payload);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/storage/upload',
        payload.body,
        {
          headers: {
            'x-storage-key': 'videos/test.mp4',
            'content-type': 'video/mp4',
            'content-length': '18',
            'x-original-name': 'source.mp4',
            'x-cache-control': 'public, max-age=3600',
            'x-metadata': JSON.stringify({ resolution: '1080p' }),
          },
        },
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    it('should send delete request with encoded storageId', async () => {
      mockClient.delete.mockResolvedValueOnce(undefined);

      await service.delete('folder/item#1');

      expect(mockClient.delete).toHaveBeenCalledWith(
        '/api/v1/storage/folder%2Fitem%231',
      );
    });
  });

  describe('exists', () => {
    it('should return true when backend returns exists true', async () => {
      mockClient.get.mockResolvedValueOnce({ exists: true });

      const result = await service.exists('obj-1');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/storage/obj-1/exists',
      );
      expect(result).toBe(true);
    });

    it('should return false when backend returns exists false', async () => {
      mockClient.get.mockResolvedValueOnce({ exists: false });

      const result = await service.exists('obj-1');

      expect(result).toBe(false);
    });

    it('should return false when backend responds with 404', async () => {
      mockClient.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Not found' } },
      });

      const result = await service.exists('obj-1');

      expect(result).toBe(false);
    });

    it('should throw StorageConnectionException on network or 500 error', async () => {
      mockClient.get.mockRejectedValueOnce({
        response: { status: 500, data: { message: 'Internal Server Error' } },
      });

      await expect(service.exists('obj-1')).rejects.toThrow(
        StorageConnectionException,
      );
    });
  });

  describe('getPresignedDownloadUrl', () => {
    it('should request presigned download url with expiresIn', async () => {
      const mockResult = {
        storageId: 'obj-1',
        key: 'video.mp4',
        url: 'https://download.url',
        expiresIn: 1800,
      };
      mockClient.get.mockResolvedValueOnce(mockResult);

      const result = await service.getPresignedDownloadUrl('obj-1', 1800);

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/storage/obj-1/presigned-download',
        { params: { expiresIn: 1800 } },
      );
      expect(result).toEqual(mockResult);
    });

    it('should request presigned download url without expiresIn params when omitted', async () => {
      mockClient.get.mockResolvedValueOnce({ url: 'https://download.url' });

      await service.getPresignedDownloadUrl('obj-1');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/storage/obj-1/presigned-download',
        { params: undefined },
      );
    });

    it('should throw StorageNotFoundException on 404', async () => {
      mockClient.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Object missing' } },
      });

      await expect(
        service.getPresignedDownloadUrl('missing-id'),
      ).rejects.toThrow(StorageNotFoundException);
    });
  });

  describe('uploadGetPresignedDownloadUrl', () => {
    it('should upload and return presigned download url', async () => {
      const payload: StorageUploadPayload = {
        key: 'video.mp4',
        body: Buffer.from('data'),
        contentType: 'video/mp4',
      };
      const mockResult = {
        storageId: 's-1',
        key: 'video.mp4',
        url: 'https://download.url',
        expiresIn: 3600,
      };
      mockClient.post.mockResolvedValueOnce(mockResult);

      const result = await service.uploadGetPresignedDownloadUrl(payload, 3600);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/storage/upload-presigned-download',
        payload.body,
        {
          headers: {
            'x-storage-key': 'video.mp4',
            'content-type': 'video/mp4',
          },
          params: { expiresIn: 3600 },
        },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should request presigned upload url with options', async () => {
      const mockResult = {
        storageId: 's-1',
        key: 's-1',
        url: 'https://upload.url',
        options: { expiresIn: 900, contentType: 'image/png' },
      };
      mockClient.post.mockResolvedValueOnce(mockResult);

      const result = await service.getPresignedUploadUrl('s-1', {
        expiresIn: 900,
        contentType: 'image/png',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/storage/presigned-upload',
        {
          storageId: 's-1',
          options: { expiresIn: 900, contentType: 'image/png' },
        },
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUrlByStorageId', () => {
    it('should return download result by storageId', async () => {
      const mockResult = {
        storageId: 's-1',
        key: 'video.mp4',
        url: 'https://direct.url',
      };
      mockClient.get.mockResolvedValueOnce(mockResult);

      const result = await service.getUrlByStorageId('s-1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/storage/s-1/url');
      expect(result).toEqual(mockResult);
    });

    it('should throw StorageNotFoundException on 404', async () => {
      mockClient.get.mockRejectedValueOnce({
        response: { status: 404 },
      });

      await expect(service.getUrlByStorageId('not-found')).rejects.toThrow(
        StorageNotFoundException,
      );
    });
  });

  describe('backward compatibility aliases', () => {
    it('getPresignedDowloadUrl should call getPresignedDownloadUrl', async () => {
      const spy = vi.spyOn(service, 'getPresignedDownloadUrl');
      spy.mockResolvedValueOnce({
        storageId: 's-1',
        key: 's-1',
        url: 'https://url',
      });

      const res = await service.getPresignedDowloadUrl('s-1', 1200);

      expect(spy).toHaveBeenCalledWith('s-1', 1200);
      expect(res.url).toBe('https://url');
    });

    it('uploadGetPresignedDowloadUrl should call uploadGetPresignedDownloadUrl', async () => {
      const spy = vi.spyOn(service, 'uploadGetPresignedDownloadUrl');
      const payload: StorageUploadPayload = {
        key: 'k',
        body: Buffer.from('abc'),
      };
      spy.mockResolvedValueOnce({
        storageId: 's-1',
        key: 'k',
        url: 'https://url',
      });

      const res = await service.uploadGetPresignedDowloadUrl(payload, 600);

      expect(spy).toHaveBeenCalledWith(payload, 600);
      expect(res.url).toBe('https://url');
    });
  });

  describe('error handling', () => {
    it('should throw StorageClientException for 400 bad request', async () => {
      mockClient.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Invalid payload key' },
        },
      });

      await expect(
        service.upload({ key: 'invalid', body: Buffer.from('') }),
      ).rejects.toThrow(StorageClientException);
    });

    it('should throw StorageConnectionException on network failure without response', async () => {
      mockClient.delete.mockRejectedValueOnce(new Error('Network Error'));

      await expect(service.delete('id-1')).rejects.toThrow(
        StorageConnectionException,
      );
    });

    it('should throw StorageConnectionException on ECONNABORTED timeout', async () => {
      const timeoutError: any = new Error('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      mockClient.get.mockRejectedValueOnce(timeoutError);

      await expect(service.getUrlByStorageId('id-1')).rejects.toThrow(
        StorageConnectionException,
      );
    });
  });

  describe('downloadToFile', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'mycast-cloud-storage-test-'));
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
      vi.restoreAllMocks();
    });

    it('should download stream to destination file and resolve destinationPath', async () => {
      const presignedUrl =
        'https://storage.local/videos/src.mp4?X-Amz-Signature=secret-token';
      const destinationPath = join(tempDir, 'source.mp4');
      const content = Buffer.from('binary-video-payload-12345');

      mockClient.get.mockResolvedValueOnce({
        storageId: 'videos/src.mp4',
        key: 'videos/src.mp4',
        url: presignedUrl,
        expiresIn: 3600,
      });
      mockedAxiosGet.mockResolvedValueOnce({
        data: Readable.from([content]),
      } as any);

      const resolvedPath = await service.downloadToFile(
        'videos/src.mp4',
        destinationPath,
      );

      expect(resolvedPath).toBe(destinationPath);
      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/storage/videos%2Fsrc.mp4/presigned-download',
        { params: undefined },
      );
      expect(mockedAxiosGet).toHaveBeenCalledWith(presignedUrl, {
        responseType: 'stream',
        timeout: 0,
      });
      const written = await readFile(destinationPath);
      expect(written.equals(content)).toBe(true);
    });

    it('should pass configured BACKEND_DOWNLOAD_TIMEOUT to axios.get', async () => {
      const customConfig = {
        get: vi.fn((key: string, defaultValue?: any) => {
          if (key === 'BACKEND_STORAGE_PREFIX') return '/api/v1/storage';
          if (key === 'BACKEND_DOWNLOAD_TIMEOUT') return '45000';
          return defaultValue;
        }),
      };
      const customService = new HttpCloudStorageService(
        mockClient as unknown as ClientService,
        customConfig as unknown as ConfigService,
      );
      const destinationPath = join(tempDir, 'custom-timeout.mp4');
      const presignedUrl = 'https://storage.local/file.mp4?sig=abc';

      mockClient.get.mockResolvedValueOnce({
        storageId: 'obj-1',
        key: 'file.mp4',
        url: presignedUrl,
      });
      mockedAxiosGet.mockResolvedValueOnce({
        data: Readable.from([Buffer.from('ok')]),
      } as any);

      await customService.downloadToFile('obj-1', destinationPath);

      expect(mockedAxiosGet).toHaveBeenCalledWith(presignedUrl, {
        responseType: 'stream',
        timeout: 45000,
      });
    });

    it('should throw StorageNotFoundException when presigned download returns 404', async () => {
      const destinationPath = join(tempDir, 'missing-presigned.mp4');
      mockClient.get.mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Not found' } },
      });

      await expect(
        service.downloadToFile('missing-id', destinationPath),
      ).rejects.toThrow(StorageNotFoundException);
      expect(mockedAxiosGet).not.toHaveBeenCalled();
      expect(existsSync(destinationPath)).toBe(false);
    });

    it('should throw StorageNotFoundException when download request returns 404', async () => {
      const destinationPath = join(tempDir, 'missing-object.mp4');
      mockClient.get.mockResolvedValueOnce({
        storageId: 'missing-id',
        key: 'missing.mp4',
        url: 'https://storage.local/missing.mp4?sig=secret',
      });
      mockedAxiosGet.mockRejectedValueOnce({
        response: { status: 404 },
        message: 'Request failed with status code 404',
      });

      await expect(
        service.downloadToFile('missing-id', destinationPath),
      ).rejects.toThrow(StorageNotFoundException);
      expect(existsSync(destinationPath)).toBe(false);
    });

    it('should throw StorageConnectionException on 5xx or network error', async () => {
      const destinationPath = join(tempDir, 'server-error.mp4');
      mockClient.get.mockResolvedValueOnce({
        storageId: 'obj-500',
        key: 'video.mp4',
        url: 'https://storage.local/video.mp4?sig=secret',
      });
      mockedAxiosGet.mockRejectedValueOnce({
        response: { status: 503 },
        message: 'Service Unavailable',
      });

      await expect(
        service.downloadToFile('obj-500', destinationPath),
      ).rejects.toThrow(StorageConnectionException);
      expect(existsSync(destinationPath)).toBe(false);
    });

    it('should throw StorageClientException when presigned URL is missing', async () => {
      const destinationPath = join(tempDir, 'no-url.mp4');
      mockClient.get.mockResolvedValueOnce({
        storageId: 'obj-1',
        key: 'video.mp4',
        url: '',
      });

      await expect(
        service.downloadToFile('obj-1', destinationPath),
      ).rejects.toThrow(StorageClientException);
      expect(mockedAxiosGet).not.toHaveBeenCalled();
    });

    it('should delete partial file when stream errors mid-download', async () => {
      const destinationPath = join(tempDir, 'partial.mp4');
      mockClient.get.mockResolvedValueOnce({
        storageId: 'obj-stream-err',
        key: 'video.mp4',
        url: 'https://storage.local/video.mp4?sig=secret',
      });

      let pushed = false;
      const failingStream = new Readable({
        read() {
          if (!pushed) {
            pushed = true;
            this.push(Buffer.from('partial-chunk-before-failure'));
            setTimeout(() => {
              this.destroy(new Error('stream aborted mid-transfer'));
            }, 10);
          }
        },
      });
      mockedAxiosGet.mockResolvedValueOnce({
        data: failingStream,
      } as any);

      await expect(
        service.downloadToFile('obj-stream-err', destinationPath),
      ).rejects.toThrow(StorageConnectionException);
      expect(existsSync(destinationPath)).toBe(false);
    });

    it('should never log the presigned URL on success or failure', async () => {
      const secretUrl =
        'https://storage.local/private.mp4?X-Amz-Credential=AKIATEST&X-Amz-Signature=super-secret-sig';
      const logSpies = [
        vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {}),
        vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {}),
        vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {}),
        vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {}),
        vi.spyOn(Logger.prototype, 'verbose').mockImplementation(() => {}),
        vi.spyOn(console, 'log').mockImplementation(() => {}),
        vi.spyOn(console, 'warn').mockImplementation(() => {}),
        vi.spyOn(console, 'error').mockImplementation(() => {}),
      ];

      // Success path
      mockClient.get.mockResolvedValueOnce({
        storageId: 'obj-secret',
        key: 'private.mp4',
        url: secretUrl,
      });
      mockedAxiosGet.mockResolvedValueOnce({
        data: Readable.from([Buffer.from('secret-video')]),
      } as any);
      await service.downloadToFile('obj-secret', join(tempDir, 'ok.mp4'));

      // Failure path
      mockClient.get.mockResolvedValueOnce({
        storageId: 'obj-secret',
        key: 'private.mp4',
        url: secretUrl,
      });
      mockedAxiosGet.mockRejectedValueOnce(new Error('Network Error'));
      await expect(
        service.downloadToFile('obj-secret', join(tempDir, 'fail.mp4')),
      ).rejects.toThrow(StorageConnectionException);

      for (const spy of logSpies) {
        const serializedCalls = JSON.stringify(spy.mock.calls);
        expect(serializedCalls).not.toContain(secretUrl);
        expect(serializedCalls).not.toContain('super-secret-sig');
      }
    });

    it('MockStorageContract.downloadToFile should resolve destinationPath', async () => {
      const dest = '/tmp/mock-dest.mp4';
      await expect(
        MockStorageContract.downloadToFile('any-id', dest),
      ).resolves.toBe(dest);
    });
  });
});
