import { Module } from '@nestjs/common';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { QUEUE_SERVICE } from './application/queue-service.interface';

@Module({
  imports: [RabbitmqModule],
  exports: [RabbitmqModule, QUEUE_SERVICE],
})
export class QueueModule {}
