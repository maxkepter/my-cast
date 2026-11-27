import 'reflect-metadata';
import { Injectable, Module } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmqpConnection, AmqpConnectionManager } from '@golevelup/nestjs-rabbitmq';
import Redis from 'ioredis';
import { RabbitmqModule } from '../../infra/rabbitmq/rabbitmq.module';
import { MessagingModule } from './messaging.module';
import { OutboxEntity } from './domain/entities/outbox.entity';
import { InboxEntity } from './domain/entities/inbox.entity';
import {
  ExchangeType,
  ModuleTopology,
  TOPOLOGY_REGISTRY,
  TopologyRegistry,
  TransportType,
} from './contracts/topology-registry/topology-registry';
import { TopologyRegistryService } from './contracts/topology-registry/topology-registry.service';
import { OUTBOX_SERVICE } from './contracts/outbox/outbox';
import { OutboxService } from './contracts/outbox/outbox.service';
import { INBOX_SERVICE } from './contracts/inbox/inbox';
import { InboxService } from './contracts/inbox/inbox.service';
import { QUEUE_SERVICE } from './contracts/queue/queue';
import { QueueService } from './contracts/queue/queue.service';
import { EVENT_STREAM_SERVICE } from './contracts/event-stream/event-stream';
import { EventStreamService } from './contracts/event-stream/event-stream.service';
import { OutboxProcessorService } from './application/services/outbox-processor.service';
import { OutboxProcessorCron } from './infra/jobs/outbox-processor.cron';
import { RabbitMQTopologyBootstrap } from './infra/messaging/rabbitmq-topology-bootstrap';
import { RedisStreamExplorer } from './infra/redis-stream/redis-stream-explorer';
import { RedisStreamConsume } from './infra/redis-stream/decorators/redis-stream-consume.decorator';
import { RedisStreamHandle } from './infra/redis-stream/decorators/redis-stream-handle.decorator';

describe('MessagingModule', () => {
  const createMocks = () => ({
    outboxRepo: {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createQueryBuilder: vi.fn(),
    },
    inboxRepo: {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createQueryBuilder: vi.fn(),
    },
    amqpConnection: {
      publish: vi.fn().mockResolvedValue(true),
      managedChannel: {
        addSetup: vi.fn().mockResolvedValue(undefined),
      },
    },
    amqpConnectionManager: {
      getConnection: vi.fn(),
      getConnections: vi.fn().mockReturnValue([]),
      addConnection: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
      clearConnections: vi.fn(),
    },
    redis: {
      xadd: vi.fn().mockResolvedValue('1700000000000-0'),
      xgroup: vi.fn().mockResolvedValue('OK'),
      xreadgroup: vi.fn().mockResolvedValue(null),
      xack: vi.fn().mockResolvedValue(1),
      xautoclaim: vi.fn().mockResolvedValue(['0-0', [], []]),
      xpending: vi.fn().mockResolvedValue([]),
    },
  });

  it('compiles MessagingModule and resolves all exported tokens to expected instances', async () => {
    const mocks = createMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [MessagingModule],
    })
      .overrideProvider(getRepositoryToken(OutboxEntity))
      .useValue(mocks.outboxRepo)
      .overrideProvider(getRepositoryToken(InboxEntity))
      .useValue(mocks.inboxRepo)
      .overrideProvider(AmqpConnection)
      .useValue(mocks.amqpConnection)
      .overrideProvider(AmqpConnectionManager)
      .useValue(mocks.amqpConnectionManager)
      .overrideProvider(Redis)
      .useValue(mocks.redis)
      .compile();

    expect(moduleRef.get(TOPOLOGY_REGISTRY)).toBeInstanceOf(
      TopologyRegistryService,
    );
    expect(moduleRef.get(OUTBOX_SERVICE)).toBeInstanceOf(OutboxService);
    expect(moduleRef.get(INBOX_SERVICE)).toBeInstanceOf(InboxService);
    expect(moduleRef.get(QUEUE_SERVICE)).toBeInstanceOf(QueueService);
    expect(moduleRef.get(EVENT_STREAM_SERVICE)).toBeInstanceOf(
      EventStreamService,
    );
    expect(moduleRef.get(RabbitMQTopologyBootstrap)).toBeInstanceOf(
      RabbitMQTopologyBootstrap,
    );
    expect(moduleRef.get(OutboxProcessorService)).toBeInstanceOf(
      OutboxProcessorService,
    );
    expect(moduleRef.get(OutboxProcessorCron)).toBeInstanceOf(
      OutboxProcessorCron,
    );
    expect(moduleRef.get(RedisStreamExplorer)).toBeInstanceOf(
      RedisStreamExplorer,
    );

    await moduleRef.close();
  });

  it('exports the 5 public contract tokens and RabbitmqModule', () => {
    const exportedTokens = Reflect.getMetadata('exports', MessagingModule) as unknown[];

    expect(exportedTokens).toHaveLength(6);
    expect(exportedTokens).toEqual(
      expect.arrayContaining([
        TOPOLOGY_REGISTRY,
        OUTBOX_SERVICE,
        INBOX_SERVICE,
        QUEUE_SERVICE,
        EVENT_STREAM_SERVICE,
        RabbitmqModule,
      ]),
    );
  });

  it('shares a single TopologyRegistry across separate feature modules and bootstraps RabbitMQ once', async () => {
    const mocks = createMocks();
    const videoTopology: ModuleTopology = {
      exchanges: [
        { name: 'video.events', type: ExchangeType.TOPIC, options: { durable: true } },
      ],
    };
    const authTopology: ModuleTopology = {
      exchanges: [
        { name: 'auth.events', type: ExchangeType.DIRECT, options: { durable: true } },
      ],
    };

    @Module({ imports: [MessagingModule.forFeature(videoTopology)] })
    class VideoFeatureTestModule {}

    @Module({ imports: [MessagingModule.forFeature(authTopology)] })
    class AuthFeatureTestModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        MessagingModule.forRoot(),
        VideoFeatureTestModule,
        AuthFeatureTestModule,
      ],
    })
      .overrideProvider(getRepositoryToken(OutboxEntity))
      .useValue(mocks.outboxRepo)
      .overrideProvider(getRepositoryToken(InboxEntity))
      .useValue(mocks.inboxRepo)
      .overrideProvider(AmqpConnection)
      .useValue(mocks.amqpConnection)
      .overrideProvider(AmqpConnectionManager)
      .useValue(mocks.amqpConnectionManager)
      .overrideProvider(Redis)
      .useValue(mocks.redis)
      .compile();

    await moduleRef.init();

    const registry = moduleRef.get<TopologyRegistry>(TOPOLOGY_REGISTRY);
    expect(registry.getExchanges().map((e) => e.name)).toEqual([
      'video.events',
      'auth.events',
    ]);
    expect(mocks.amqpConnection.managedChannel.addSetup).toHaveBeenCalledTimes(1);

    await moduleRef.close();
  });

  it('registers topologies via MessagingModule.forRoot() and MessagingModule.forFeature()', async () => {
    const mocks = createMocks();
    const topology: ModuleTopology = {
      exchanges: [
        {
          name: 'video.events',
          type: ExchangeType.TOPIC,
          options: { durable: true },
        },
      ],
      queues: [
        {
          queueName: 'video.transcode.queue',
          queueBindings: [
            { exchange: 'video.events', routingKey: 'video.uploaded' },
          ],
        },
      ],
      routes: [
        {
          transport: TransportType.RABBITMQ,
          destination: 'video.events',
          eventType: 'video.uploaded',
        },
        {
          transport: TransportType.REDIS_STREAM,
          destination: 'stream:video',
          eventType: 'video.uploaded',
        },
      ],
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        MessagingModule.forRoot(),
        MessagingModule.forFeature(topology),
      ],
    })
      .overrideProvider(getRepositoryToken(OutboxEntity))
      .useValue(mocks.outboxRepo)
      .overrideProvider(getRepositoryToken(InboxEntity))
      .useValue(mocks.inboxRepo)
      .overrideProvider(AmqpConnection)
      .useValue(mocks.amqpConnection)
      .overrideProvider(AmqpConnectionManager)
      .useValue(mocks.amqpConnectionManager)
      .overrideProvider(Redis)
      .useValue(mocks.redis)
      .compile();

    const registry = moduleRef.get<TopologyRegistry>(TOPOLOGY_REGISTRY);
    expect(registry).toBeInstanceOf(TopologyRegistryService);
    expect(registry.getExchanges()).toEqual(topology.exchanges);
    expect(registry.getQueues()).toEqual(topology.queues);
    expect(registry.resolve('video.uploaded')).toEqual(topology.routes);

    await moduleRef.close();
  });

  it('discovers @RedisStreamConsume providers, ignores BUSYGROUP, dispatches messages and XACKs on success', async () => {
    const mocks = createMocks();
    const handledPayloads: unknown[] = [];

    @Injectable()
    @RedisStreamConsume({
      stream: 'test.event',
      group: 'test-group',
      consumerName: 'test-consumer',
      blockTimeoutMs: 50,
      claimIntervalMs: 60000,
    })
    class TestStreamConsumer {
      @RedisStreamHandle('test.event')
      async handle(payload: Record<string, unknown>): Promise<void> {
        handledPayloads.push(payload);
      }
    }

    mocks.redis.xgroup.mockRejectedValueOnce(
      new Error('BUSYGROUP Consumer Group name already exists'),
    );

    let callCount = 0;
    mocks.redis.xreadgroup.mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return [
          [
            'test.event',
            [
              [
                '1700000000000-1',
                ['event', 'test.event', 'payload', JSON.stringify({ message: 'hello' })],
              ],
            ],
          ],
        ];
      }
      await new Promise((resolve) => setTimeout(resolve, 30));
      return null;
    });

    const moduleRef = await Test.createTestingModule({
      imports: [MessagingModule],
      providers: [TestStreamConsumer],
    })
      .overrideProvider(getRepositoryToken(OutboxEntity))
      .useValue(mocks.outboxRepo)
      .overrideProvider(getRepositoryToken(InboxEntity))
      .useValue(mocks.inboxRepo)
      .overrideProvider(AmqpConnection)
      .useValue(mocks.amqpConnection)
      .overrideProvider(AmqpConnectionManager)
      .useValue(mocks.amqpConnectionManager)
      .overrideProvider(Redis)
      .useValue(mocks.redis)
      .compile();

    await moduleRef.init();
    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(mocks.redis.xgroup).toHaveBeenCalledWith(
      'CREATE',
      'test.event',
      'test-group',
      '$',
      'MKSTREAM',
    );
    expect(handledPayloads).toEqual([{ message: 'hello' }]);
    expect(mocks.redis.xack).toHaveBeenCalledWith(
      'test.event',
      'test-group',
      '1700000000000-1',
    );

    await moduleRef.close();
  });

  it('does not XACK when a @RedisStreamHandle method throws', async () => {
    const mocks = createMocks();

    @Injectable()
    @RedisStreamConsume({
      stream: 'test.fail',
      group: 'fail-group',
      consumerName: 'fail-consumer',
      blockTimeoutMs: 50,
      claimIntervalMs: 60000,
    })
    class FailingStreamConsumer {
      @RedisStreamHandle('test.fail')
      async handle(): Promise<void> {
        throw new Error('handler failure');
      }
    }

    let callCount = 0;
    mocks.redis.xreadgroup.mockImplementation(async () => {
      callCount += 1;
      if (callCount === 1) {
        return [
          [
            'test.fail',
            [
              [
                '1700000000000-2',
                ['event', 'test.fail', 'payload', JSON.stringify({ id: 'evt-2' })],
              ],
            ],
          ],
        ];
      }
      await new Promise((resolve) => setTimeout(resolve, 30));
      return null;
    });

    const moduleRef = await Test.createTestingModule({
      imports: [MessagingModule],
      providers: [FailingStreamConsumer],
    })
      .overrideProvider(getRepositoryToken(OutboxEntity))
      .useValue(mocks.outboxRepo)
      .overrideProvider(getRepositoryToken(InboxEntity))
      .useValue(mocks.inboxRepo)
      .overrideProvider(AmqpConnection)
      .useValue(mocks.amqpConnection)
      .overrideProvider(AmqpConnectionManager)
      .useValue(mocks.amqpConnectionManager)
      .overrideProvider(Redis)
      .useValue(mocks.redis)
      .compile();

    await moduleRef.init();
    await new Promise((resolve) => setTimeout(resolve, 40));

    expect(mocks.redis.xack).not.toHaveBeenCalled();

    await moduleRef.close();
  });
});
