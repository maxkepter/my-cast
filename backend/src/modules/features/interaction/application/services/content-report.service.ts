import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentReport } from '../../domain/entities/content-report.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { ReportTargetType } from '../../domain/enums/report.enum';
import { ContentReportedEvent } from '../../domain/events/content-reported.event';
import { CreateReportReqDto } from '../../dtos/req.dto';
import { ReportSubmissionResDto } from '../../dtos/res.dto';
import { CreateReportUseCase } from '../usecases/create-report.usecase';
import { VideoService } from '../../../video/application/services/video.service';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../../core/event/application/internal-event-bus.interface';

@Injectable()
export class ContentReportService implements CreateReportUseCase {
  constructor(
    @InjectRepository(ContentReport)
    private readonly reportRepo: Repository<ContentReport>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly eventBus: InternalEventBus,
    private readonly videoService: VideoService,
  ) {}

  async execute(
    reporterId: string | null,
    dto: CreateReportReqDto,
  ): Promise<ReportSubmissionResDto> {
    return this.createReport(reporterId, dto);
  }

  async createReport(
    reporterId: string | null,
    dto: CreateReportReqDto,
  ): Promise<ReportSubmissionResDto> {
    if (dto.targetType === ReportTargetType.VIDEO) {
      const video = await this.videoService.getVideoBasicInfo(dto.targetId);
      if (!video) {
        throw new NotFoundException('Reported video does not exist');
      }
    } else if (dto.targetType === ReportTargetType.COMMENT) {
      const comment = await this.commentRepo.findOne({
        where: { commentId: dto.targetId },
      });
      if (!comment) {
        throw new NotFoundException('Reported comment does not exist');
      }
    }

    const report = ContentReport.create(
      undefined,
      reporterId,
      dto.targetType,
      dto.targetId,
      dto.reason,
      dto.description,
    );

    const saved = await this.reportRepo.save(report);

    await this.eventBus.publish(
      new ContentReportedEvent(
        saved.reportId,
        saved.targetType,
        saved.targetId,
        saved.reporterId,
        saved.reason,
      ),
    );

    return ReportSubmissionResDto.of(
      saved.reportId,
      saved.status,
      saved.createdAt ?? new Date(),
    );
  }
}
