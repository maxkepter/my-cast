import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OptionalJwtGuard } from '../guards/optional-jwt.guard';
import { CurrentUser } from '../../../auth/contracts/auth.contract';
import { ContentReportService } from '../../application/services/content-report.service';
import { CreateReportReqDto } from '../../dtos/req.dto';
import { ReportSubmissionResDto } from '../../dtos/res.dto';

@Controller(['api/reports', 'reports'])
export class ContentReportController {
  constructor(private readonly contentReportService: ContentReportService) {}

  @Post()
  @UseGuards(OptionalJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReport(
    @CurrentUser('userId') reporterId?: string,
    @Body() dto?: CreateReportReqDto,
  ): Promise<ReportSubmissionResDto> {
    return this.contentReportService.createReport(
      reporterId ?? null,
      dto as CreateReportReqDto,
    );
  }
}
