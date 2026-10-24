import { Module } from '@nestjs/common';
import { FfmpegModule } from './infra/ffmpeg/ffmpeg.module';
import { FfmpegService } from './infra/ffmpeg/services/ffmpeg.service';
import { VIDEO_PROCESSING_SERVICE } from './application/interfaces/video-processing.interface';

@Module({
  imports: [FfmpegModule],
  controllers: [],
  providers: [
    {
      provide: VIDEO_PROCESSING_SERVICE,
      useExisting: FfmpegService,
    },
  ],
  exports: [VIDEO_PROCESSING_SERVICE, FfmpegModule],
})
export class VideoTranscodeModule {}
