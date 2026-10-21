import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageNode } from '../../domain/entities/storage-node.entity';
import { StorageNodeRepository } from '../../domain/repositories/storage-node.repository.interface';
import { UpdateStorageNodeReq } from '../../dtos/req.dto';

@Injectable()
export class StorageNodeTypeOrmRepository implements StorageNodeRepository {
  constructor(
    @InjectRepository(StorageNode)
    private readonly repository: Repository<StorageNode>,
  ) {}

  async findById(nodeId: string): Promise<StorageNode | null> {
    return this.repository.findOne({ where: { nodeId } });
  }

  async findAll(): Promise<StorageNode[]> {
    return this.repository.find();
  }

  async findActiveNodes(): Promise<StorageNode[]> {
    return this.repository.find({ where: { isActive: true } });
  }

  existsById(nodeId: string): Promise<boolean> {
    return this.repository.exists({ where: { nodeId } });
  }

  create(input: Partial<StorageNode>): StorageNode {
    return this.repository.create({
      nodeId: input.nodeId,
      name: input.name,
      endpoint: input.endpoint,
      region: input.region,
      bucket: input.bucket,
      forcePathStyle: input.forcePathStyle,
      accessKeyId: input.accessKeyId,
      secretAccessKey: input.secretAccessKey,
      quotaBytes: input.quotaBytes !== undefined ? String(input.quotaBytes) : '0',
      usedBytes: input.usedBytes !== undefined ? String(input.usedBytes) : '0',
      isActive: input.isActive ?? true,
      isHealthy: input.isHealthy ?? true,
      publicUrl: input.publicUrl,
    });
  }

  async update(
    nodeId: string,
    changes: UpdateStorageNodeReq | { isHealthy: boolean },
  ): Promise<StorageNode | null> {
    const node = await this.repository.findOne({ where: { nodeId } });
    if (!node) return null;
    const patch: Partial<StorageNode> = {};
    if ('name' in changes && typeof changes.name === 'string') patch.name = changes.name;
    if ('endpoint' in changes && changes.endpoint !== undefined) patch.endpoint = changes.endpoint;
    if ('region' in changes && changes.region !== undefined) patch.region = changes.region;
    if ('bucket' in changes && changes.bucket !== undefined) patch.bucket = changes.bucket;
    if ('forcePathStyle' in changes && changes.forcePathStyle !== undefined)
      patch.forcePathStyle = changes.forcePathStyle;
    if ('accessKeyId' in changes && changes.accessKeyId !== undefined)
      patch.accessKeyId = changes.accessKeyId;
    if ('secretAccessKey' in changes && changes.secretAccessKey !== undefined)
      patch.secretAccessKey = changes.secretAccessKey;
    if ('publicUrl' in changes && typeof changes.publicUrl === 'string')
      patch.publicUrl = changes.publicUrl;
    if ('quotaBytes' in changes && changes.quotaBytes !== undefined)
      patch.quotaBytes = String(changes.quotaBytes);
    if ('isActive' in changes && changes.isActive !== undefined) patch.isActive = changes.isActive;
    if ('isHealthy' in changes && changes.isHealthy !== undefined) patch.isHealthy = changes.isHealthy;

    return this.repository.save(this.repository.merge(node, patch));
  }

  async delete(nodeId: string): Promise<void> {
    await this.repository.delete({ nodeId });
  }

  async save(node: StorageNode): Promise<StorageNode> {
    return this.repository.save(node);
  }
}
