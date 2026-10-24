import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisStreamConsumerOptions } from './decorators/redis-stream-consume.decorator';

export class RedisStreamRunner {
  private readonly logger = new Logger(RedisStreamRunner.name);
  private isRunning = false;
  private readonly stream: string;
  private readonly group: string;
  private readonly consumerName: string;
  private readonly batchSize: number;
  private readonly blockMs: number;

  constructor(
    private readonly redisClient: Redis,
    options: RedisStreamConsumerOptions,
    private readonly handlerMap: Map<string, Function>,
  ) {
    this.stream = options.stream;
    this.group = options.group;
    this.consumerName =
      options.consumerName ||
      `consumer-${Math.random().toString(36).substring(2, 15)}`;
    this.batchSize = options.batchSize || 10;
    this.blockMs = options.blockTimeoutMs || 2000;
  }

  async start(): Promise<void> {
    await this.ensureGroupExists();
    this.isRunning = true;
    void this.runLoop();
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

