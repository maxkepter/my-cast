import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsIn, IsInt, IsNumber, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';

const KEY = /^(?!\/)(?!.*\.\.)(?!.*[\\\x00-\x1f\x7f])\S(?:.*\S)?$/;

export class VideoProcessCompletedMessageDto {
  @IsUUID() id!: string;
  @IsDateString({ strict: true }) occuredOn!: string;
  @IsUUID() videoId!: string;
  @IsUUID() authorId!: string;
  @IsString() @MaxLength(500) @Matches(KEY) videoKey!: string;
  @IsString() @MaxLength(500) @Matches(KEY) masterPlaylistKey!: string;
  @IsString() @MaxLength(500) @Matches(KEY) thumbnailKey!: string;
  @IsString() @MaxLength(500) @Matches(KEY) storyboardVttKey!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10000) @IsString({ each: true }) @MaxLength(500, { each: true }) @Matches(KEY, { each: true }) storyboardSpriteKeys!: string[];
  @IsString() @MaxLength(500) @Matches(KEY) previewKey!: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(4) @IsIn(['1080p', '720p', '480p', '360p'], { each: true }) renditions!: string[];
  @IsNumber({ allowInfinity: false, allowNaN: false }) @Min(Number.MIN_VALUE) duration!: number;
  @IsInt() @Min(1) width!: number;
  @IsInt() @Min(1) height!: number;
}
