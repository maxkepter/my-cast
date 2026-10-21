import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('storages')
@Index('IDX_storages_node_status', ['storageNodeId', 'status'])
export class StorageObject {
  @PrimaryColumn({ type: 'varchar', length: 500 })
  storageKey!: string;

  @Column({ type: 'varchar', length: 255 })
  originName!: string;

  @Column({ type: 'varchar', length: 255 })
  bucket!: string;

  @Column({ type: 'varchar', length: 100 })
  contentType!: string;

  @Column({ type: 'bigint', nullable: true })
  size?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  etag?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  storageNodeId!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'READY' })
  status!: string;

  get storageId(): string {
    return this.storageKey;
  }

  get key(): string {
    return this.storageKey;
  }

  static create(props: {
    storageKey: string;
    originName?: string;
    bucket: string;
    contentType?: string;
    size?: number;
    etag?: string;
    storageNodeId?: string | null;
    status?: string;
  }): StorageObject {
    const storage = new StorageObject();
    storage.storageKey = props.storageKey;
    storage.originName = props.originName ?? '';
    storage.bucket = props.bucket;
    storage.contentType = props.contentType ?? 'application/octet-stream';
    storage.size = props.size === undefined ? undefined : String(props.size);
    storage.etag = props.etag;
    storage.storageNodeId = props.storageNodeId ?? null;
    storage.status = props.status ?? 'READY';
    return storage;
  }
}
