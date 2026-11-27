import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { MessagingModule } from './messaging/messaging.module';
import { StorageModule } from './storage/storage.module';
import { VideoProcessModule } from './video-process/videoprocess.module';

@Module({
  imports: [
    DatabaseModule,
    MessagingModule,
    StorageModule,
    VideoProcessModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    DatabaseModule,
    MessagingModule,
    StorageModule,
  ],
})
export class CoreModule {}
