import { Module } from '@nestjs/common';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitmqModule],
  exports: [RabbitmqModule],
})
export class QueueModule {}
