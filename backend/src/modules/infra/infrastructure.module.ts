import { Module } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { BullmqModule } from './bullmq/bullmq.module';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [
    RedisModule,
    RabbitmqModule,
    BullmqModule,
    MailerModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    RedisModule,
    RabbitmqModule,
    BullmqModule,
    MailerModule,
  ],
})
export class InfrastructureModule {}
