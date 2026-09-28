/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { RedisModule } from './cache/redis/redis.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [DatabaseModule, CacheModule, QueueModule, RedisModule],
  controllers: [],
  providers: [],
  exports: [DatabaseModule, CacheModule, QueueModule, RedisModule],
})
export class InfrastructureModule {}
