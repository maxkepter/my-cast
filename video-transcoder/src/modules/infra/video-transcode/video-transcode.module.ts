import { Module } from '@nestjs/common';
import { FfmpegModule } from './infra/ffmpeg/ffmpeg.module';
import { VIDEO_PROCESSING_SERVICE } from './application/interfaces/video-processing.interface';

@Module({
  imports: [FfmpegModule],
  controllers: [],
  providers: [],
  exports: [VIDEO_PROCESSING_SERVICE],
})
export class VideoTranscodeModule {}
