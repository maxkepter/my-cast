import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransportType } from '../../contracts/topology-registry/topology-registry';
import { InboxStatus } from '../enums/inbox-status.enum';

/** Domain entity representing an incoming integration event tracked per consumer for idempotency. */
@Entity('inbox_messages')
@Index('UQ_inbox_event_consumer', ['eventId', 'consumer'], { unique: true })
@Index('IDX_inbox_status_created_at', ['status', 'createdAt'])
export class InboxEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  eventId!: string;

  @Column({ type: 'varchar', length: 255 })
  consumer!: string;

  @Column({ type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ type: 'text' })
  payload!: string;

  @Column({ type: 'enum', enum: TransportType })
  transport!: TransportType;

  @Column({ type: 'varchar', length: 255 })
  source!: string;

  @Column({
    type: 'enum',
    enum: InboxStatus,
    default: InboxStatus.PENDING,
  })
  status!: InboxStatus;

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
    consumer: string;
    eventType: string;
    payload: string;
    transport: TransportType;
    source: string;
    status?: InboxStatus;
    retryCount?: number;
    lastError?: string | null;
    processedAt?: Date | null;
  }): InboxEntity {
    const inbox = new InboxEntity();
    inbox.eventId = props.eventId;
    inbox.consumer = props.consumer;
    inbox.eventType = props.eventType;
    inbox.payload = props.payload;
    inbox.transport = props.transport;
    inbox.source = props.source;
    inbox.status = props.status ?? InboxStatus.PENDING;
    inbox.retryCount = props.retryCount ?? 0;
    inbox.lastError = props.lastError ?? null;
    inbox.processedAt = props.processedAt ?? null;
    return inbox;
  }

  markProcessed(): void {
    this.status = InboxStatus.PROCESSED;
    this.lastError = null;
    this.processedAt = new Date();
  }

  markFailed(error?: string): void {
    this.status = InboxStatus.FAILED;
    this.retryCount += 1;
    this.lastError = error ?? null;
  }
}
