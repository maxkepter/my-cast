import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqQueueService } from './rabbitmq-queue.service';
import { Handler } from '../../../../common/application/handler';

describe('RabbitmqQueueService', () => {
  let service: RabbitmqQueueService;
  let amqpConnection: AmqpConnection;
  let channelMock: {
    assertQueue: ReturnType<typeof vi.fn>;
    consume: ReturnType<typeof vi.fn>;
    ack: ReturnType<typeof vi.fn>;
    nack: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    channelMock = {
      assertQueue: vi.fn().mockResolvedValue({ queue: 'test-queue' }),
      consume: vi.fn().mockResolvedValue({ consumerTag: 'tag-123' }),
      ack: vi.fn(),
      nack: vi.fn(),
      cancel: vi.fn().mockResolvedValue(true),
    };

    amqpConnection = {
      publish: vi.fn().mockResolvedValue(true),
      get channel() {
        return channelMock as any;
      },
    } as unknown as AmqpConnection;

    service = new RabbitmqQueueService(amqpConnection);
  });

  describe('publish', () => {
    it('should publish message to default exchange with routing key as queueName', async () => {
      const payload = { event: 'user_created', id: 42 };

      await service.publish('user-events', payload);

      expect(amqpConnection.publish).toHaveBeenCalledWith(
        '',
        'user-events',
        payload,
      );
    });
  });

  describe('consume', () => {
    it('should assert queue and register consumer', async () => {
      const handler: Handler<any> = {
        handle: vi.fn().mockResolvedValue(undefined),
      };

      await service.consume('order-queue', handler);

      expect(channelMock.assertQueue).toHaveBeenCalledWith('order-queue', {
        durable: true,
      });
      expect(channelMock.consume).toHaveBeenCalledWith(
        'order-queue',
        expect.any(Function),
      );
    });

    it('should parse message, invoke handler, and ack upon success', async () => {
      const handler: Handler<{ name: string }> = {
        handle: vi.fn().mockResolvedValue(undefined),
      };

      await service.consume('notification-queue', handler);

      const callback = channelMock.consume.mock.calls[0][1];
      const msg = {
        content: Buffer.from(JSON.stringify({ name: 'Alice' })),
      };

      await callback(msg);

      expect(handler.handle).toHaveBeenCalledWith({ name: 'Alice' });
      expect(channelMock.ack).toHaveBeenCalledWith(msg);
      expect(channelMock.nack).not.toHaveBeenCalled();
    });

    it('should do nothing when receiving null message', async () => {
      const handler: Handler<any> = {
        handle: vi.fn().mockResolvedValue(undefined),
      };

      await service.consume('ping-queue', handler);

      const callback = channelMock.consume.mock.calls[0][1];
      await callback(null);

      expect(handler.handle).not.toHaveBeenCalled();
      expect(channelMock.ack).not.toHaveBeenCalled();
      expect(channelMock.nack).not.toHaveBeenCalled();
    });

    it('should nack message with requeue=false when handler throws', async () => {
      const handler: Handler<any> = {
        handle: vi.fn().mockRejectedValue(new Error('Handler failed')),
      };

      await service.consume('fail-queue', handler);

      const callback = channelMock.consume.mock.calls[0][1];
      const msg = {
        content: Buffer.from(JSON.stringify({ test: true })),
      };

      await callback(msg);

      expect(channelMock.nack).toHaveBeenCalledWith(msg, false, false);
      expect(channelMock.ack).not.toHaveBeenCalled();
    });

    it('should nack message when payload is invalid JSON', async () => {
      const handler: Handler<any> = {
        handle: vi.fn().mockResolvedValue(undefined),
      };

      await service.consume('invalid-json-queue', handler);

      const callback = channelMock.consume.mock.calls[0][1];
      const msg = {
        content: Buffer.from('invalid-json-string{'),
      };

      await callback(msg);

      expect(channelMock.nack).toHaveBeenCalledWith(msg, false, false);
      expect(channelMock.ack).not.toHaveBeenCalled();
    });

    it('should skip duplicate consume calls for the same queue', async () => {
      const handler: Handler<any> = {
        handle: vi.fn().mockResolvedValue(undefined),
      };

      await service.consume('dedup-queue', handler);
      await service.consume('dedup-queue', handler);

      expect(channelMock.assertQueue).toHaveBeenCalledTimes(1);
      expect(channelMock.consume).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('should cancel all registered consumers on destroy', async () => {
      channelMock.consume
        .mockResolvedValueOnce({ consumerTag: 'tag-1' })
        .mockResolvedValueOnce({ consumerTag: 'tag-2' });

      await service.consume('q1', { handle: vi.fn() });
      await service.consume('q2', { handle: vi.fn() });

      await service.onModuleDestroy();

      expect(channelMock.cancel).toHaveBeenCalledWith('tag-1');
      expect(channelMock.cancel).toHaveBeenCalledWith('tag-2');
    });

    it('should tolerate cancel errors gracefully', async () => {
      channelMock.consume.mockResolvedValueOnce({ consumerTag: 'tag-err' });
      channelMock.cancel.mockRejectedValueOnce(new Error('Channel closed'));

      await service.consume('q-err', { handle: vi.fn() });

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
  });
});
