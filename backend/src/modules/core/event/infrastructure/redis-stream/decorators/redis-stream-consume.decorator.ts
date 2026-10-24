import { SetMetadata } from '@nestjs/common';
import {
  DEFAULT_REDIS_STREAM_BATCH_SIZE,
  DEFAULT_REDIS_STREAM_BLOCK_TIMEOUT_MS,
  DEFAULT_REDIS_STREAM_CLAIM_INTERVAL_MS,
  DEFAULT_REDIS_STREAM_MAX_RETRIES,
  DEFAULT_REDIS_STREAM_MIN_IDLE_TIME_MS,
} from '../constants';

export const REDIS_STREAM_CONSUME = Symbol('REDIS_STREAM_CONSUME');

export interface RedisStreamConsumerOptions {
  stream: string;
  group: string;
  consumerName?: string;
  blockTimeoutMs?: number; // mặc định DEFAULT_REDIS_STREAM_BLOCK_TIMEOUT_MS
  batchSize?: number; // mặc định DEFAULT_REDIS_STREAM_BATCH_SIZE
  maxRetryAttempts?: number; // mặc định DEFAULT_REDIS_STREAM_MAX_RETRIES
  claimIntervalMs?: number; // mặc định DEFAULT_REDIS_STREAM_CLAIM_INTERVAL_MS
  minIdleTimeMs?: number; // mặc định DEFAULT_REDIS_STREAM_MIN_IDLE_TIME_MS
}

export const RedisStreamConsume = (
  options: RedisStreamConsumerOptions,
): ClassDecorator => SetMetadata(REDIS_STREAM_CONSUME, options);

