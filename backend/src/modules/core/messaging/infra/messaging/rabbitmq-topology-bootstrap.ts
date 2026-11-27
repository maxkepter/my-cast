import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import {
  TOPOLOGY_REGISTRY,
  TopologyRegistry,
} from '../../contracts/topology-registry/topology-registry';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitMQTopologyBootstrap implements OnApplicationBootstrap {
  private readonly logger = new Logger(RabbitMQTopologyBootstrap.name);

  constructor(
    private readonly rabbitMQConnection: AmqpConnection,
    @Inject(TOPOLOGY_REGISTRY)
    private readonly topologyRegistry: TopologyRegistry,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.rabbitMQConnection.managedChannel.addSetup(
      async (channel: ConfirmChannel) => {
        await this.assertTopology(channel);
      },
    );
  }

  private async assertTopology(channel: ConfirmChannel) {
    const exchanges = this.topologyRegistry.getExchanges();

    const queues = this.topologyRegistry.getQueues();

    await Promise.all(
      exchanges.map((exchange) =>
        channel.assertExchange(exchange.name, exchange.type, {
          durable: exchange.options?.durable ?? true,
          autoDelete: exchange.options?.autoDelete ?? false,
          internal: exchange.options?.internal ?? false,
          arguments: exchange.options?.arguments ?? {},
        }),
      ),
    );

    await Promise.all(
      queues.map(async (q) => {
        await channel.assertQueue(q.queueName, { durable: true, ...q.options });
        await Promise.all(
          q.queueBindings.map((b) =>
            channel.bindQueue(
              q.queueName,
              b.exchange,
              b.routingKey ?? '',
              b.arguments,
            ),
          ),
        );
      }),
    );

    this.logger.log(
      `Topology assertion completed: ${exchanges.length} exchanges and ${queues.length} queues asserted.`,
    );
  }
}
