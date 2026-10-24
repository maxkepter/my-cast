import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '../enums/report.enum';
import { ReportDetail } from '../value-objects/report-detail.vo';

@Entity('content_reports')
export class ContentReport {
  @PrimaryGeneratedColumn('uuid')
  reportId!: string;

  @Column({ type: 'uuid', nullable: true })
  reporterId!: string | null;

  @Column({
    type: 'enum',
    enum: ReportTargetType,
  })
  targetType!: ReportTargetType;

  @Column({ type: 'uuid' })
  targetId!: string;

  @Column({
    type: 'enum',
    enum: ReportReason,
  })
  reason!: ReportReason;

  @Column(() => ReportDetail, { prefix: false })
  detail!: ReportDetail;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status!: ReportStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  resolve(status: ReportStatus, reviewerId: string): void {
    if (this.status !== ReportStatus.PENDING) {
      throw new Error('Report has already been resolved');
    }
    this.status = status;
    this.reviewedBy = reviewerId;
  }

  static create(
    reportId: string | undefined,
    reporterId: string | null,
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    description?: string,
  ): ContentReport {
    const report = new ContentReport();
    if (reportId) {
      report.reportId = reportId;
    }
    report.reporterId = reporterId;
    report.targetType = targetType;
    report.targetId = targetId;
    report.reason = reason;
    report.detail = ReportDetail.create(description);
    report.status = ReportStatus.PENDING;
    report.reviewedBy = null;
    return report;
  }
}
