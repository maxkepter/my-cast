import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { QueueModule } from './queue/queue.module';
import { EventModule } from './event/event.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { VideoTranscodeModule } from './video-transcode/video-transcode.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    QueueModule,
    EventModule,
    MailModule,
    StorageModule,
    VideoTranscodeModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    DatabaseModule,
    CacheModule,
    QueueModule,
    EventModule,
    MailModule,
    StorageModule,
    VideoTranscodeModule,
  ],
})
export class CoreModule {}
