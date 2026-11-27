import { Injectable } from '@nestjs/common';
import {
  Exchange,
  ModuleTopology,
  Queue,
  RouteTarget,
  TopologyRegistry,
} from './topology-registry';

@Injectable()
export class TopologyRegistryService implements TopologyRegistry {
  private readonly exchanges = new Map<string, Exchange>();
  private readonly routes = new Map<string, RouteTarget[]>();
  private readonly queues = new Map<string, Queue>();

  register(topology: ModuleTopology): void {
    for (const exchange of topology.exchanges ?? []) {
      const existing = this.exchanges.get(exchange.name);
      if (existing && existing.type !== exchange.type) {
        throw new Error(
          `Exchange "${exchange.name}" already registered with type "${existing.type}"`,
        );
      }
      this.exchanges.set(exchange.name, exchange);
    }

    for (const queue of topology.queues ?? []) {
      this.queues.set(queue.queueName, queue);
    }

    for (const route of topology.routes ?? []) {
      const existing = this.routes.get(route.eventType) ?? [];
      const isDuplicate = existing.some(
        (r) =>
          r.transport === route.transport &&
          r.destination === route.destination &&
          r.eventType === route.eventType,
      );
      if (!isDuplicate) {
        this.routes.set(route.eventType, [...existing, route]);
      }
    }
  }

  getExchanges(): Exchange[] {
    return Array.from(this.exchanges.values());
  }

  getQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  resolve(eventName: string): RouteTarget[] {
    return [...(this.routes.get(eventName) ?? [])];
  }
}
