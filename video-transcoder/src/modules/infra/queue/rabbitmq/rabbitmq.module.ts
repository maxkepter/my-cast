import { Module } from '@nestjs/common';
import { RabbitmqModule as RabbitmqConnectionModule } from '../../rabbitmq/rabbitmq.module';
import { RabbitmqService } from './rabbitmq.service';
import { QUEUE_SERVICE } from '../application/queue-service.interface';

@Module({
  imports: [RabbitmqConnectionModule],
  providers: [RabbitmqService, { provide: QUEUE_SERVICE, useExisting: RabbitmqService }],
  exports: [RabbitmqConnectionModule, RabbitmqService, QUEUE_SERVICE],
})
export class RabbitmqModule {}
