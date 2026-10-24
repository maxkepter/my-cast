import { DomainEvent } from '../../../../../common/domain/domain-event';
import { ReportReason, ReportTargetType } from '../enums/report.enum';

export class ContentReportedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'content.reported';

  constructor(
    public readonly reportId: string,
    public readonly targetType: ReportTargetType,
    public readonly targetId: string,
    public readonly reporterId: string | null,
    public readonly reason: ReportReason,
  ) {
    super();
  }

  getEventName(): string {
    return ContentReportedEvent.EVENT_NAME;
  }
}
