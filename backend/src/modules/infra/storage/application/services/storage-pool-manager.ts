import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { S3Client } from '@aws-sdk/client-s3';
import { Repository } from 'typeorm';
import { StorageNode } from '../../domain/entities/storage-node.entity';
import { EnvStorageNodeReader } from './env-storage-node-reader.service';
import { StoragePoolEntry } from '../types/storage-pool.type';
import { StorageLoadMode } from '../../domain/enums';
import { StoragePoolManagerPort } from '../ports/storage-pool-manager.port';

@Injectable()
export class StoragePoolManager implements OnModuleInit, StoragePoolManagerPort {
  private readonly nodes = new Map<string, StoragePoolEntry>();
  private roundRobinCursor = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly envNodeReader: EnvStorageNodeReader,
    @InjectRepository(StorageNode)
    private readonly nodeRepository: Repository<StorageNode>,
  ) {}

  async onModuleInit(): Promise<void> {
    const mode = this.configService.get<string>('STORAGE_MODE', 'env');
    if (mode === StorageLoadMode.ENV || mode === StorageLoadMode.BOTH)
      for (const node of this.envNodeReader.getNodes()) await this.loadNode(node);
    if (mode === StorageLoadMode.DB || mode === StorageLoadMode.BOTH)
      for (const node of await this.nodeRepository.find({ where: { isActive: true } }))
        await this.loadNode(node);
  }

  async loadNode(node: StorageNode): Promise<void> {
    if (!node.isActive) {
      this.removeNode(node.nodeId);
      return;
    }
    const client = this.createClient(node);
    const previous = this.nodes.get(node.nodeId);
    this.nodes.set(node.nodeId, { client, config: node, isHealthy: node.isHealthy });
    previous?.client.destroy();
  }

  async refreshNode(node: StorageNode): Promise<void> {
    await this.loadNode(node);
  }

  removeNode(nodeId: string): void {
    this.nodes.get(nodeId)?.client.destroy();
    this.nodes.delete(nodeId);
  }

  getClientForNode(nodeId: string): S3Client {
    const entry = this.nodes.get(nodeId);
    if (!entry || !entry.isHealthy || !entry.config.isActive)
      throw new Error(`No healthy active storage client for node ${nodeId}`);
    return entry.client;
  }

  selectNode(): StorageNode {
    const healthy = this.getHealthyClients();
    if (healthy.length === 0) throw new Error('No healthy active storage nodes are available');
    const entry = healthy[this.roundRobinCursor % healthy.length];
    this.roundRobinCursor = (this.roundRobinCursor + 1) % healthy.length;
    return entry.config;
  }

  getHealthyClients(): Array<{ nodeId: string; client: S3Client; config: StorageNode }> {
    return [...this.nodes.entries()]
      .filter(([, entry]) => entry.isHealthy && entry.config.isActive)
      .map(([nodeId, entry]) => ({ nodeId, client: entry.client, config: entry.config }));
  }

  private createClient(config: StorageNode): S3Client {
    return new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
}
