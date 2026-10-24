import { Handler } from '../../../../common/application/handler';

export const QUEUE_SERVICE = Symbol('QUEUE_SERVICE');

export interface QueueJobOptions {
  deplayTime?: number;
  attempts?: number;
}

export interface QueueService {
  publish<T>(
    queueName: string,
    data: T,
    options?: QueueJobOptions,
  ): Promise<void>;

  consume<T>(queueName: string, handler: Handler<T>): Promise<void>;
}

export const MockQueueService: QueueService = {
  publish: async <T>(
    _queueName: string,
    _data: T,
    _opts?: QueueJobOptions,
  ): Promise<void> => {},
  consume: async <T>(
    _queueName: string,
    _handler: Handler<T>,
  ): Promise<void> => {},
};
