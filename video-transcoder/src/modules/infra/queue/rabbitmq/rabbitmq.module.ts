import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqService } from './rabbitmq.service';
import { QUEUE_SERVICE } from '../application/queue-service.interface';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('RABBITMQ_URI', 'amqp://guest:guest@localhost:5672'),
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true,
      }),
    }),
  ],
  providers: [
    RabbitmqService,
    { provide: QUEUE_SERVICE, useExisting: RabbitmqService },
  ],
  exports: [RabbitMQModule, RabbitmqService, QUEUE_SERVICE],
})
export class RabbitmqModule {}
