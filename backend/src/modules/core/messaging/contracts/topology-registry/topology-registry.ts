export interface Exchange {
  name: string;
  type: ExchangeType;
  options?: ExchangeOptions;
}

export interface ExchangeOptions {
  durable?: boolean;
  autoDelete?: boolean;
  internal?: boolean;
  arguments?: Record<string, any>;
}

export enum ExchangeType {
  FANOUT = 'fanout',
  DIRECT = 'direct',
  TOPIC = 'topic',
  HEADERS = 'headers',
}

export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: Record<string, any>;
}

export interface QueueBinding {
  exchange: string;
  routingKey?: string;
  arguments?: Record<string, any>;
}

export interface Queue {
  queueName: string;
  options?: QueueOptions;
  queueBindings: QueueBinding[];
  prefetchCount?: number;
}

export interface RouteTarget {
  transport: TransportType;
  destination: string;
  eventType: string;
}

export enum TransportType {
  RABBITMQ = 'rabbitmq',
  REDIS_STREAM = 'redis-stream',
}

export interface ModuleTopology {
  exchanges?: Exchange[];
  routes?: RouteTarget[];
  queues?: Queue[];
}

export const TOPOLOGY_REGISTRY = Symbol('TOPOLOGY_REGISTRY');
export interface TopologyRegistry {
  // Register the topology of a module, including exchanges, routes, and queues.
  register(topology: ModuleTopology): void;

  // Get all registered exchanges in the system.
  getExchanges(): Exchange[];

  getQueues(): Queue[];

  // Resolve the route targets for a given event name.
  resolve(eventName: string): RouteTarget[];
}
