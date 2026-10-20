import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { INTERNAL_EVENT_BUS } from './application/internal-event-bus.interface';
import { EventEmitterService } from './event-emitter/event-emitter.service';
import { RedisStreamModule } from './redis-stream/redis-stream.module';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    EventEmitterService,
    RedisStreamModule,
    {
      provide: INTERNAL_EVENT_BUS,
      useExisting: EventEmitterService,
    },
  ],
  exports: [EventEmitterModule, INTERNAL_EVENT_BUS, EventEmitterService],
})
export class EventModule {}
