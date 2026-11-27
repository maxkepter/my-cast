import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { VideoTranscodeModule } from './video-transcode/video-transcode.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    MailModule,
    StorageModule,
    VideoTranscodeModule,
    MessagingModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    DatabaseModule,
    CacheModule,
    MailModule,
    StorageModule,
    VideoTranscodeModule,
    MessagingModule,
  ],
})
export class CoreModule {}
