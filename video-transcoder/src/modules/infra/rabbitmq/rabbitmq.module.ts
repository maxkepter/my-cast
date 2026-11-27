import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MessageHandlerErrorBehavior,
  RabbitMQModule,
} from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const parsedPrefetch = Number(
          config.get<number | string>('RABBITMQ_PREFETCH', 1),
        );
        const prefetchCount =
          Number.isInteger(parsedPrefetch) && parsedPrefetch > 0
            ? parsedPrefetch
            : 1;

        return {
          uri: config.get<string>(
            'RABBITMQ_URI',
            'amqp://guest:guest@localhost:5672',
          ),
          prefetchCount,
          defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
          connectionInitOptions: { wait: false },
          enableControllerDiscovery: true,
        };
      },
    }),
  ],
  controllers: [],
  providers: [],
  exports: [RabbitMQModule],
})
export class RabbitmqModule {}
