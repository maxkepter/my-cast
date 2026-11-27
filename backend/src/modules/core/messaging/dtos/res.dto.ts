import { TransportType } from '../contracts/topology-registry/topology-registry';
import { InboxStatus } from '../domain/enums/inbox-status.enum';
import { OutboxStatus } from '../domain/enums/outbox-status.enum';

export class OutboxRes {
  id!: string;
  eventId!: string;
  eventType!: string;
  payload!: string;
  transport!: TransportType;
  destination!: string;
  status!: OutboxStatus;
  retryCount!: number;
  lastError?: string | null;
  processedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export class InboxRes {
  id!: string;
  eventId!: string;
  consumer!: string;
  eventType!: string;
  payload!: string;
  transport!: TransportType;
  source!: string;
  status!: InboxStatus;
  retryCount!: number;
  lastError?: string | null;
  processedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
