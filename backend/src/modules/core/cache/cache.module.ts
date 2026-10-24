import { Module } from '@nestjs/common';
import { RedisModule } from '../../infra/redis/redis.module';
import { CACHE_SERVICE } from './application/interface/cache-service.interface';
import { RedisCacheService } from './infrastructure/redis-cache.service';

@Module({
  imports: [RedisModule],
  controllers: [],
  providers: [
    RedisCacheService,
    {
      provide: CACHE_SERVICE,
      useExisting: RedisCacheService,
    },
  ],
  exports: [CACHE_SERVICE, RedisCacheService],
})
export class CacheModule {}
