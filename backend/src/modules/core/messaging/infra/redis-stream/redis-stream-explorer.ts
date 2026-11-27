import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import Redis from 'ioredis';
import {
  REDIS_STREAM_CONSUME_METADATA,
  REDIS_STREAM_HANDLE_METADATA,
} from './constants';
import { RedisStreamConsumeOptions } from './decorators/redis-stream-consume.decorator';
import { RedisStreamHandler, RedisStreamRunner } from './redis-stream-runner';

@Injectable()
export class RedisStreamExplorer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisStreamExplorer.name);
  private readonly runners: RedisStreamRunner[] = [];

  constructor(
    private readonly redisClient: Redis,
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  async onModuleInit(): Promise<void> {
    const providers = this.discovery.getProviders();

    for (const provider of providers) {
      const instance = provider.instance as unknown;
      if (!instance || typeof instance !== 'object') continue;

      const options = this.reflector.get<RedisStreamConsumeOptions | undefined>(
        REDIS_STREAM_CONSUME_METADATA,
        instance.constructor,
      );
      if (!options) continue;

      const handlerMap = this.scanHandlers(
        instance as Record<string, unknown>,
        options.stream,
      );
      const runner = new RedisStreamRunner(
        this.redisClient,
        options,
        handlerMap,
      );
      await runner.start();
      this.runners.push(runner);
    }
  }

  onModuleDestroy(): void {
    for (const runner of this.runners) {
      runner.stop();
    }
    this.runners.length = 0;
  }

  private scanHandlers(
    instance: Record<string, unknown>,
    stream: string,
  ): Map<string, RedisStreamHandler> {
    const handlerMap = new Map<string, RedisStreamHandler>();
    const prototype = Object.getPrototypeOf(instance) as object | null;
    if (!prototype) return handlerMap;

    for (const methodName of this.metadataScanner.getAllMethodNames(prototype)) {
      const method = instance[methodName];
      if (typeof method !== 'function') continue;

      const eventName = this.reflector.get<string | undefined>(
        REDIS_STREAM_HANDLE_METADATA,
        method,
      );
      if (eventName) {
        handlerMap.set(
          eventName,
          (method as RedisStreamHandler).bind(instance),
        );
        this.logger.log(
          `Mapped [${stream} -> ${eventName}] to ${instance.constructor.name}.${methodName}`,
        );
      }
    }

    return handlerMap;
  }
}
