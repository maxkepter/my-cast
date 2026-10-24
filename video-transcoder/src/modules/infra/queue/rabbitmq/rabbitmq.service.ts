import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  QueueJobOptions,
  QueueService,
} from '../application/queue-service.interface';
import { Handler } from '../../../../common/application/handler';

@Injectable()
export class RabbitmqService implements QueueService, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private readonly consumerTags = new Map<string, string>();

  constructor(private readonly amqp: AmqpConnection) {}

  async publish<T>(
    queueName: string,
    data: T,
    _options?: QueueJobOptions,
  ): Promise<void> {
    await this.amqp.publish('', queueName, data);
  }

  async consume<T>(queueName: string, handler: Handler<T>): Promise<void> {
    if (this.consumerTags.has(queueName)) return;

    const channel = this.amqp.channel;
    await channel.assertQueue(queueName, { durable: true });

    const { consumerTag } = await channel.consume(
      queueName,
      async (msg: any) => {
        if (!msg) return;
        try {
          const data = JSON.parse(msg.content.toString()) as T;
          await handler.handle(data);
          channel.ack(msg);
        } catch (err) {
          this.logger.error(`Error processing message from ${queueName}`, err);
          channel.nack(msg, false, false);
        }
      },
    );

    this.consumerTags.set(queueName, consumerTag);
  }

  async onModuleDestroy(): Promise<void> {
    const channel = this.amqp.channel;
    for (const tag of this.consumerTags.values()) {
      await channel.cancel(tag).catch(() => null);
    }
    this.consumerTags.clear();
  }
}
