import { DynamicModule, Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitmqModule } from '../../infra/rabbitmq/rabbitmq.module';
import { RedisModule } from '../../infra/redis/redis.module';
import { EVENT_STREAM_PORT } from './application/ports/event-stream.port';
import { QUEUE_PORT } from './application/ports/queue.port';
import { OutboxProcessorService } from './application/services/outbox-processor.service';
import { EVENT_STREAM_SERVICE } from './contracts/event-stream/event-stream';
import { EventStreamService } from './contracts/event-stream/event-stream.service';
import { INBOX_SERVICE } from './contracts/inbox/inbox';
import { InboxService } from './contracts/inbox/inbox.service';
import { OUTBOX_SERVICE } from './contracts/outbox/outbox';
import { OutboxService } from './contracts/outbox/outbox.service';
import { QUEUE_SERVICE } from './contracts/queue/queue';
import { QueueService } from './contracts/queue/queue.service';
import {
  ModuleTopology,
  TOPOLOGY_REGISTRY,
  TopologyRegistry,
} from './contracts/topology-registry/topology-registry';
import { TopologyRegistryService } from './contracts/topology-registry/topology-registry.service';
import { InboxEntity } from './domain/entities/inbox.entity';
import { OutboxEntity } from './domain/entities/outbox.entity';
import { INBOX_REPOSITORY } from './domain/repositories/inbox.repository.interface';
import { OUTBOX_REPOSITORY } from './domain/repositories/outbox.repository.interface';
import { RabbitmqQueueAdapter } from './infra/adapters/rabbitmq-queue.adapter';
import { RedisEventStreamAdapter } from './infra/adapters/redis-event-stream.adapter';
import { OutboxProcessorCron } from './infra/jobs/outbox-processor.cron';
import { RabbitMQTopologyBootstrap } from './infra/messaging/rabbitmq-topology-bootstrap';
import { RedisStreamExplorer } from './infra/redis-stream/redis-stream-explorer';
import { TypeOrmInboxRepository } from './infra/repositories/typeorm-inbox.repository';
import { TypeOrmOutboxRepository } from './infra/repositories/typeorm-outbox.repository';

// Dedicated host prevents forFeature() from re-instantiating MessagingModule's root providers.
@Module({})
class MessagingFeatureModule {}

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEntity, InboxEntity]),
    DiscoveryModule,
    RabbitmqModule,
    RedisModule,
  ],
  controllers: [],
  providers: [
    TopologyRegistryService,
    RabbitMQTopologyBootstrap,
    RedisStreamExplorer,
    { provide: TOPOLOGY_REGISTRY, useExisting: TopologyRegistryService },
    { provide: OUTBOX_REPOSITORY, useClass: TypeOrmOutboxRepository },
    { provide: INBOX_REPOSITORY, useClass: TypeOrmInboxRepository },
    { provide: QUEUE_PORT, useClass: RabbitmqQueueAdapter },
    { provide: EVENT_STREAM_PORT, useClass: RedisEventStreamAdapter },
    OutboxService,
    { provide: OUTBOX_SERVICE, useExisting: OutboxService },
    InboxService,
    { provide: INBOX_SERVICE, useExisting: InboxService },
    QueueService,
    { provide: QUEUE_SERVICE, useExisting: QueueService },
    EventStreamService,
    { provide: EVENT_STREAM_SERVICE, useExisting: EventStreamService },
    OutboxProcessorService,
    OutboxProcessorCron,
  ],
  exports: [
    TOPOLOGY_REGISTRY,
    OUTBOX_SERVICE,
    INBOX_SERVICE,
    QUEUE_SERVICE,
    EVENT_STREAM_SERVICE,
    RabbitmqModule,
  ],
})
export class MessagingModule {
  static forRoot(): DynamicModule {
    return {
      module: MessagingModule,
      global: true,
    };
  }

  static forFeature(topology: ModuleTopology): DynamicModule {
    return {
      module: MessagingFeatureModule,
      providers: [
        {
          provide: Symbol('MESSAGING_TOPOLOGY_REGISTRAR'),
          inject: [TOPOLOGY_REGISTRY],
          useFactory: (registry: TopologyRegistry) => {
            registry.register(topology);
            return true;
          },
        },
      ],
      exports: [],
    };
  }
}
