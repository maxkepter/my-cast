import { Inject, Injectable } from '@nestjs/common';
import {
  CreateStorageNodeReq,
  StorageNodeListQueryReq,
  UpdateStorageNodeReq,
} from '../../dtos/req.dto';
import {
  StorageNodeHealthRes,
  StorageNodeListRes,
  StorageNodeRes,
} from '../../dtos/res.dto';
import {
  InvalidStorageInputException,
  StorageNodeIdExistsException,
  StorageNodeNotFoundException,
  StorageNodeUnreachableException,
} from '../../domain/exceptions';
import { StorageNode } from '../../domain/entities/storage-node.entity';
import {
  StoragePoolManagerPort,
  STORAGE_POOL_MANAGER,
} from '../ports/storage-pool-manager.port';
import { StorageNodeAdminService as StorageNodeAdminServicePort } from '../ports/storage-node-admin.port';
import { StorageNodeDeletionPolicy } from '../policies/storage-node-deletion.policy';
import {
  STORAGE_NODE_REPOSITORY,
  StorageNodeRepository,
} from '../../domain/repositories/storage-node.repository.interface';
import {
  STORAGE_OBJECT_READ_REPOSITORY,
  StorageObjectReadRepository,
} from '../../domain/repositories/storage-object-read.repository.interface';
import {
  S3_BUCKET_PROBE,
  S3BucketProbe,
} from '../ports/s3-bucket-probe.interface';

const asNumber = (value: string | number | null | undefined): number =>
  Number(value ?? 0);

@Injectable()
export class StorageNodeAdminService implements StorageNodeAdminServicePort {
  constructor(
    @Inject(STORAGE_NODE_REPOSITORY)
    private readonly nodes: StorageNodeRepository,
    @Inject(STORAGE_OBJECT_READ_REPOSITORY)
    private readonly objects: StorageObjectReadRepository,
    @Inject(S3_BUCKET_PROBE)
    private readonly probe: S3BucketProbe,
    @Inject(STORAGE_POOL_MANAGER)
    private readonly pool: StoragePoolManagerPort,
    private readonly deletionPolicy: StorageNodeDeletionPolicy,
  ) {}

  async list(query: StorageNodeListQueryReq = {}): Promise<StorageNodeListRes> {
    let dbNodes = await this.nodes.findAll();
    if (query.status) {
      const healthy = query.status === 'healthy';
      dbNodes = dbNodes.filter((node) => node.isHealthy === healthy);
    }
    const nodes = dbNodes.map((node) =>
      StorageNodeRes.of(
        node.nodeId,
        node.name,
        node.endpoint,
        node.region,
        node.bucket,
        asNumber(node.quotaBytes),
        asNumber(node.usedBytes),
        node.isActive,
        node.isHealthy,
        node.createdAt ?? new Date(0),
      ),
    );
    return StorageNodeListRes.of(nodes.length, nodes);
  }

  async create(input: CreateStorageNodeReq): Promise<StorageNodeRes> {
    this.validateSafeInteger(input.quotaBytes, 'quotaBytes');

    if (await this.nodes.findById(input.id)) {
      throw new StorageNodeIdExistsException();
    }

    const candidate: StorageNode = {
      nodeId: input.id,
      name: input.name,
      endpoint: input.endpoint,
      region: input.region,
      bucket: input.bucket,
      forcePathStyle: input.forcePathStyle,
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
      quotaBytes: String(input.quotaBytes),
      usedBytes: '0',
      isActive: input.isActive,
      isHealthy: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.probeCandidate(candidate);
    let created: StorageNode;
    try {
      created = await this.nodes.save(candidate);
    } catch (error) {
      if (this.isUniqueViolation(error))
        throw new StorageNodeIdExistsException();
      throw error;
    }
    if (created.isActive) await this.pool.loadNode(created);
    return StorageNodeRes.of(
      created.nodeId,
      created.name,
      created.endpoint,
      created.region,
      created.bucket,
      asNumber(created.quotaBytes),
      asNumber(created.usedBytes),
      created.isActive,
      created.isHealthy,
      created.createdAt ?? new Date(0),
    );
  }

  async update(
    id: string,
    input: UpdateStorageNodeReq,
  ): Promise<StorageNodeRes> {
    if (!Object.keys(input).length)
      throw new InvalidStorageInputException(
        'At least one field must be supplied.',
      );
    const current = await this.findNode(id);
    if (input.quotaBytes !== undefined)
      this.validateSafeInteger(input.quotaBytes, 'quotaBytes');
    const connectionChanged = [
      'endpoint',
      'region',
      'bucket',
      'forcePathStyle',
      'accessKeyId',
      'secretAccessKey',
    ].some((key) => input[key as keyof UpdateStorageNodeReq] !== undefined);
    const candidate = {
      ...current,
      ...input,
      quotaBytes:
        input.quotaBytes === undefined
          ? current.quotaBytes
          : String(input.quotaBytes),
    };
    if (connectionChanged) await this.probeCandidate(candidate);
    const updated = await this.nodes.update(id, input);
    if (!updated) throw new StorageNodeNotFoundException(id);
    if (!updated.isActive) await this.pool.removeNode(id);
    else if (connectionChanged || input.isActive === true)
      await this.pool.refreshNode(updated);
    return StorageNodeRes.of(
      updated.nodeId,
      updated.name,
      updated.endpoint,
      updated.region,
      updated.bucket,
      asNumber(updated.quotaBytes),
      asNumber(updated.usedBytes),
      updated.isActive,
      updated.isHealthy,
      updated.createdAt ?? new Date(0),
    );
  }

  async remove(id: string): Promise<void> {
    const current = await this.findNode(id);
    const readyCount = await this.objects.countReadyByNodeId(id);
    this.deletionPolicy.assertDeletable({
      usedBytes: asNumber(current.usedBytes),
      readyObjectCount: readyCount,
    });
    await this.nodes.delete(id);
    await this.pool.removeNode(id);
  }

  async healthCheck(id: string): Promise<StorageNodeHealthRes> {
    const current = await this.findNode(id);
    let healthy = true;
    try {
      await this.probeCandidate(current);
    } catch {
      healthy = false;
    }
    const updated = await this.nodes.update(id, { isHealthy: healthy });
    if (!updated) throw new StorageNodeNotFoundException(id);
    if (healthy && updated.isActive) await this.pool.refreshNode(updated);
    else if (!healthy || !updated.isActive) await this.pool.removeNode(id);
    return StorageNodeHealthRes.of(id, healthy, new Date());
  }

  private async findNode(id: string): Promise<StorageNode> {
    const node = await this.nodes.findById(id);
    if (!node) {
      throw new StorageNodeNotFoundException(id);
    }
    return node;
  }

  private async probeCandidate(node: StorageNode): Promise<void> {
    try {
      const passed = await this.probe.headBucket(node);
      if (!passed) throw new Error('Bucket probe failed');
    } catch {
      throw new StorageNodeUnreachableException();
    }
  }

  private validateSafeInteger(value: number, field: string): void {
    this.toSafeInteger(value, field);
  }

  private toSafeInteger(value: number | string, field: string): number {
    const converted = typeof value === 'number' ? value : Number(value);
    if (!Number.isSafeInteger(converted) || converted < 0)
      throw new InvalidStorageInputException(
        `${field} must be a non-negative safe integer.`,
      );
    return converted;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      ((error as { code?: string }).code === '23505' ||
        (error as { code?: string }).code === 'ER_DUP_ENTRY')
    );
  }
}
