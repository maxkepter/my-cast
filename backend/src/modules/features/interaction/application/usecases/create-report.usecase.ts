import { CreateReportReqDto } from '../../dtos/req.dto';
import { ReportSubmissionResDto } from '../../dtos/res.dto';

export interface CreateReportUseCase {
  /**
   * Báo cáo nội dung video hoặc comment vi phạm tiêu chuẩn cộng đồng.
   *
   * @param reporterId - ID người báo cáo (null nếu guest báo cáo).
   * @param dto - Nội dung báo cáo.
   * @returns ReportSubmissionResDto.
   */
  execute(
    reporterId: string | null,
    dto: CreateReportReqDto,
  ): Promise<ReportSubmissionResDto> | ReportSubmissionResDto;
}
