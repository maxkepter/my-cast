import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import { BullmqQueueService } from './bullmq-queue.service';
import { Handler } from '../../../../common/application/handler';

vi.mock('bullmq', () => {
  const QueueMock = vi.fn().mockImplementation(function (this: any, name: string, opts: any) {
    this.name = name;
    this.opts = opts;
    this.add = vi.fn().mockResolvedValue({ id: 'job-1' });
    this.close = vi.fn().mockResolvedValue(undefined);
  });

  const WorkerMock = vi.fn().mockImplementation(function (
    this: any,
    name: string,
    processor: any,
    opts: any,
  ) {
    this.name = name;
    this.processor = processor;
    this.opts = opts;
    this.close = vi.fn().mockResolvedValue(undefined);
  });

  return {
    Queue: QueueMock,
    Worker: WorkerMock,
  };
});

describe('BullmqQueueService', () => {
  let service: BullmqQueueService;
  let configService: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();

    configService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'REDIS_HOST') return '127.0.0.1';
        if (key === 'REDIS_PORT') return 6380;
        if (key === 'REDIS_PASSWORD') return 'secret';
        return defaultValue;
      }),
    } as unknown as ConfigService;

    service = new BullmqQueueService(configService);
  });

  describe('publish', () => {
    it('should add a job to the queue with default options', async () => {
      await service.publish('test-queue', { message: 'hello' });

      expect(Queue).toHaveBeenCalledWith('test-queue', {
        connection: {
          host: '127.0.0.1',
          port: 6380,
          password: 'secret',
        },
      });

      const queueInstance = vi.mocked(Queue).mock.results[0].value;
      expect(queueInstance.add).toHaveBeenCalledWith(
        'default',
        { message: 'hello' },
        { attempts: undefined, delay: undefined },
      );
    });

    it('should reuse existing queue for repeated publish calls', async () => {
      await service.publish('cache-queue', { task: 1 });
      await service.publish('cache-queue', { task: 2 }, { attempts: 3, deplayTime: 1000 });

      expect(Queue).toHaveBeenCalledTimes(1);
      const queueInstance = vi.mocked(Queue).mock.results[0].value;
      expect(queueInstance.add).toHaveBeenCalledTimes(2);
      expect(queueInstance.add).toHaveBeenLastCalledWith(
        'default',
        { task: 2 },
        { attempts: 3, delay: 1000 },
      );
    });
  });

  describe('consume', () => {
    it('should create worker and register job handler', async () => {
      const handler: Handler<{ id: string }> = {
        handle: vi.fn().mockResolvedValue(undefined),
      };

      await service.consume('job-queue', handler);

      expect(Worker).toHaveBeenCalledWith(
        'job-queue',
        expect.any(Function),
        {
          connection: {
            host: '127.0.0.1',
            port: 6380,
            password: 'secret',
          },
        },
      );

      const workerInstance = vi.mocked(Worker).mock.results[0].value;
      await workerInstance.processor({ data: { id: 'item-10' } });

      expect(handler.handle).toHaveBeenCalledWith({ id: 'item-10' });
    });

    it('should not create a second worker for the same queue', async () => {
      const handler: Handler<any> = {
        handle: vi.fn().mockResolvedValue(undefined),
      };

      await service.consume('duplicate-queue', handler);
      await service.consume('duplicate-queue', handler);

      expect(Worker).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close all workers and queues upon destroy', async () => {
      await service.publish('q1', 'data1');
      await service.consume('w1', { handle: vi.fn() });

      const queueInstance = vi.mocked(Queue).mock.results[0].value;
      const workerInstance = vi.mocked(Worker).mock.results[0].value;

      await service.onModuleDestroy();

      expect(queueInstance.close).toHaveBeenCalledTimes(1);
      expect(workerInstance.close).toHaveBeenCalledTimes(1);
    });
  });
});
