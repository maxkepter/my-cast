/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { RedisModule } from './cache/redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { EventModule } from './event/event.module';
import { FfmpegModule } from './ffmpeg/ffmpeg.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    QueueModule,
    RedisModule,
    MailModule,
    StorageModule,
    EventModule,
    FfmpegModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    DatabaseModule,
    CacheModule,
    QueueModule,
    RedisModule,
    MailModule,
    StorageModule,
    EventModule,
    FfmpegModule,
  ],
})
export class InfrastructureModule {}
