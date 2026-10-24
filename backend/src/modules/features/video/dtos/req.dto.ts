import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PlaylistVisibility } from '../domain/enums/playlist-visibility.enum';
import { VideoVisibility } from '../domain/enums/video-visibility.enum';
import { SharePlatform } from '../domain/enums/share-platform.enum';
import { AtLeastNonEmpty } from '../../../../common/validators/at-least-non-empty.validator';

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
  visibility: VideoVisibility;

  allowComments: boolean;

  scheduleAt?: Date;

  title?: string;

  description?: string;
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
