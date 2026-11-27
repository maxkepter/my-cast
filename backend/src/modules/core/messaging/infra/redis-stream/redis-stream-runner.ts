import { Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisStreamConsumeOptions } from './decorators/redis-stream-consume.decorator';
import {
  DEFAULT_REDIS_STREAM_BATCH_SIZE,
  DEFAULT_REDIS_STREAM_BLOCK_TIMEOUT_MS,
  DEFAULT_REDIS_STREAM_CLAIM_INTERVAL_MS,
  DEFAULT_REDIS_STREAM_MAX_RETRIES,
  DEFAULT_REDIS_STREAM_MIN_IDLE_TIME_MS,
} from './constants';

export type RedisStreamHandler = (
  payload: Record<string, unknown>,
) => Promise<void> | void;

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
  private readonly pendingTimers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    private readonly redisClient: Redis,
    options: RedisStreamConsumeOptions,
    private readonly handlerMap: Map<string, RedisStreamHandler>,
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
    for (const timer of this.pendingTimers) {
      clearTimeout(timer);
    }
    this.pendingTimers.clear();
  }

  private async ensureGroupExists(): Promise<void> {
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

        if (!this.isRunning) break;
        if (!response || response.length === 0) continue;

        const [, messages] = response[0] as [string, [string, string[]][]];
        for (const [id, fields] of messages) {
          if (!this.isRunning) break;
          await this.dispatch(id, fields);
        }
      } catch (error: unknown) {
        if (!this.isRunning) break;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error in stream [${this.stream}]: ${message}`);
        await this.sleep(1000);
      }
    }
  }

  private async runClaimLoop(): Promise<void> {
    let startId = '0-0';
    while (this.isRunning) {
      try {
        await this.sleep(this.claimIntervalMs);
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
          if (!this.isRunning) break;
          this.logger.warn(
            `Recovered stuck message ${id} from stream [${this.stream}]`,
          );
          await this.dispatchWithRetryCheck(id, fields);
        }
      } catch (error: unknown) {
        if (!this.isRunning) break;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error in claim loop [${this.stream}]: ${message}`);
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
    const handler = eventName ? this.handlerMap.get(eventName) : undefined;

    if (!handler) {
      // Acknowledge unregistered events to avoid dead entries piling up in the PEL.
      await this.redisClient.xack(this.stream, this.group, id);
      return;
    }

    try {
      const payload = raw['payload']
        ? (JSON.parse(raw['payload']) as Record<string, unknown>)
        : {};
      await handler(payload);
      await this.redisClient.xack(this.stream, this.group, id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Handler failed for event [${eventName}] (${id}): ${message}`,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isRunning) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        this.pendingTimers.delete(timer);
        resolve();
      }, ms);
      timer.unref?.();
      this.pendingTimers.add(timer);
    });
  }
}
