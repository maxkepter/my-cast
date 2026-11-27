import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging';
import { StorageModule } from '../storage';
import { VideoTranscodeModule } from '../../infra/video-transcode';
import { VideoProcessService } from './application/services/video-process.service';
import { VideoUploadConsumer } from './infra/consumers/video-upload.consumer';
import { VIDEO_PROCESS_TOPOLOGY } from './infra/messaging/video-process.topology';

@Module({
  imports: [
    MessagingModule.forFeature(VIDEO_PROCESS_TOPOLOGY),
    StorageModule,
    VideoTranscodeModule,
  ],
  controllers: [],
  providers: [VideoProcessService, VideoUploadConsumer],
  exports: [],
})
export class VideoProcessModule {}
