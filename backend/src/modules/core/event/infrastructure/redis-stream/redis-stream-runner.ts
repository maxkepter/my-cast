import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisStreamConsumerOptions } from './decorators/redis-stream-consume.decorator';
import {
  DEFAULT_REDIS_STREAM_BATCH_SIZE,
  DEFAULT_REDIS_STREAM_BLOCK_TIMEOUT_MS,
  DEFAULT_REDIS_STREAM_CLAIM_INTERVAL_MS,
  DEFAULT_REDIS_STREAM_MAX_RETRIES,
  DEFAULT_REDIS_STREAM_MIN_IDLE_TIME_MS,
} from './constants';

export class RedisStreamRunner {
  private readonly logger = new Logger(RedisStreamRunner.name);
  private isRunning = false;
  private readonly stream: string;
  private readonly group: string;
  private readonly consumerName: string;
  private readonly batchSize: number;
  private readonly blockMs: number;
  private readonly maxRetries: number;
  private readonly claimIntervalMs: number;
  private readonly minIdleTimeMs: number;

  constructor(
    private readonly redisClient: Redis,
    private readonly options: RedisStreamConsumerOptions,
    private readonly handlerMap: Map<string, Function>,
  ) {
    this.stream = options.stream;
    this.group = options.group;
    this.consumerName =
      options.consumerName ||
      `consumer-${Math.random().toString(36).substring(2, 15)}`;
    this.batchSize = options.batchSize || DEFAULT_REDIS_STREAM_BATCH_SIZE;
    this.blockMs =
      options.blockTimeoutMs || DEFAULT_REDIS_STREAM_BLOCK_TIMEOUT_MS;
    this.maxRetries =
      options.maxRetryAttempts ?? DEFAULT_REDIS_STREAM_MAX_RETRIES;
    this.claimIntervalMs =
      options.claimIntervalMs || DEFAULT_REDIS_STREAM_CLAIM_INTERVAL_MS;
    this.minIdleTimeMs =
      options.minIdleTimeMs || DEFAULT_REDIS_STREAM_MIN_IDLE_TIME_MS;
  }

  async start(): Promise<void> {
    await this.ensureGroupExists();
    this.isRunning = true;
    void this.runLoop();
    void this.runClaimLoop();
  }

  stop(): void {
    this.isRunning = false;
  }

  private async ensureGroupExists() {
    try {
      await this.redisClient.xgroup(
        'CREATE',
        this.stream,
        this.group,
        '$',
        'MKSTREAM',
      );
      this.logger.log(
        `Created consumer group '${this.group}' for stream '${this.stream}'`,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('BUSYGROUP')) {
        this.logger.log(
          `Consumer group '${this.group}' already exists for stream '${this.stream}'`,
        );
      } else {
        throw error;
      }
    }
  }

  private async runLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        const response = await this.redisClient.xreadgroup(
          'GROUP',
          this.group,
          this.consumerName,
          'COUNT',
          this.batchSize,
          'BLOCK',
          this.blockMs,
          'STREAMS',
          this.stream,
          '>',
        );

        if (!response || response.length === 0) continue;

        const [, messages] = response[0] as [string, [string, string[]][]];
        for (const [id, fields] of messages) {
          await this.dispatch(id, fields);
        }
      } catch (error: any) {
        this.logger.error(`Error in stream [${this.stream}]: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async runClaimLoop(): Promise<void> {
    let startId = '0-0';
    while (this.isRunning) {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, this.claimIntervalMs),
        );
        if (!this.isRunning) break;

        const result = (await this.redisClient.xautoclaim(
          this.stream,
          this.group,
          this.consumerName,
          this.minIdleTimeMs,
          startId,
          'COUNT',
          this.batchSize,
        )) as [string, [string, string[]][], string[]];

        const [nextStartId, claimedMessages] = result;
        startId = nextStartId;

        for (const [id, fields] of claimedMessages) {
          this.logger.warn(
            `Recovered stuck message ${id} from stream [${this.stream}]`,
          );
          await this.dispatchWithRetryCheck(id, fields);
        }
      } catch (error: any) {
        this.logger.error(`Error in claim loop [${this.stream}]: ${error.message}`);
      }
    }
  }

  private async dispatchWithRetryCheck(
    id: string,
    fields: string[],
  ): Promise<void> {
    const pendingInfo = (await this.redisClient.xpending(
      this.stream,
      this.group,
      id,
      id,
      1,
    )) as [string, string, number, number][];

    const retryCount = pendingInfo.length > 0 ? pendingInfo[0][3] : 1;

    if (retryCount > this.maxRetries) {
      await this.moveToDeadLetterQueue(
        id,
        fields,
        `Max delivery retries (${this.maxRetries}) exceeded`,
      );
      return;
    }

    await this.dispatch(id, fields);
  }

  private async moveToDeadLetterQueue(
    id: string,
    fields: string[],
    reason: string,
  ): Promise<void> {
    const dlqStream = `${this.stream}:dlq`;
    this.logger.error(`Routing poisoned message ${id} to DLQ: ${dlqStream}`);

    await this.redisClient.xadd(
      dlqStream,
      '*',
      ...fields,
      'dlqReason',
      reason,
      'originalId',
      id,
    );

    await this.redisClient.xack(this.stream, this.group, id);
  }

  private async dispatch(id: string, fields: string[]): Promise<void> {
    const raw: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      raw[fields[i]] = fields[i + 1];
    }

    const eventName = raw['event'];
    const payload = raw['payload'] ? JSON.parse(raw['payload']) : {};
    const handler = this.handlerMap.get(eventName);

    if (handler) {
      try {
        await handler(payload);
        await this.redisClient.xack(this.stream, this.group, id);
      } catch (err: any) {
        this.logger.error(
          `Handler failed for event [${eventName}] (${id}): ${err.message}`,
        );
      }
    } else {
      // Event không có handler đăng ký -> ACK luôn để tránh đọng PEL
      await this.redisClient.xack(this.stream, this.group, id);
    }
  }
}
