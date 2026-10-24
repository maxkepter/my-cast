import { Module } from '@nestjs/common';
import { BullmqModule } from '../../infra/bullmq/bullmq.module';
import { RabbitmqModule } from '../../infra/rabbitmq/rabbitmq.module';
import { QUEUE_SERVICE } from './application/queue-service.interface';
import { BullmqQueueService } from './infrastructure/bullmq-queue.service';
import { RabbitmqQueueService } from './infrastructure/rabbitmq-queue.service';

@Module({
  imports: [BullmqModule, RabbitmqModule],
  controllers: [],
  providers: [
    BullmqQueueService,
    RabbitmqQueueService,
    {
      provide: QUEUE_SERVICE,
      useExisting: RabbitmqQueueService,
    },
  ],
  exports: [
    QUEUE_SERVICE,
    BullmqQueueService,
    RabbitmqQueueService,
    BullmqModule,
    RabbitmqModule,
  ],
})
export class QueueModule {}
