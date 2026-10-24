import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '../../infra/redis/redis.module';
import { INTERNAL_EVENT_BUS } from './application/internal-event-bus.interface';
import { INTEGRATION_EVENT_BUS } from './application/integration-event-bus.interface';
import { EventEmitterService } from './event-emitter/event-emitter.service';
import { RedisStreamEventBus } from './infrastructure/redis-stream/redis-stream-event-bus.service';
import { RedisStreamExplorer } from './infrastructure/redis-stream/redis-stream-explorer';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DiscoveryModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    EventEmitterService,
    {
      provide: INTERNAL_EVENT_BUS,
      useExisting: EventEmitterService,
    },
    RedisStreamEventBus,
    {
      provide: INTEGRATION_EVENT_BUS,
      useExisting: RedisStreamEventBus,
    },
    RedisStreamExplorer,
  ],
  exports: [
    EventEmitterModule,
    INTERNAL_EVENT_BUS,
    INTEGRATION_EVENT_BUS,
    EventEmitterService,
    RedisStreamEventBus,
  ],
})
export class EventModule {}

