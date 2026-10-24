import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateChannelReqDto {
  @IsOptional()
  @IsString({ message: 'Channel name must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Channel bio must be a string' })
  bio?: string;

  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: 'Banner URL must be a string' })
  bannerUrl?: string;

  @IsOptional()
  @IsObject({ message: 'Social links must be an object' })
  socialLinks?: Record<string, string>;
}

export class FollowChannelReqDto {
  @IsNotEmpty({ message: 'Channel ID is required' })
  @IsString({ message: 'Channel ID must be a string' })
  channelId!: string;
}
