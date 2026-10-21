import {
  InvalidStorageInputException,
  StorageNodeHasDataException,
  StorageNodeIdExistsException,
  StorageNodeNotFoundException,
  StorageNodeUnreachableException,
} from '../../domain/exceptions';
import { describe, expect, it, vi } from 'vitest';
import { StorageNodeDeletionPolicy } from '../policies/storage-node-deletion.policy';
import { StorageNodeAdminService } from './storage-node-admin.service';

describe('StorageNodeAdminService', () => {
  const makeService = () => {
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
      nodes as never,
      objects as never,
      probe as never,
      pool as never,
      new StorageNodeDeletionPolicy(),
    );
    return { service, nodes, objects, probe, pool };
  };

  it('lists nodes from DB and excludes secret credentials', async () => {
    const { service, nodes } = makeService();
    nodes.findAll.mockResolvedValue([
      {
        nodeId: 'db-1',
        name: 'Primary Node',
        endpoint: 'http://s3.test',
        region: 'us-east-1',
        bucket: 'media',
        accessKeyId: 'secret-id',
        secretAccessKey: 'secret-key',
        quotaBytes: '500',
        usedBytes: '100',
        isActive: true,
        isHealthy: true,
        createdAt: new Date('2026-01-01'),
      },
    ]);

    const response = await service.list();
    expect(response.totalNodes).toBe(1);
    expect(response.nodes[0]).toMatchObject({
      nodeId: 'db-1',
      name: 'Primary Node',
      endpoint: 'http://s3.test',
      region: 'us-east-1',
      bucket: 'media',
      quotaBytes: 500,
      usedBytes: 100,
      isActive: true,
      isHealthy: true,
    });
    expect(response.nodes[0]).not.toHaveProperty('secretAccessKey');
    expect(response.nodes[0]).not.toHaveProperty('source');
    expect(response).not.toHaveProperty('mode');
  });

  it('filters nodes by health status in list', async () => {
    const { service, nodes } = makeService();
    nodes.findAll.mockResolvedValue([
      { nodeId: 'node-healthy', isHealthy: true, isActive: true },
      { nodeId: 'node-unhealthy', isHealthy: false, isActive: true },
    ]);

    const response = await service.list({ status: 'healthy' });
    expect(response.totalNodes).toBe(1);
    expect(response.nodes[0].nodeId).toBe('node-healthy');
  });

  it('creates a node, validates safe integer quota, probes bucket, and loads into pool if active', async () => {
    const { service, nodes, probe, pool } = makeService();
    const createdNode = {
      nodeId: 'node-1',
      name: 'Node 1',
      endpoint: 'http://s3.test',
      region: 'us-east-1',
      bucket: 'media',
      quotaBytes: '1000',
      usedBytes: '0',
      isActive: true,
      isHealthy: false,
      createdAt: new Date('2026-01-01'),
    };
    nodes.save.mockResolvedValue(createdNode);

    const result = await service.create({
      id: 'node-1',
      name: 'Node 1',
      endpoint: 'http://s3.test',
      region: 'us-east-1',
      bucket: 'media',
      forcePathStyle: true,
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      quotaBytes: 1000,
      isActive: true,
    });

    expect(probe.headBucket).toHaveBeenCalled();
    expect(nodes.save).toHaveBeenCalled();
    expect(pool.loadNode).toHaveBeenCalledWith(createdNode);
    expect(result.nodeId).toBe('node-1');
  });

  it('rejects create when node id already exists', async () => {
    const { service, nodes } = makeService();
    nodes.findById.mockResolvedValue({ nodeId: 'node-1' });

    await expect(
      service.create({
        id: 'node-1',
        name: 'Node 1',
        endpoint: 'http://s3.test',
        region: 'us-east-1',
        bucket: 'media',
        forcePathStyle: true,
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        quotaBytes: 1000,
        isActive: true,
      }),
    ).rejects.toBeInstanceOf(StorageNodeIdExistsException);
  });

  it('does not persist an unreachable node', async () => {
    const { service, nodes, probe, pool } = makeService();
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
      }),
    ).rejects.toBeInstanceOf(StorageNodeUnreachableException);
    expect(nodes.save).not.toHaveBeenCalled();
    expect(pool.loadNode).not.toHaveBeenCalled();
  });

  it('rejects update with empty payload', async () => {
    const { service } = makeService();
    await expect(service.update('node-1', {})).rejects.toBeInstanceOf(
      InvalidStorageInputException,
    );
  });

  it('rejects update when node does not exist', async () => {
    const { service, nodes } = makeService();
    nodes.findById.mockResolvedValue(null);

    await expect(
      service.update('node-404', { name: 'New Name' }),
    ).rejects.toBeInstanceOf(StorageNodeNotFoundException);
  });

  it('updates node, refreshes pool when active, and probes when connection params change', async () => {
    const { service, nodes, probe, pool } = makeService();
    const existing = {
      nodeId: 'node-1',
      name: 'Old Name',
      endpoint: 'http://s3.test',
      region: 'us-east-1',
      bucket: 'old-bucket',
      quotaBytes: '1000',
      usedBytes: '0',
      isActive: true,
      isHealthy: true,
    };
    nodes.findById.mockResolvedValue(existing);
    const updated = { ...existing, bucket: 'new-bucket' };
    nodes.update.mockResolvedValue(updated);

    const result = await service.update('node-1', { bucket: 'new-bucket' });

    expect(probe.headBucket).toHaveBeenCalled();
    expect(nodes.update).toHaveBeenCalledWith('node-1', { bucket: 'new-bucket' });
    expect(pool.refreshNode).toHaveBeenCalledWith(updated);
    expect(result.bucket).toBe('new-bucket');
  });

  it('removes node from pool when deactivated via update', async () => {
    const { service, nodes, pool } = makeService();
    const existing = { nodeId: 'node-1', isActive: true };
    nodes.findById.mockResolvedValue(existing);
    const updated = { ...existing, isActive: false };
    nodes.update.mockResolvedValue(updated);

    await service.update('node-1', { isActive: false });

    expect(pool.removeNode).toHaveBeenCalledWith('node-1');
  });

  it('blocks deleting a node with READY objects', async () => {
    const { service, nodes, objects, pool } = makeService();
    nodes.findById.mockResolvedValue({ nodeId: 'db-1', usedBytes: '0' });
    objects.countReadyByNodeId.mockResolvedValue(1);

    await expect(service.remove('db-1')).rejects.toBeInstanceOf(
      StorageNodeHasDataException,
    );
    expect(nodes.delete).not.toHaveBeenCalled();
    expect(pool.removeNode).not.toHaveBeenCalled();
  });

  it('blocks deleting a node with usedBytes > 0', async () => {
    const { service, nodes, objects, pool } = makeService();
    nodes.findById.mockResolvedValue({ nodeId: 'db-1', usedBytes: '1024' });
    objects.countReadyByNodeId.mockResolvedValue(0);

    await expect(service.remove('db-1')).rejects.toBeInstanceOf(
      StorageNodeHasDataException,
    );
    expect(nodes.delete).not.toHaveBeenCalled();
    expect(pool.removeNode).not.toHaveBeenCalled();
  });

  it('deletes an empty node and removes from pool', async () => {
    const { service, nodes, objects, pool } = makeService();
    nodes.findById.mockResolvedValue({ nodeId: 'db-1', usedBytes: '0' });
    objects.countReadyByNodeId.mockResolvedValue(0);

    await service.remove('db-1');

    expect(nodes.delete).toHaveBeenCalledWith('db-1');
    expect(pool.removeNode).toHaveBeenCalledWith('db-1');
  });

  it('checks health, updates DB and pool accordingly', async () => {
    const { service, nodes, probe, pool } = makeService();
    const node = { nodeId: 'db-1', isActive: true, isHealthy: false };
    nodes.findById.mockResolvedValue(node);
    probe.headBucket.mockResolvedValue(true);
    const updated = { ...node, isHealthy: true };
    nodes.update.mockResolvedValue(updated);

    const res = await service.healthCheck('db-1');

    expect(res.isHealthy).toBe(true);
    expect(nodes.update).toHaveBeenCalledWith('db-1', { isHealthy: true });
    expect(pool.refreshNode).toHaveBeenCalledWith(updated);
  });
});
