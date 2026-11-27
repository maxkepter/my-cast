import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class VideoUploadedMessageDto {
  @IsUUID()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^(?!.*\.\.)[^/\\\s]+$/, {
    message: 'videoId must not contain path separators, whitespace, or ".."',
  })
  videoId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  authorId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  @Matches(/^(?!\/)(?!.*(?:\.\.|\\)).+$/, {
    message:
      'videoKey must be a relative storage key without leading "/" or ".."',
  })
  videoKey!: string;

  @IsOptional()
  @IsBoolean()
  isSuccess?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  thumbnailKey?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nodeId?: string;

  @IsOptional()
  @IsString()
  occuredOn?: string;
}
