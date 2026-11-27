import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransportType } from '../../contracts/topology-registry/topology-registry';
import { OutboxStatus } from '../enums/outbox-status.enum';

/** Domain entity representing an outgoing integration event persisted for reliable delivery. */
@Entity('outbox_messages')
@Index('IDX_outbox_status_created_at', ['status', 'createdAt'])
@Index('IDX_outbox_event_type', ['eventType'])
@Index('UQ_outbox_event_target', ['eventId', 'transport', 'destination'], {
  unique: true,
})
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @Column({ type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ type: 'text' })
  payload!: string;

  @Column({
    type: 'enum',
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
  })
  status!: OutboxStatus;

  @Column({ type: 'enum', enum: TransportType })
  transport!: TransportType;

  @Column({ type: 'varchar', length: 255 })
  destination!: string;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'text', nullable: true })
  lastError?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  static create(props: {
    eventId: string;
    eventType: string;
    payload: string;
    transport: TransportType;
    destination: string;
    status?: OutboxStatus;
    retryCount?: number;
    lastError?: string | null;
    processedAt?: Date | null;
  }): OutboxEntity {
    const outbox = new OutboxEntity();

    outbox.eventId = props.eventId;
    outbox.eventType = props.eventType;
    outbox.payload = props.payload;
    outbox.transport = props.transport;
    outbox.destination = props.destination;
    outbox.status = props.status ?? OutboxStatus.PENDING;
    outbox.retryCount = props.retryCount ?? 0;
    outbox.lastError = props.lastError ?? null;
    outbox.processedAt = props.processedAt ?? null;
    return outbox;
  }

  markProcessed(): void {
    this.status = OutboxStatus.PROCESSED;
    this.lastError = null;
    this.processedAt = new Date();
  }

  markFailed(error?: string): void {
    this.status = OutboxStatus.FAILED;
    this.retryCount += 1;
    this.lastError = error ?? null;
  }
}
