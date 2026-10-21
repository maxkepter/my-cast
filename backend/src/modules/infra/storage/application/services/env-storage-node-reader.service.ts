import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { StorageNode } from '../../domain/entities/storage-node.entity';
import { StorageNodeSource } from '../../domain/enums/storage-node-source.enum';
import { EnvStorageNodeReaderPort } from '../ports/env-storage-node-reader.port';

@Injectable()
export class EnvStorageNodeReader implements EnvStorageNodeReaderPort {
  constructor(private readonly config: ConfigService) {}

  getNodes(): StorageNode[] {
    const raw = this.config.get<string>('STORAGE_NODES');
    if (!raw) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('STORAGE_NODES must be valid JSON');
    }
    if (!Array.isArray(parsed))
      throw new Error('STORAGE_NODES must be a JSON array');

    return parsed.map((value: unknown, index: number) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`STORAGE_NODES[${index}] must be an object`);
      }
      const node = value as Record<string, unknown>;
      const accessKeyId = node.accessKeyId ?? node.accesssKeyId;
      const secretAccessKey = node.secretAccessKey ?? node.scretAccessKey;
      for (const [key, field] of [
        ['name', node.name],
        ['endpoint', node.endpoint],
        ['region', node.region],
        ['bucket', node.bucket],
        ['accessKeyId', accessKeyId],
        ['secretAccessKey', secretAccessKey],
      ] as const) {
        if (typeof field !== 'string' || field.length === 0) {
          throw new Error(
            `STORAGE_NODES[${index}].${key} must be a non-empty string`,
          );
        }
      }
      const endpoint = node.endpoint as string;
      const bucket = node.bucket as string;
      const stableId = createHash('sha256')
        .update(`${endpoint}\n${bucket}`)
        .digest('hex')
        .slice(0, 24);
      return {
        nodeId: typeof node.id === 'string' && node.id ? node.id : stableId,
        name: node.name as string,
        endpoint,
        region: node.region as string,
        bucket,
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
        forcePathStyle:
          typeof node.forcePathStyle === 'boolean'
            ? node.forcePathStyle
            : this.config.get<string>('STORAGE_FORCE_PATH_STYLE') === 'true',
        publicUrl:
          typeof node.publicUrl === 'string' ? node.publicUrl : undefined,
        quotaBytes: String(node.quotaBytes ?? node.quota ?? '0'),
        usedBytes: '0',
        isActive: true,
        isHealthy: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  }
}
