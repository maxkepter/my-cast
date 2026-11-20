import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentReportController } from './content-report.controller';
import { ContentReportService } from '../../application/services/content-report.service';
import { CreateReportReqDto } from '../../dtos/req.dto';
import { ReportSubmissionResDto } from '../../dtos/res.dto';
import {
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '../../domain/enums/report.enum';

describe('ContentReportController', () => {
  let controller: ContentReportController;
  let service: {
    createReport: ReturnType<typeof vi.fn>;
  };

  const reporterId = '11111111-1111-4111-8111-111111111111';
  const targetId = '22222222-2222-4222-8222-222222222222';
  const reportId = '33333333-3333-4333-8333-333333333333';
  const submittedAt = new Date('2026-10-25T10:00:00Z');

  beforeEach(() => {
    service = {
      createReport: vi.fn(),
    };
    controller = new ContentReportController(
      service as unknown as ContentReportService,
    );
  });

  it('creates report with authenticated user reporterId', async () => {
    const dto: CreateReportReqDto = {
      targetType: ReportTargetType.VIDEO,
      targetId,
      reason: ReportReason.SPAM,
      description: 'Spam content',
    };

    const expectedRes = ReportSubmissionResDto.of(
      reportId,
      ReportStatus.PENDING,
      submittedAt,
    );
    service.createReport.mockResolvedValue(expectedRes);

    const result = await controller.createReport(reporterId, dto);

    expect(service.createReport).toHaveBeenCalledWith(reporterId, dto);
    expect(result).toEqual(expectedRes);
  });

  it('creates report with null reporterId when guest (reporterId is undefined)', async () => {
    const dto: CreateReportReqDto = {
      targetType: ReportTargetType.COMMENT,
      targetId,
      reason: ReportReason.HARASSMENT,
    };

    const expectedRes = ReportSubmissionResDto.of(
      reportId,
      ReportStatus.PENDING,
      submittedAt,
    );
    service.createReport.mockResolvedValue(expectedRes);

    const result = await controller.createReport(undefined, dto);

    expect(service.createReport).toHaveBeenCalledWith(null, dto);
    expect(result).toEqual(expectedRes);
  });
});
