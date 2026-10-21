import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class VideoTranscodeReq {
  @IsNotEmpty()
  @IsString()
  inputPath!: string;

  @IsNotEmpty()
  @IsString()
  outputPath!: string;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  videoCodec?: string;

  @IsOptional()
  @IsString()
  audioCodec?: string;

  /** e.g. '2000k' */
  @IsOptional()
  @IsString()
  videoBitrate?: string;

  /** e.g. '128k' */
  @IsOptional()
  @IsString()
  audioBitrate?: string;

  /** Max 7680 (8K) */
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(7680)
  width?: number;

  /** Max 4320 (8K) */
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(4320)
  height?: number;

  /** Max 240 fps */
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(240)
  frameRate?: number;
}

export class VideoCompressionReq {
  @IsNotEmpty()
  @IsString()
  inputPath!: string;

  @IsNotEmpty()
  @IsString()
  outputPath!: string;

  /** CRF 0–51 (lower = better quality). Default: 28 */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(51)
  crf = 28;

  /** ffmpeg preset: ultrafast → veryslow. Default: medium */
  @IsOptional()
  @IsString()
  preset = 'medium';

  /** e.g. '128k'. Default: '128k' */
  @IsOptional()
  @IsString()
  audioBitrate = '128k';
}

export class ExtractAudioReq {
  @IsNotEmpty()
  @IsString()
  inputPath!: string;

  @IsNotEmpty()
  @IsString()
  outputPath!: string;

  /** Default: 'aac' */
  @IsOptional()
  @IsString()
  audioCodec = 'aac';

  /** Default: '192k' */
  @IsOptional()
  @IsString()
  audioBitrate = '192k';
}

export class GenerateThumbnailReq {
  @IsNotEmpty()
  @IsString()
  inputPath!: string;

  /** Full output file path (directory must exist). e.g. '/tmp/thumb.jpg' */
  @IsNotEmpty()
  @IsString()
  outputPath!: string;

  /** HH:MM:SS or seconds. Default: '00:00:01' */
  @IsOptional()
  @IsString()
  timestamp = '00:00:01';

  /** WxH e.g. '320x240'. Optional. */
  @IsOptional()
  @IsString()
  size?: string;
}

export class GenerateHlsReq {
  @IsNotEmpty()
  @IsString()
  inputPath!: string;

  /** Output directory (must exist). Segments and playlist written here. */
  @IsNotEmpty()
  @IsString()
  outputDirectory!: string;

  /** Playlist filename. Default: 'master.m3u8' */
  @IsOptional()
  @IsString()
  playlistName = 'master.m3u8';

  /** Segment length in seconds (1–30). Default: 6 */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  segmentDuration = 6;
}

export class GetVideoMetadataReq {
  @IsNotEmpty()
  @IsString()
  inputPath!: string;
}
