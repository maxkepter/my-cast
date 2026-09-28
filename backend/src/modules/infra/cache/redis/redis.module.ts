/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CACHE_SERVICE } from '../application/interface/cache-service.interface';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';

@Module({
  controllers: [],
  providers: [
    RedisService,
    {
      provide: CACHE_SERVICE,
      inject: [ConfigModule],
      useFactory: (config: ConfigService): Redis =>
        new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          lazyConnect: true,
        }),
    },
  ],
  exports: [CACHE_SERVICE],
})
export class RedisModule {}
