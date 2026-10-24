import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('storage_nodes')
export class StorageNode {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  nodeId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 2048 })
  endpoint!: string;

  @Column({ type: 'varchar', length: 255 })
  region!: string;

  @Column({ type: 'varchar', length: 255 })
  bucket!: string;

  @Column({ type: 'boolean', default: true })
  forcePathStyle!: boolean;

  @Column({ type: 'varchar', length: 255 })
  accessKeyId!: string;

  @Column({ type: 'text' })
  secretAccessKey!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  publicUrl?: string | null;

  @Column({ type: 'bigint', default: 0 })
  quotaBytes!: string;

  @Column({ type: 'bigint', default: 0 })
  usedBytes!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: true })
  isHealthy!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
