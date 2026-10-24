/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { RabbitmqModule } from '../../infra/queue/rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitmqModule],
  controllers: [],
  providers: [],
})
export class VideoProcessModule {}
