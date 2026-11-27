import { SetMetadata } from '@nestjs/common';
import { REDIS_STREAM_CONSUME_METADATA } from '../constants';

export interface RedisStreamConsumeOptions {
  stream: string;
  group: string;
  consumerName?: string;
  blockTimeoutMs?: number;
  batchSize?: number;
  maxRetryAttempts?: number;
  claimIntervalMs?: number;
  minIdleTimeMs?: number;
}

export const RedisStreamConsume = (
  options: RedisStreamConsumeOptions,
): ClassDecorator => SetMetadata(REDIS_STREAM_CONSUME_METADATA, options);
