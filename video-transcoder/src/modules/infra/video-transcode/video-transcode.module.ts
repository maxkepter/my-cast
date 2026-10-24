import { Module } from '@nestjs/common';
import { VIDEO_TRANSCODE_CONTRACT } from './contracts/video-transcode.contract';
import { FfmpegVideoTranscodeService } from './services/ffmpeg-video-transcode.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    FfmpegVideoTranscodeService,
    {
      provide: VIDEO_TRANSCODE_CONTRACT,
      useExisting: FfmpegVideoTranscodeService,
    },
  ],
  exports: [VIDEO_TRANSCODE_CONTRACT, FfmpegVideoTranscodeService],
})
export class VideoTranscodeModule {}
