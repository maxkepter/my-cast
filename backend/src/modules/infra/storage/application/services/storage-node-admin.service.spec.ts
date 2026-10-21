import { StorageLoadMode } from '../../domain/enums/storage-mode.enum';
import {
  StorageModeReadOnlyException,
  StorageNodeHasDataException,
  StorageNodeUnreachableException,
} from '../../domain/exceptions';
import { describe, expect, it, vi } from 'vitest';
import { StorageModePolicy } from '../policies/storage-mode.policy';
import { StorageNodeDeletionPolicy } from '../policies/storage-node-deletion.policy';
import { EnvStorageNodeReader } from './env-storage-node-reader.service';
import { StorageNodeAdminService } from './storage-node-admin.service';

describe('StorageNodeAdminService', () => {
  const makeService = (mode: string, envNodes = '[]') => {
    const config = {
      get: vi.fn((key: string, fallback?: string) =>
        key === 'STORAGE_MODE' ? mode : key === 'STORAGE_NODES' ? envNodes : fallback,
      ),
    };
    const nodes = {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const objects = { countReadyByNodeId: vi.fn().mockResolvedValue(0) };
    const probe = { headBucket: vi.fn().mockResolvedValue(true) };
    const pool = { loadNode: vi.fn(), refreshNode: vi.fn(), removeNode: vi.fn() };
    const service = new StorageNodeAdminService(
      config as never,
      nodes as never,
      objects as never,
      probe as never,
      pool as never,
      new EnvStorageNodeReader(config as never),
      new StorageModePolicy(),
      new StorageNodeDeletionPolicy(),
    );
    return { service, nodes, objects, probe, pool };
  };

  it('only lists environment nodes in env mode and omits credentials', async () => {
    const fixture = JSON.stringify([
      {
        id: 'env-1',
        name: 'Primary',
        endpoint: 'http://s3.test',
        region: 'test',
        bucket: 'media',
        accessKeyId: 'secret-id',
        secretAccessKey: 'secret',
        quotaBytes: 500,
        isActive: true,
      },
    ]);
    const { service, nodes } = makeService('env', fixture);
    const response = await service.list({ source: StorageLoadMode.BOTH });
    expect(response.mode).toBe('env');
    expect(response.totalNodes).toBe(1);
    expect(response.nodes[0]).toMatchObject({ nodeId: 'env-1', source: 'env', quotaBytes: 500 });
    expect(response.nodes[0]).not.toHaveProperty('secretAccessKey');
    expect(nodes.findAll).not.toHaveBeenCalled();
  });

  it('blocks writes in env mode before probing or persistence', async () => {
    const { service, nodes, probe } = makeService('env');
    await expect(service.create({ id: 'db-1' } as never)).rejects.toBeInstanceOf(
      StorageModeReadOnlyException,
    );
    expect(probe.headBucket).not.toHaveBeenCalled();
    expect(nodes.save).not.toHaveBeenCalled();
  });

  it('does not persist an unreachable DB node', async () => {
    const { service, nodes, probe, pool } = makeService('db');
    probe.headBucket.mockResolvedValue(false);
    await expect(
      service.create({
        id: 'db-1',
        name: 'Node',
        endpoint: 'http://s3.test',
        region: 'test',
        bucket: 'media',
        forcePathStyle: true,
        accessKeyId: 'id',
        secretAccessKey: 'secret',
        quotaBytes: 10,
        isActive: true,
      } as never),
    ).rejects.toBeInstanceOf(StorageNodeUnreachableException);
    expect(nodes.save).not.toHaveBeenCalled();
    expect(pool.loadNode).not.toHaveBeenCalled();
  });

  it('blocks deleting a node with READY objects', async () => {
    const { service, nodes, objects, pool } = makeService('db');
    nodes.findById.mockResolvedValue({ nodeId: 'db-1', source: 'db', usedBytes: 0 });
    objects.countReadyByNodeId.mockResolvedValue(1);
    await expect(service.remove('db-1')).rejects.toBeInstanceOf(
      StorageNodeHasDataException,
    );
    expect(nodes.delete).not.toHaveBeenCalled();
    expect(pool.removeNode).not.toHaveBeenCalled();
  });
});
