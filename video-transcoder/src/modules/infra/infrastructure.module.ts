import { Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { VideoTranscodeModule } from '../video-transcode/video-transcode.module';

@Module({
  imports: [QueueModule, VideoTranscodeModule],
  exports: [QueueModule, VideoTranscodeModule],
})
export class InfrastructureModule {}
