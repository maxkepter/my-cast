import { Module } from '@nestjs/common';
import { ClientModule } from './client/client.module';
import { QueueModule } from './queue/queue.module';
import { VideoTranscodeModule } from './video-transcode';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [ClientModule, QueueModule, VideoTranscodeModule, StorageModule],
  exports: [ClientModule, QueueModule, VideoTranscodeModule, StorageModule],
})
export class InfrastructureModule {}
