import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageNode } from '../../domain/entities/storage-node.entity';
import { StorageNodeSource } from '../../domain/enums/storage-node-source.enum';
import { EnvStorageNodeReaderPort } from '../ports/env-storage-node-reader.port';

@Injectable()
export class StorageNodeService implements EnvStorageNodeReaderPort {
  constructor(private readonly config: ConfigService) {}

  getNodes(): StorageNode[] {
    const raw = this.config.get<string>('STORAGE_NODES');
    if (!raw) return [];

    let nodes: unknown;
    try {
      nodes = JSON.parse(raw);
    } catch {
      throw new Error('STORAGE_NODES must be valid JSON');
    }

    if (!Array.isArray(nodes)) {
      throw new Error('STORAGE_NODES must be a JSON array');
    }

    return nodes.map((value: unknown, index: number) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`STORAGE_NODES[${index}] must be an object`);
      }
      const node = value as Record<string, unknown>;
      const required = [
        'name',
        'endpoint',
        'region',
        'accessKeyId',
        'secretAccessKey',
        'bucket',
      ];
      for (const key of required) {
        if (typeof node[key] !== 'string' || !node[key]) {
          throw new Error(
            `STORAGE_NODES[${index}].${key} must be a non-empty string`,
          );
        }
      }
      const quota = Number(node.quotaBytes ?? node.quota ?? 0);
      if (quota < 0 || !Number.isSafeInteger(quota)) {
        throw new Error(
          `STORAGE_NODES[${index}].quota must be a non-negative number`,
        );
      }

      return {
        nodeId: typeof node.id === 'string' && node.id ? node.id : `node-${index + 1}`,
        source: StorageNodeSource.ENV,
        name: node.name as string,
        endpoint: node.endpoint as string,
        region: node.region as string,
        bucket: node.bucket as string,
        accessKeyId: node.accessKeyId as string,
        secretAccessKey: node.secretAccessKey as string,
        forcePathStyle: typeof node.forcePathStyle === 'boolean' ? node.forcePathStyle : true,
        publicUrl: typeof node.publicUrl === 'string' ? node.publicUrl : undefined,
        quotaBytes: String(quota),
        usedBytes: '0',
        isActive: node.isActive !== false,
        isHealthy: node.isHealthy !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }
}
