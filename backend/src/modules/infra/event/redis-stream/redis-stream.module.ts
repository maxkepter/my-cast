/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { RedisModule } from '../../cache/redis/redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Module({
  imports: [ConfigModule, RedisModule],
  controllers: [],
  providers: [Redis],
  exports: [],
})
export class RedisStreamModule {}
