import { SetMetadata } from '@nestjs/common';

export const REDIS_STREAM_CONSUME = Symbol('REDIS_STREAM_CONSUME');

export interface RedisStreamConsumerOptions {
  stream: string;
  group: string;
  consumerName?: string;
  blockTimeoutMs?: number; // mặc định 2000ms
  batchSize?: number; // mặc định 10
}

export const RedisStreamConsume = (
  options: RedisStreamConsumerOptions,
): ClassDecorator => SetMetadata(REDIS_STREAM_CONSUME, options);

