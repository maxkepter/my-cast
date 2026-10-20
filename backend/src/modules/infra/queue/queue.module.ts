import { Module } from '@nestjs/common';
import { BullmqModule } from './bullmq/bullmq.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { QUEUE_SERVICE } from './application/queue-service.interface';

@Module({
  imports: [BullmqModule, RabbitmqModule],
  exports: [RabbitmqModule, QUEUE_SERVICE],
})
export class QueueModule {}
