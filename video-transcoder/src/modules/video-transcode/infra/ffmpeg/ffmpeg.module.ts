import { Module } from '@nestjs/common';
import { VIDEO_PROCESSING_SERVICE } from '../../application/interfaces/video-processing.interface';
import { FfmpegService } from './services/ffmpeg.service';

@Module({
  imports: [],
  providers: [
    FfmpegService,
    {
      provide: VIDEO_PROCESSING_SERVICE,
      useExisting: FfmpegService,
    },
  ],
  exports: [VIDEO_PROCESSING_SERVICE, FfmpegService],
})
export class FfmpegModule {}
