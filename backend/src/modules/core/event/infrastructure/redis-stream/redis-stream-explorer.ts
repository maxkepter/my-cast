import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';
import {
  REDIS_STREAM_CONSUME,
  RedisStreamConsumerOptions,
} from './decorators/redis-stream-consume.decorator';
import { REDIS_STREAM_HANDLE } from './decorators/redis-stream-handle.decorator';
import { RedisStreamRunner } from './redis-stream-runner';

@Injectable()
export class RedisStreamExplorer
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisStreamExplorer.name);
  private readonly runners: RedisStreamRunner[] = [];

  constructor(
    private readonly redisClient: Redis,
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const providers = this.discovery.getProviders();

    for (const provider of providers) {
      const { instance } = provider;
      if (!instance || typeof instance !== 'object') continue;

      const options = this.reflector.get<RedisStreamConsumerOptions>(
        REDIS_STREAM_CONSUME,
        instance.constructor,
      );
      if (!options) continue;

      const handlerMap = this.scanHandlers(instance, options.stream);
      const runner = new RedisStreamRunner(this.redisClient, options, handlerMap);
      await runner.start();
      this.runners.push(runner);
    }
  }

  onApplicationShutdown(): void {
    for (const runner of this.runners) {
      runner.stop();
    }
  }

  private scanHandlers(instance: any, stream: string): Map<string, Function> {
    const handlerMap = new Map<string, Function>();
    const prototype = Object.getPrototypeOf(instance);

    this.metadataScanner.scanFromPrototype(instance, prototype, (methodName) => {
      const eventName = this.reflector.get<string>(
        REDIS_STREAM_HANDLE,
        instance[methodName],
      );
      if (eventName) {
        handlerMap.set(eventName, instance[methodName].bind(instance));
        this.logger.log(
          `Mapped [${stream} -> ${eventName}] to ${instance.constructor.name}.${methodName}`,
        );
      }
    });

    return handlerMap;
  }
}

