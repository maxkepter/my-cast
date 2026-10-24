import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { ReportReason, ReportTargetType } from '../domain/enums/report.enum';

export class CreateCommentReqDto {
  @IsNotEmpty({ message: 'videoId is required' })
  @IsUUID('4', { message: 'videoId must be a valid UUID' })
  videoId!: string;

  @IsNotEmpty({ message: 'content is required' })
  @IsString({ message: 'content must be a string' })
  @Length(1, 2000, { message: 'content must be between 1 and 2000 characters' })
  content!: string;

  @IsOptional()
  @IsUUID('4', { message: 'parentId must be a valid UUID' })
  parentId?: string;
}

export class UpdateCommentReqDto {
  @IsNotEmpty({ message: 'content is required' })
  @IsString({ message: 'content must be a string' })
  @Length(1, 2000, { message: 'content must be between 1 and 2000 characters' })
  content!: string;
}

export class DeleteCommentReqDto {
  @IsNotEmpty({ message: 'commentId is required' })
  @IsUUID('4', { message: 'commentId must be a valid UUID' })
  commentId!: string;
}

export class CreateReportReqDto {
  @IsNotEmpty({ message: 'targetType is required' })
  @IsEnum(ReportTargetType, {
    message: 'targetType must be VIDEO or COMMENT',
  })
  targetType!: ReportTargetType;

  @IsNotEmpty({ message: 'targetId is required' })
  @IsUUID('4', { message: 'targetId must be a valid UUID' })
  targetId!: string;

  @IsNotEmpty({ message: 'reason is required' })
  @IsEnum(ReportReason, {
    message: 'reason must be a valid ReportReason',
  })
  reason!: ReportReason;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @Length(0, 1000, { message: 'description must not exceed 1000 characters' })
  description?: string;
}

export class BlockUserReqDto {
  @IsNotEmpty({ message: 'targetUserId is required' })
  @IsUUID('4', { message: 'targetUserId must be a valid UUID' })
  targetUserId!: string;
}
