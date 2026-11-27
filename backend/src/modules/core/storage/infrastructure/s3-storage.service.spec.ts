import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Repository } from 'typeorm';
import { StorageObject } from '../domain/entities/storage.entity';
import { StorageObjectStatus } from '../domain/enums/storage-object-status.enum';
import { S3StorageService } from './s3-storage.service';

describe('S3StorageService.updateVideoStatus', () => {
  it('updates status and returns StorageUploadResult', async () => {
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
