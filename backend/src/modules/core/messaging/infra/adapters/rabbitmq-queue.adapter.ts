import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { DomainEvent } from '../../../../../common/domain/domain-event';
import {
  QueueJobOptions,
  QueuePort,
} from '../../application/ports/queue.port';
import {
  TOPOLOGY_REGISTRY,
  TopologyRegistry,
  TransportType,
} from '../../contracts/topology-registry/topology-registry';

@Injectable()
export class RabbitmqQueueAdapter implements QueuePort {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @Inject(TOPOLOGY_REGISTRY)
    private readonly topologyRegistry: TopologyRegistry,
  ) {}

  async publish<T>(event: DomainEvent, options?: QueueJobOptions): Promise<void> {
    const eventName = event.getEventName();
    const payload = JSON.parse(event.serialize()) as T;
    const delay = options?.delayTime ?? options?.deplayTime;
    const publishOptions =
      delay !== undefined ? { headers: { 'x-delay': delay } } : undefined;

    const destinations =
      options?.destination !== undefined
        ? [options.destination]
        : (() => {
            const targets = this.topologyRegistry
              .resolve(eventName)
              .filter((target) => target.transport === TransportType.RABBITMQ);
            return targets.length > 0
              ? targets.map((target) => target.destination)
              : [''];
          })();

    for (const destination of destinations) {
      if (publishOptions) {
        await this.amqpConnection.publish(
          destination,
          eventName,
          payload,
          publishOptions,
        );
      } else {
        await this.amqpConnection.publish(destination, eventName, payload);
      }
    }
  }

  async publishMany(
    events: DomainEvent[],
    options?: QueueJobOptions,
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    for (const event of events) {
      await this.publish(event, options);
    }
  }
}
