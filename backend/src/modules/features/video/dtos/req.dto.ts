import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlaylistVisibility } from '../domain/enums/playlist-visibility.enum';
import { VideoVisibility } from '../domain/enums/video-visibility.enum';
import { SharePlatform } from '../domain/enums/share-platform.enum';
import { AtLeastNonEmpty } from '../../../../common/validators/at-least-non-empty.validator';
import { PageReq } from '../../../../common/dtos/page.dto';

export class CreatePlaylistReq {
  @IsNotEmpty({ message: 'Playlist name is required' })
  @IsString({ message: 'Playlist name must be a string' })
  playlistName!: string;

  @IsOptional()
  @IsString({ message: 'Playlist description must be a string' })
  playlistDescription?: string;

  @IsOptional()
  @IsEnum(PlaylistVisibility, {
    message: 'Visibility must be one of PUBLIC, PRIVATE, UNLISTED',
  })
  visibility: PlaylistVisibility = PlaylistVisibility.PUBLIC;
}

export class AddVideoToPlaylistReq {
  @IsNotEmpty({ message: 'Video ID is required' })
  @IsString({ message: 'Video ID must be a string' })
  videoId!: string;

  @IsNotEmpty({ message: 'Playlist ID is required' })
  @IsString({ message: 'Playlist ID must be a string' })
  playlistId!: string;
}

@AtLeastNonEmpty(1, {
  message: 'At least one field must be provided for update',
})
export class UpdateVideoReq {
  @IsOptional()
  @IsEnum(VideoVisibility, {
    message: 'Visibility must be one of PUBLIC, PRIVATE, UNLISTED, SCHEDULED',
  })
  visibility?: VideoVisibility;

  @IsOptional()
  @IsBoolean({ message: 'allowComments must be a boolean' })
  allowComments?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'scheduleAt must be a valid date' })
  scheduleAt?: Date;

  @IsOptional()
  @IsString({ message: 'title must be a string' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;
}

export class WatchHistoryQueryReq extends PageReq {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'size must be an integer' })
  @Min(1, { message: 'size must be at least 1' })
  size: number = 10;
}

export class PlaylistQueryReq extends PageReq {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'size must be an integer' })
  @Min(1, { message: 'size must be at least 1' })
  size: number = 10;
}

export class VideoConfigReq {
  @IsNotEmpty({ message: 'Visibility is required' })
  @IsEnum(VideoVisibility, {
    message: 'Visibility must be one of PUBLIC, PRIVATE, UNLISTED, SCHEDULED',
  })
  visibility!: VideoVisibility;

  @IsNotEmpty({ message: 'Allow comments is required' })
  allowComments!: boolean;

  @IsOptional()
  scheduleAt?: Date;
}

export class UploadVideoReq {
  videoTitle: string;

  videoDescription: string;

  thumbnail?: string;

  videoFile: string;

  videoConfig: VideoConfigReq;
}

export class ShareVideoReqDto {
  @IsNotEmpty({ message: 'Video ID is required' })
  @IsUUID('4', { message: 'Video ID must be a valid UUID' })
  videoId!: string;

  @IsOptional()
  @IsEnum(SharePlatform, {
    message: 'Platform must be one of DIRECT_LINK, FACEBOOK, TWITTER, EMBED',
  })
  platform?: SharePlatform = SharePlatform.DIRECT_LINK;
}

export class ToggleVideoLikeReqDto {
  @IsNotEmpty({ message: 'Video ID is required' })
  @IsUUID('4', { message: 'Video ID must be a valid UUID' })
  videoId!: string;
}
