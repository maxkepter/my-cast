import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { StorageObjectStatus } from '../enums/storage-object-status.enum';

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

  @Column({
    type: 'enum',
    enum: StorageObjectStatus,
    default: StorageObjectStatus.READY,
  })
  status!: StorageObjectStatus;

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
    status?: StorageObjectStatus;
  }): StorageObject {
    const storage = new StorageObject();
    storage.storageKey = props.storageKey;
    storage.originName = props.originName ?? '';
    storage.bucket = props.bucket;
    storage.contentType = props.contentType ?? 'application/octet-stream';
    storage.size = props.size === undefined ? undefined : String(props.size);
    storage.etag = props.etag;
    storage.storageNodeId = props.storageNodeId ?? null;
    storage.status = props.status ?? StorageObjectStatus.READY;
    return storage;
  }
}
