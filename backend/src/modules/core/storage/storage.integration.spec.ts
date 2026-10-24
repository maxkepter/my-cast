import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { S3BucketProbeAdapter } from './infrastructure/adapters/s3-bucket-probe.adapter';
import { StoragePoolManager } from './application/services/storage-pool-manager';
import { S3StorageService } from './infrastructure/s3-storage.service';
import { StorageNodeAdminService } from './application/services/storage-node-admin.service';
import { StorageNodeDeletionPolicy } from './application/policies/storage-node-deletion.policy';
import { StorageNode } from './domain/entities/storage-node.entity';
import { StorageObject } from './domain/entities/storage.entity';
import { StorageNodeHasDataException } from './domain/exceptions';
import { StorageNodeRepository } from './domain/repositories/storage-node.repository.interface';
import { StorageObjectReadRepository } from './domain/repositories/storage-object-read.repository.interface';
import { UpdateStorageNodeReq } from './dtos/req.dto';

const MINIO_ENDPOINT = 'http://127.0.0.1:9000';
const MINIO_ACCESS_KEY = 'minioadmin';
const MINIO_SECRET_KEY = 'minioadmin';
const MINIO_REGION = 'us-east-1';
const TEST_BUCKET = 'mycast-test-bucket';

describe('Storage Module Integration Tests (MinIO)', { timeout: 20_000 }, () => {
  let rootClient: S3Client;
  const createdObjectKeys: string[] = [];

  beforeAll(async () => {
    rootClient = new S3Client({
      endpoint: MINIO_ENDPOINT,
      region: MINIO_REGION,
      forcePathStyle: true,
      credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
      },
    });

    try {
      await rootClient.send(new HeadBucketCommand({ Bucket: TEST_BUCKET }));
    } catch {
      await rootClient.send(new CreateBucketCommand({ Bucket: TEST_BUCKET }));
    }
  });

  afterAll(async () => {
    for (const key of createdObjectKeys) {
      try {
        await rootClient.send(
          new DeleteObjectCommand({
            Bucket: TEST_BUCKET,
            Key: key,
          }),
        );
      } catch {
        // Ignore deletion cleanup error
      }
    }
    rootClient.destroy();
  });

  const createTestNode = (overrides?: Partial<StorageNode>): StorageNode => {
    const node = new StorageNode();
    node.nodeId = overrides?.nodeId ?? 'minio-node-test-1';
    node.name = overrides?.name ?? 'MinIO Local Storage Node';
    node.endpoint = overrides?.endpoint ?? MINIO_ENDPOINT;
    node.region = overrides?.region ?? MINIO_REGION;
    node.bucket = overrides?.bucket ?? TEST_BUCKET;
    node.forcePathStyle = overrides?.forcePathStyle ?? true;
    node.accessKeyId = overrides?.accessKeyId ?? MINIO_ACCESS_KEY;
    node.secretAccessKey = overrides?.secretAccessKey ?? MINIO_SECRET_KEY;
    node.publicUrl = overrides?.publicUrl ?? null;
    node.quotaBytes = overrides?.quotaBytes ?? '10737418240';
    node.usedBytes = overrides?.usedBytes ?? '0';
    node.isActive = overrides?.isActive ?? true;
    node.isHealthy = overrides?.isHealthy ?? true;
    node.createdAt = overrides?.createdAt ?? new Date();
    node.updatedAt = overrides?.updatedAt ?? new Date();
    return node;
  };

  const createInMemoryStorageRepo = () => {
    const store = new Map<string, StorageObject>();
    return {
      store,
      findOne: async ({ where }: { where: { storageKey: string } }) => {
        return store.get(where.storageKey) ?? null;
      },
      save: async (entity: StorageObject) => {
        store.set(entity.storageKey, entity);
        return entity;
      },
      delete: async ({ storageKey }: { storageKey: string }) => {
        const existed = store.delete(storageKey);
        return { affected: existed ? 1 : 0 };
      },
    };
  };

  const createInMemoryNodeRepo = (initialNodes: StorageNode[] = []): StorageNodeRepository & { nodes: Map<string, StorageNode> } => {
    const nodes = new Map<string, StorageNode>();
    for (const n of initialNodes) {
      nodes.set(n.nodeId, n);
    }
    return {
      nodes,
      async findById(nodeId: string): Promise<StorageNode | null> {
        return nodes.get(nodeId) ?? null;
      },
      async findAll(): Promise<StorageNode[]> {
        return Array.from(nodes.values());
      },
      async findActiveNodes(): Promise<StorageNode[]> {
        return Array.from(nodes.values()).filter((n) => n.isActive);
      },
      async existsById(nodeId: string): Promise<boolean> {
        return nodes.has(nodeId);
      },
      create(input: Partial<StorageNode>): StorageNode {
        const node = new StorageNode();
        Object.assign(node, input);
        return node;
      },
      async update(nodeId: string, changes: UpdateStorageNodeReq | { isHealthy: boolean }): Promise<StorageNode | null> {
        const existing = nodes.get(nodeId);
        if (!existing) return null;
        Object.assign(existing, changes);
        if ('quotaBytes' in changes && changes.quotaBytes !== undefined) {
          existing.quotaBytes = String(changes.quotaBytes);
        }
        existing.updatedAt = new Date();
        nodes.set(nodeId, existing);
        return existing;
      },
      async delete(nodeId: string): Promise<void> {
        nodes.delete(nodeId);
      },
      async save(node: StorageNode): Promise<StorageNode> {
        nodes.set(node.nodeId, node);
        return node;
      },
    };
  };

  const createInMemoryObjectReadRepo = (
    readyCounts: Record<string, number> = {},
    readyBytes: Record<string, number> = {},
  ): StorageObjectReadRepository => {
    return {
      countReadyByNodeId: async (nodeId: string): Promise<number> => {
        return readyCounts[nodeId] ?? 0;
      },
      sumReadyBytesByNodeId: async (nodeId: string): Promise<number> => {
        return readyBytes[nodeId] ?? 0;
      },
    };
  };

  describe('S3BucketProbeAdapter', () => {
    const probe = new S3BucketProbeAdapter();

    it('returns true when probing existing MinIO bucket', async () => {
      const healthy = await probe.headBucket({
        endpoint: MINIO_ENDPOINT,
        region: MINIO_REGION,
        bucket: TEST_BUCKET,
        forcePathStyle: true,
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
      });

      expect(healthy).toBe(true);
    });

    it('returns false when probing non-existent bucket', async () => {
      const healthy = await probe.headBucket({
        endpoint: MINIO_ENDPOINT,
        region: MINIO_REGION,
        bucket: 'non-existent-bucket-random-404',
        forcePathStyle: true,
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
      });

      expect(healthy).toBe(false);
    });

    it('returns false when probing unreachable endpoint', async () => {
      const healthy = await probe.headBucket({
        endpoint: 'http://127.0.0.1:59999',
        region: MINIO_REGION,
        bucket: TEST_BUCKET,
        forcePathStyle: true,
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
      });

      expect(healthy).toBe(false);
    });
  });

  describe('StoragePoolManager', () => {
    it('registers MinIO node into pool and provides healthy active client', async () => {
      const testNode = createTestNode();
      const nodeRepoMock = {
        find: async () => [testNode],
      };

      const pool = new StoragePoolManager(nodeRepoMock as never);
      await pool.onModuleInit();

      const healthyClients = pool.getHealthyClients();
      expect(healthyClients.length).toBe(1);
      expect(healthyClients[0].nodeId).toBe(testNode.nodeId);
      expect(healthyClients[0].client).toBeInstanceOf(S3Client);

      const client = pool.getClientForNode(testNode.nodeId);
      expect(client).toBeDefined();

      const selected = pool.selectNode();
      expect(selected.nodeId).toBe(testNode.nodeId);

      // Clean up pool clients
      pool.removeNode(testNode.nodeId);
      expect(pool.getHealthyClients().length).toBe(0);
    });

    it('throws error when requesting client for removed or inactive node', async () => {
      const testNode = createTestNode({ isActive: false });
      const pool = new StoragePoolManager({ find: async () => [] } as never);

      await pool.loadNode(testNode);
      expect(() => pool.getClientForNode(testNode.nodeId)).toThrow(
        `No healthy active storage client for node ${testNode.nodeId}`,
      );
    });
  });

  describe('S3StorageService (StorageContract)', () => {
    let pool: StoragePoolManager;
    let storageRepo: ReturnType<typeof createInMemoryStorageRepo>;
    let storageService: S3StorageService;
    let minioNode: StorageNode;

    beforeAll(async () => {
      minioNode = createTestNode({ nodeId: 'minio-storage-node' });
      pool = new StoragePoolManager({ find: async () => [minioNode] } as never);
      await pool.onModuleInit();

      storageRepo = createInMemoryStorageRepo();
      storageService = new S3StorageService(
        undefined,
        undefined,
        storageRepo as never,
        pool,
      );
    });

    afterAll(() => {
      pool.removeNode(minioNode.nodeId);
    });

    it('uploads buffer file to MinIO and saves record with metadata', async () => {
      const fileKey = `integration-tests/test-buffer-${Date.now()}.txt`;
      createdObjectKeys.push(fileKey);
      const text = 'Integration test file content from buffer';

      const payload = {
        key: fileKey,
        body: Buffer.from(text),
        contentType: 'text/plain',
        contentLength: Buffer.byteLength(text),
        originalName: 'test-buffer.txt',
      };

      const result = await storageService.upload(payload);

      expect(result).toBeDefined();
      expect(result.storageId).toBe(fileKey);
      expect(result.key).toBe(fileKey);
      expect(result.originalName).toBe('test-buffer.txt');
      expect(result.etag).toBeTruthy();

      const saved = await storageRepo.findOne({ where: { storageKey: fileKey } });
      expect(saved).not.toBeNull();
      expect(saved?.storageKey).toBe(fileKey);
      expect(saved?.storageNodeId).toBe(minioNode.nodeId);
    });

    it('uploads stream file to MinIO and returns valid result', async () => {
      const fileKey = `integration-tests/test-stream-${Date.now()}.txt`;
      createdObjectKeys.push(fileKey);

      const streamContent = 'Stream content for MinIO upload test';
      const stream = Readable.from([streamContent]);

      const result = await storageService.upload({
        key: fileKey,
        body: stream,
        contentType: 'text/plain',
        contentLength: Buffer.byteLength(streamContent),
        originalName: 'test-stream.txt',
      });

      expect(result.storageId).toBe(fileKey);
      expect(result.etag).toBeTruthy();
    });

    it('checks file existence on MinIO via exists()', async () => {
      const fileKey = `integration-tests/test-exists-${Date.now()}.txt`;
      createdObjectKeys.push(fileKey);

      await storageService.upload({
        key: fileKey,
        body: Buffer.from('Existence test content'),
        contentType: 'text/plain',
        contentLength: 22,
        originalName: 'test-exists.txt',
      });

      const exists = await storageService.exists(fileKey);
      expect(exists).toBe(true);

      const nonExistent = await storageService.exists('integration-tests/non-existent-404.txt');
      expect(nonExistent).toBe(false);
    });

    it('generates presigned upload URL and allows real HTTP PUT to MinIO', async () => {
      const presignedKey = `integration-tests/presigned-upload-${Date.now()}.txt`;
      createdObjectKeys.push(presignedKey);

      const presigned = await storageService.getPresignedUploadUrl(presignedKey, {
        contentType: 'text/plain',
        expiresIn: 300,
      });

      expect(presigned.storageId).toBe(presignedKey);
      expect(presigned.url).toContain(MINIO_ENDPOINT);

      const uploadContent = 'Uploaded via presigned URL directly to MinIO';
      const putResponse = await fetch(presigned.url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: uploadContent,
      });

      expect(putResponse.ok).toBe(true);

      const headResult = await rootClient.send(
        new HeadObjectCommand({
          Bucket: TEST_BUCKET,
          Key: presignedKey,
        }),
      );
      expect(headResult.ContentLength).toBe(Buffer.byteLength(uploadContent));
    });

    it('generates presigned download URL and allows real HTTP GET to read file content', async () => {
      const fileKey = `integration-tests/test-download-${Date.now()}.txt`;
      createdObjectKeys.push(fileKey);
      const expectedContent = 'Downloadable test payload for MinIO';

      await storageService.upload({
        key: fileKey,
        body: Buffer.from(expectedContent),
        contentType: 'text/plain',
        contentLength: Buffer.byteLength(expectedContent),
        originalName: 'test-download.txt',
      });

      const presigned = await storageService.getPresignedDownloadUrl(fileKey, 300);

      expect(presigned.storageId).toBe(fileKey);
      expect(presigned.url).toContain(MINIO_ENDPOINT);

      const getResponse = await fetch(presigned.url);
      expect(getResponse.ok).toBe(true);
      const text = await getResponse.text();
      expect(text).toBe(expectedContent);
    });

    it('deletes file from MinIO and repository, verifying exists() returns false', async () => {
      const fileKey = `integration-tests/test-delete-${Date.now()}.txt`;

      await storageService.upload({
        key: fileKey,
        body: Buffer.from('To be deleted'),
        contentType: 'text/plain',
        contentLength: 13,
        originalName: 'test-delete.txt',
      });

      expect(await storageService.exists(fileKey)).toBe(true);

      await storageService.delete(fileKey);

      expect(await storageService.exists(fileKey)).toBe(false);

      const inRepo = await storageRepo.findOne({ where: { storageKey: fileKey } });
      expect(inRepo).toBeNull();
    });
  });

  describe('StorageNodeAdminService', () => {
    it('performs live healthCheck against MinIO and marks node healthy', async () => {
      const liveNode = createTestNode({
        nodeId: 'live-minio-node',
        isHealthy: false,
      });
      const nodeRepo = createInMemoryNodeRepo([liveNode]);
      const objectRepo = createInMemoryObjectReadRepo();
      const probe = new S3BucketProbeAdapter();
      const pool = new StoragePoolManager({ find: async () => [liveNode] } as never);
      await pool.onModuleInit();

      const adminService = new StorageNodeAdminService(
        nodeRepo,
        objectRepo,
        probe,
        pool,
        new StorageNodeDeletionPolicy(),
      );

      const healthRes = await adminService.healthCheck(liveNode.nodeId);

      expect(healthRes.nodeId).toBe(liveNode.nodeId);
      expect(healthRes.isHealthy).toBe(true);

      const updatedNode = await nodeRepo.findById(liveNode.nodeId);
      expect(updatedNode?.isHealthy).toBe(true);

      const healthyClients = pool.getHealthyClients();
      expect(healthyClients.some((c) => c.nodeId === liveNode.nodeId)).toBe(true);

      pool.removeNode(liveNode.nodeId);
    });

    it('marks node unhealthy and removes it from pool when MinIO bucket is invalid', async () => {
      const invalidNode = createTestNode({
        nodeId: 'invalid-bucket-node',
        bucket: 'non-existent-bucket-xyz-999',
        isHealthy: true,
      });
      const nodeRepo = createInMemoryNodeRepo([invalidNode]);
      const objectRepo = createInMemoryObjectReadRepo();
      const probe = new S3BucketProbeAdapter();
      const pool = new StoragePoolManager({ find: async () => [invalidNode] } as never);
      await pool.onModuleInit();

      const adminService = new StorageNodeAdminService(
        nodeRepo,
        objectRepo,
        probe,
        pool,
        new StorageNodeDeletionPolicy(),
      );

      const healthRes = await adminService.healthCheck(invalidNode.nodeId);

      expect(healthRes.nodeId).toBe(invalidNode.nodeId);
      expect(healthRes.isHealthy).toBe(false);

      const updatedNode = await nodeRepo.findById(invalidNode.nodeId);
      expect(updatedNode?.isHealthy).toBe(false);

      const healthyClients = pool.getHealthyClients();
      expect(healthyClients.some((c) => c.nodeId === invalidNode.nodeId)).toBe(false);

      pool.removeNode(invalidNode.nodeId);
    });
  });

  describe('StorageNodeDeletionPolicy', () => {
    const policy = new StorageNodeDeletionPolicy();

    it('blocks node deletion when node still has used bytes', () => {
      expect(() => policy.assertDeletable(1024, 0)).toThrow(StorageNodeHasDataException);
    });

    it('blocks node deletion when node still has READY objects', () => {
      expect(() => policy.assertDeletable(0, 5)).toThrow(StorageNodeHasDataException);
    });

    it('blocks node deletion when node has both used bytes and READY objects', () => {
      expect(() => policy.assertDeletable(2048, 2)).toThrow(StorageNodeHasDataException);
    });

    it('allows node deletion when used bytes and READY object count are both zero', () => {
      expect(() => policy.assertDeletable(0, 0)).not.toThrow();
    });

    it('integrates deletion policy into StorageNodeAdminService.remove()', async () => {
      const nodeWithData = createTestNode({ nodeId: 'node-with-data', usedBytes: '1024' });
      const emptyNode = createTestNode({ nodeId: 'node-empty', usedBytes: '0' });

      const nodeRepo = createInMemoryNodeRepo([nodeWithData, emptyNode]);
      const objectRepo = createInMemoryObjectReadRepo(
        { 'node-with-data': 3, 'node-empty': 0 },
        { 'node-with-data': 1024, 'node-empty': 0 },
      );
      const probe = new S3BucketProbeAdapter();
      const pool = new StoragePoolManager({ find: async () => [emptyNode] } as never);
      await pool.onModuleInit();

      const adminService = new StorageNodeAdminService(
        nodeRepo,
        objectRepo,
        probe,
        pool,
        policy,
      );

      // Blocked when node has READY objects
      await expect(adminService.remove(nodeWithData.nodeId)).rejects.toThrow(
        StorageNodeHasDataException,
      );
      expect(await nodeRepo.findById(nodeWithData.nodeId)).not.toBeNull();

      // Allowed when node is empty
      await expect(adminService.remove(emptyNode.nodeId)).resolves.toBeUndefined();
      expect(await nodeRepo.findById(emptyNode.nodeId)).toBeNull();

      pool.removeNode(emptyNode.nodeId);
    });
  });
});
