import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { MailerService } from '@nestjs-modules/mailer';
import * as amqplib from 'amqplib';
import Redis from 'ioredis';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, In, Repository } from 'typeorm';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../src/app.module';
import { TestEventConsumer } from '../src/test-event.consumer';
import {
  EVENT_STREAM_SERVICE,
  EventStreamServiceContract,
  INBOX_SERVICE,
  InboxServiceContract,
  InboxStatus,
  OutboxStatus,
  QUEUE_SERVICE,
  QueueServiceContract,
  TransportType,
} from '../src/modules/core/messaging';
import {
  OUTBOX_REPOSITORY,
  OutboxRepository,
} from '../src/modules/core/messaging/domain/repositories/outbox.repository.interface';
import { OutboxProcessorService } from '../src/modules/core/messaging/application/services/outbox-processor.service';
import { InboxEntity } from '../src/modules/core/messaging/domain/entities/inbox.entity';
import { OutboxEntity } from '../src/modules/core/messaging/domain/entities/outbox.entity';
import { SendVerificationEmailHandler } from '../src/modules/core/mail/application/handlers/send-verification-email.handler';
import { SendWelcomeEmailHandler } from '../src/modules/core/mail/application/handlers/send-welcome-email.handler';
import { DeleteStorageHandler } from '../src/modules/core/storage/application/handlers/delete-storage.handler';
import { DeleteStorageEvent } from '../src/modules/core/storage/domain/events/delete-storage.event';
import { S3StorageService } from '../src/modules/core/storage/infrastructure/s3-storage.service';
import { UserRegisteredEvent } from '../src/modules/features/auth/domain/events/user-registered.event';
import { CommentCreatedEvent } from '../src/modules/features/interaction/domain/events/comment-created.event';
import { ContentReportedEvent } from '../src/modules/features/interaction/domain/events/content-reported.event';
import {
  ReportReason,
  ReportTargetType,
} from '../src/modules/features/interaction/domain/enums/report.enum';
import { UserBlockedEvent } from '../src/modules/features/interaction/domain/events/user-blocked.event';
import { UserCreatedEvent } from '../src/modules/features/user/domain/events/user-created.event';
import { Video } from '../src/modules/features/video/domain/entities/video.entity';
import { VideoStatus } from '../src/modules/features/video/domain/enums/video-status.enum';
import { VideoVisibility } from '../src/modules/features/video/domain/enums/video-visibility.enum';
import { PlaylistCreatedEvent } from '../src/modules/features/video/domain/events/playlist-created.event';
import { VideoLikedEvent } from '../src/modules/features/video/domain/events/video-liked.event';
import { VideoUpdatedEvent } from '../src/modules/features/video/domain/events/video-updated.event';
import { VideoUploadedEvent } from '../src/modules/features/video/domain/events/video-uploaded.event';
import { VideoConfig } from '../src/modules/features/video/domain/value-objects/video-config.vo';

interface RabbitMqBindingInfo {
  source: string;
  destination: string;
  routing_key: string;
}

const TEST_EXCHANGES = ['user.events', 'video.events', 'storage.events'] as const;

const TEST_QUEUES = [
  'mail.user-created.queue',
  'mail.user-registered.queue',
  'video.transcode.queue',
  'storage.delete.queue',
] as const;

const CONSUMER_QUEUES = [
  'mail.user-created.queue',
  'mail.user-registered.queue',
  'storage.delete.queue',
] as const;

const TEST_REDIS_STREAMS = [
  'test.event',
  'test.event:dlq',
  VideoUpdatedEvent.EVENT_NAME,
  VideoLikedEvent.EVENT_NAME,
  PlaylistCreatedEvent.EVENT_NAME,
  CommentCreatedEvent.EVENT_NAME,
  ContentReportedEvent.EVENT_NAME,
  UserBlockedEvent.EVENT_NAME,
] as const;

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitFor<T>(
  predicate: () => Promise<T | null | undefined | false>,
  timeoutMs = 15_000,
  intervalMs = 100,
  description = 'condition',
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const value = await predicate();
      if (value !== null && value !== undefined && value !== false) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(intervalMs);
  }

  const errorSuffix =
    lastError instanceof Error ? ` (last error: ${lastError.message})` : '';
  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for ${description}${errorSuffix}`,
  );
}

function parseStreamFields(fields: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) {
    result[fields[i]] = fields[i + 1];
  }
  return result;
}

async function fetchRabbitMqQueueBindings(
  rabbitMqUri: string,
  queueName: string,
): Promise<RabbitMqBindingInfo[]> {
  const parsedUri = new URL(rabbitMqUri);
  const protocol = parsedUri.protocol === 'amqps:' ? 'https' : 'http';
  const host = parsedUri.hostname || 'localhost';
  const mgmtPort = process.env.RABBITMQ_MGMT_PORT ?? '15672';
  const vhostRaw = parsedUri.pathname.replace(/^\//, '');
  const vhost = vhostRaw.length > 0 ? decodeURIComponent(vhostRaw) : '/';
  const username = parsedUri.username
    ? decodeURIComponent(parsedUri.username)
    : 'guest';
  const password = parsedUri.password
    ? decodeURIComponent(parsedUri.password)
    : 'guest';

  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  const url = `${protocol}://${host}:${mgmtPort}/api/queues/${encodeURIComponent(vhost)}/${encodeURIComponent(queueName)}/bindings`;

  const response = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  if (!response.ok) {
    throw new Error(
      `RabbitMQ management API failed (${response.status}) for queue "${queueName}"`,
    );
  }

  return (await response.json()) as RabbitMqBindingInfo[];
}

describe('Messaging Migration Real-Runtime E2E', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let outboxRepo: Repository<OutboxEntity>;
  let inboxRepo: Repository<InboxEntity>;
  let videoRepo: Repository<Video>;
  let outboxRepository: OutboxRepository;
  let queueService: QueueServiceContract;
  let eventStreamService: EventStreamServiceContract;
  let inboxService: InboxServiceContract;
  let outboxProcessorService: OutboxProcessorService;
  let amqpConnection: AmqpConnection;
  let redis: Redis;
  let testEventConsumer: TestEventConsumer;
  let sendWelcomeEmailHandler: SendWelcomeEmailHandler;
  let sendVerificationEmailHandler: SendVerificationEmailHandler;
  let deleteStorageHandler: DeleteStorageHandler;
  let s3StorageService: S3StorageService;

  let amqpChannelModel: amqplib.ChannelModel | undefined;
  let amqpChannel: amqplib.Channel | undefined;
  let rabbitMqUri = 'amqp://guest:guest@localhost:5672';

  const mailSendMock = vi.fn().mockResolvedValue(undefined);
  const trackedEventIds = new Set<string>();
  const trackedVideoIds = new Set<string>();

  const trackEventId = (eventId: string): string => {
    trackedEventIds.add(eventId);
    return eventId;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue({ sendMail: mailSendMock })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const configService = app.get(ConfigService);
    rabbitMqUri = configService.get<string>(
      'RABBITMQ_URI',
      'amqp://guest:guest@localhost:5672',
    );

    dataSource = app.get(DataSource);
    outboxRepo = app.get<Repository<OutboxEntity>>(
      getRepositoryToken(OutboxEntity),
    );
    inboxRepo = app.get<Repository<InboxEntity>>(
      getRepositoryToken(InboxEntity),
    );
    videoRepo = app.get<Repository<Video>>(getRepositoryToken(Video));
    outboxRepository = app.get<OutboxRepository>(OUTBOX_REPOSITORY);
    queueService = app.get<QueueServiceContract>(QUEUE_SERVICE);
    eventStreamService =
      app.get<EventStreamServiceContract>(EVENT_STREAM_SERVICE);
    inboxService = app.get<InboxServiceContract>(INBOX_SERVICE);
    outboxProcessorService = app.get(OutboxProcessorService);
    amqpConnection = app.get(AmqpConnection);
    redis = app.get(Redis);
    testEventConsumer = app.get(TestEventConsumer);
    sendWelcomeEmailHandler = app.get(SendWelcomeEmailHandler);
    sendVerificationEmailHandler = app.get(SendVerificationEmailHandler);
    deleteStorageHandler = app.get(DeleteStorageHandler);
    s3StorageService = app.get(S3StorageService);

    vi.spyOn(s3StorageService, 'delete').mockResolvedValue(undefined);

    amqpChannelModel = await amqplib.connect(rabbitMqUri);
    amqpChannel = await amqpChannelModel.createChannel();

    await waitFor(
      async () => {
        if (!amqpConnection.managedConnection.isConnected()) {
          return false;
        }
        if (!amqpChannel) {
          return false;
        }
        for (const exchange of TEST_EXCHANGES) {
          await amqpChannel.checkExchange(exchange);
        }
        for (const queue of TEST_QUEUES) {
          await amqpChannel.checkQueue(queue);
        }
        for (const consumerQueue of CONSUMER_QUEUES) {
          const stats = await amqpChannel.checkQueue(consumerQueue);
          if (stats.consumerCount < 1) {
            return false;
          }
        }
        return true;
      },
      20_000,
      200,
      'RabbitMQ topology bootstrap and @RabbitSubscribe consumer registration',
    );
  }, 40_000);

  afterAll(async () => {
    vi.restoreAllMocks();

    const eventIdList = Array.from(trackedEventIds);
    if (eventIdList.length > 0 && dataSource?.isInitialized) {
      await inboxRepo.delete({ eventId: In(eventIdList) });
      await outboxRepo.delete({ eventId: In(eventIdList) });
    }

    const videoIdList = Array.from(trackedVideoIds);
    if (videoIdList.length > 0 && dataSource?.isInitialized) {
      await videoRepo.delete({ videoId: In(videoIdList) });
    }

    if (amqpChannel) {
      for (const queueName of TEST_QUEUES) {
        await amqpChannel.purgeQueue(queueName).catch(() => undefined);
      }
      await amqpChannel.close().catch(() => undefined);
    }
    if (amqpChannelModel) {
      await amqpChannelModel.close().catch(() => undefined);
    }

    if (app) {
      await app.close();
    }

    if (redis && redis.status !== 'end') {
      await redis.del(...TEST_REDIS_STREAMS).catch(() => undefined);
      await redis.quit().catch(() => {
        redis.disconnect();
      });
    }
  }, 30_000);

  it('1. Topology Bootstrap: verifies exchanges, queues, and bindings exist in real RabbitMQ', async () => {
    expect(amqpChannel).toBeDefined();
    const channel = amqpChannel as amqplib.Channel;

    for (const exchangeName of TEST_EXCHANGES) {
      await expect(channel.checkExchange(exchangeName)).resolves.toBeDefined();
    }

    for (const queueName of TEST_QUEUES) {
      await expect(channel.checkQueue(queueName)).resolves.toBeDefined();
    }

    const expectedBindings: Record<(typeof TEST_QUEUES)[number], RabbitMqBindingInfo> = {
      'mail.user-created.queue': {
        source: 'user.events',
        destination: 'mail.user-created.queue',
        routing_key: UserCreatedEvent.EVENT_NAME,
      },
      'mail.user-registered.queue': {
        source: 'user.events',
        destination: 'mail.user-registered.queue',
        routing_key: UserRegisteredEvent.EVENT_NAME,
      },
      'video.transcode.queue': {
        source: 'video.events',
        destination: 'video.transcode.queue',
        routing_key: VideoUploadedEvent.EVENT_NAME,
      },
      'storage.delete.queue': {
        source: 'storage.events',
        destination: 'storage.delete.queue',
        routing_key: DeleteStorageEvent.EVENT_NAME,
      },
    };

    for (const queueName of TEST_QUEUES) {
      const bindings = await fetchRabbitMqQueueBindings(rabbitMqUri, queueName);
      const expected = expectedBindings[queueName];
      const matched = bindings.some(
        (binding) =>
          binding.source === expected.source &&
          binding.destination === expected.destination &&
          binding.routing_key === expected.routing_key,
      );
      expect(matched).toBe(true);
    }
  }, 20_000);

  it('2. RabbitMQ E2E (Auth -> Mail): relays UserCreatedEvent and UserRegisteredEvent through Outbox, RabbitMQ, MailListener, and Inbox', async () => {
    mailSendMock.mockClear();
    const welcomeSpy = vi.spyOn(sendWelcomeEmailHandler, 'handle');
    const verificationSpy = vi.spyOn(sendVerificationEmailHandler, 'handle');

    const userCreatedEvent = new UserCreatedEvent(
      randomUUID(),
      `welcome-${randomUUID()}@mycast.test`,
      'E2E Welcome User',
      'e2e_welcome',
    );
    const userRegisteredEvent = new UserRegisteredEvent(
      `verify-${randomUUID()}@mycast.test`,
      'E2E Verify User',
      '654321',
      300,
    );
    trackEventId(userCreatedEvent.id);
    trackEventId(userRegisteredEvent.id);

    const createdOutbox = await queueService.publish(userCreatedEvent);
    const registeredOutbox = await queueService.publish(userRegisteredEvent);

    expect(createdOutbox).toHaveLength(1);
    expect(createdOutbox[0].status).toBe(OutboxStatus.PENDING);
    expect(createdOutbox[0].transport).toBe(TransportType.RABBITMQ);
    expect(createdOutbox[0].destination).toBe('user.events');

    expect(registeredOutbox).toHaveLength(1);
    expect(registeredOutbox[0].status).toBe(OutboxStatus.PENDING);

    await outboxProcessorService.processPendingMessages();

    const createdOutboxRow = await outboxRepo.findOneByOrFail({
      id: createdOutbox[0].id,
    });
    const registeredOutboxRow = await outboxRepo.findOneByOrFail({
      id: registeredOutbox[0].id,
    });
    expect(createdOutboxRow.status).toBe(OutboxStatus.PROCESSED);
    expect(createdOutboxRow.processedAt).toBeInstanceOf(Date);
    expect(registeredOutboxRow.status).toBe(OutboxStatus.PROCESSED);
    expect(registeredOutboxRow.processedAt).toBeInstanceOf(Date);

    const welcomeInbox = await waitFor(
      async () => {
        const row = await inboxRepo.findOneBy({
          eventId: userCreatedEvent.id,
          consumer: 'MailListener.handleUserCreated',
        });
        return row?.status === InboxStatus.PROCESSED ? row : false;
      },
      15_000,
      100,
      'MailListener.handleUserCreated inbox PROCESSED',
    );
    expect(welcomeInbox.eventType).toBe(UserCreatedEvent.EVENT_NAME);

    const verificationInbox = await waitFor(
      async () => {
        const row = await inboxRepo.findOneBy({
          eventId: userRegisteredEvent.id,
          consumer: 'MailListener.handleUserRegistered',
        });
        return row?.status === InboxStatus.PROCESSED ? row : false;
      },
      15_000,
      100,
      'MailListener.handleUserRegistered inbox PROCESSED',
    );
    expect(verificationInbox.eventType).toBe(UserRegisteredEvent.EVENT_NAME);

    expect(welcomeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: userCreatedEvent.id,
        email: userCreatedEvent.email,
      }),
    );
    expect(verificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: userRegisteredEvent.id,
        email: userRegisteredEvent.email,
        code: '654321',
      }),
    );
    expect(mailSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userCreatedEvent.email,
        template: 'welcome',
      }),
    );
    expect(mailSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userRegisteredEvent.email,
        template: 'verification',
      }),
    );

    welcomeSpy.mockRestore();
    verificationSpy.mockRestore();
  }, 25_000);

  it('3. RabbitMQ E2E (Storage -> StorageListener): delivers DeleteStorageEvent via storage.delete.queue and records Inbox PROCESSED', async () => {
    const deleteHandlerSpy = vi.spyOn(deleteStorageHandler, 'handle');
    const storageDeleteSpy = vi
      .spyOn(s3StorageService, 'delete')
      .mockResolvedValue(undefined);
    storageDeleteSpy.mockClear();

    const storageKeys = [
      `e2e/storage/${randomUUID()}.mp4`,
      `e2e/storage/${randomUUID()}.jpg`,
    ];
    const deleteEvent = new DeleteStorageEvent(storageKeys);
    trackEventId(deleteEvent.id);

    const outboxRows = await queueService.publish(deleteEvent);
    expect(outboxRows).toHaveLength(1);
    expect(outboxRows[0].destination).toBe('storage.events');

    await outboxProcessorService.processPendingMessages();

    const outboxRow = await outboxRepo.findOneByOrFail({
      id: outboxRows[0].id,
    });
    expect(outboxRow.status).toBe(OutboxStatus.PROCESSED);

    const inboxRow = await waitFor(
      async () => {
        const row = await inboxRepo.findOneBy({
          eventId: deleteEvent.id,
          consumer: 'StorageListener.handleDeleteStorage',
        });
        return row?.status === InboxStatus.PROCESSED ? row : false;
      },
      15_000,
      100,
      'StorageListener.handleDeleteStorage inbox PROCESSED',
    );
    expect(inboxRow.transport).toBe(TransportType.RABBITMQ);
    expect(inboxRow.source).toBe('storage.events');

    expect(deleteHandlerSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: deleteEvent.id,
        storageIds: storageKeys,
      }),
    );
    expect(storageDeleteSpy).toHaveBeenCalledWith(storageKeys[0]);
    expect(storageDeleteSpy).toHaveBeenCalledWith(storageKeys[1]);

    deleteHandlerSpy.mockRestore();
  }, 25_000);

  it('4. RabbitMQ E2E (Video Webhook -> Transcode Queue): delivers VideoUploadedEvent payload to video.transcode.queue', async () => {
    const channel = amqpChannel as amqplib.Channel;
    await channel.purgeQueue('video.transcode.queue');

    const videoId = randomUUID();
    const authorId = randomUUID();
    const videoKey = `uploads/e2e-${randomUUID()}.mp4`;
    trackedVideoIds.add(videoId);

    const video = Video.create(
      videoId,
      authorId,
      'E2E webhook video',
      'E2E Webhook Title',
      'thumbnails/e2e.jpg',
      videoKey,
      0,
      VideoConfig.create(VideoVisibility.PUBLIC, true),
    );
    video.videoStatus = VideoStatus.UPLOADING;
    await videoRepo.save(video);

    const webhookRes = await request(app.getHttpServer())
      .post('/videos/webhooks/s3?nodeId=node-e2e')
      .send({
        Records: [
          {
            eventName: 's3:ObjectCreated:Put',
            s3: { object: { key: videoKey } },
          },
        ],
      })
      .expect(200);

    expect(webhookRes.body).toEqual({ processed: 1, ignored: 0 });

    const outboxRow = await outboxRepo.findOneByOrFail({
      eventType: VideoUploadedEvent.EVENT_NAME,
      destination: 'video.events',
    });
    trackEventId(outboxRow.eventId);

    await outboxProcessorService.processPendingMessages();

    const processedOutbox = await outboxRepo.findOneByOrFail({
      id: outboxRow.id,
    });
    expect(processedOutbox.status).toBe(OutboxStatus.PROCESSED);

    const message = await waitFor(
      async () => {
        const delivered = await channel.get('video.transcode.queue', {
          noAck: false,
        });
        return delivered === false ? false : delivered;
      },
      15_000,
      100,
      'video.transcode.queue message delivery',
    );

    try {
      const payload = JSON.parse(message.content.toString('utf8')) as {
        id: string;
        videoId: string;
        authorId: string;
        videoKey: string;
        isSuccess: boolean;
        thumbnailKey?: string | null;
        nodeId?: string;
      };
      expect(payload.id).toBe(outboxRow.eventId);
      expect(payload.videoId).toBe(videoId);
      expect(payload.authorId).toBe(authorId);
      expect(payload.videoKey).toBe(videoKey);
      expect(payload.isSuccess).toBe(true);
      expect(payload.thumbnailKey).toBe('thumbnails/e2e.jpg');
      expect(payload.nodeId).toBe('node-e2e');
    } finally {
      channel.ack(message);
    }
  }, 25_000);

  it('5. Idempotency & Error Handling: deduplicates duplicate eventId, records FAILED inbox error, and retries/releases stuck outbox rows', async () => {
    // 5a. Deduplicate redelivered eventId via INBOX_SERVICE.executeOnce
    const welcomeSpy = vi.spyOn(sendWelcomeEmailHandler, 'handle');
    const dedupEvent = new UserCreatedEvent(
      randomUUID(),
      `dedup-${randomUUID()}@mycast.test`,
      'Dedup User',
      'dedup_user',
    );
    trackEventId(dedupEvent.id);

    await queueService.publish(dedupEvent);
    await outboxProcessorService.processPendingMessages();

    await waitFor(
      async () => {
        const row = await inboxRepo.findOneBy({
          eventId: dedupEvent.id,
          consumer: 'MailListener.handleUserCreated',
        });
        return row?.status === InboxStatus.PROCESSED ? row : false;
      },
      15_000,
      100,
      'initial dedup event inbox PROCESSED',
    );

    const callsAfterFirstDelivery = welcomeSpy.mock.calls.filter(
      ([arg]) => arg.id === dedupEvent.id,
    ).length;
    expect(callsAfterFirstDelivery).toBe(1);

    // Re-deliver the exact same eventId directly to user.events
    await amqpConnection.publish(
      'user.events',
      UserCreatedEvent.EVENT_NAME,
      JSON.parse(dedupEvent.serialize()) as Record<string, unknown>,
    );

    await sleep(600);

    const executedAgain = await inboxService.executeOnce(
      {
        eventId: dedupEvent.id,
        consumer: 'MailListener.handleUserCreated',
        eventType: UserCreatedEvent.EVENT_NAME,
        payload: dedupEvent.serialize(),
        transport: TransportType.RABBITMQ,
        source: 'user.events',
      },
      dedupEvent,
      sendWelcomeEmailHandler,
    );
    expect(executedAgain).toBe(false);

    const inboxRowsForDedup = await inboxRepo.findBy({
      eventId: dedupEvent.id,
      consumer: 'MailListener.handleUserCreated',
    });
    expect(inboxRowsForDedup).toHaveLength(1);
    const callsAfterRedelivery = welcomeSpy.mock.calls.filter(
      ([arg]) => arg.id === dedupEvent.id,
    ).length;
    expect(callsAfterRedelivery).toBe(1);

    // 5b. Forced handler failure records inbox.status = FAILED with lastError
    const failingEvent = new UserCreatedEvent(
      randomUUID(),
      `fail-${randomUUID()}@mycast.test`,
      'Fail User',
      'fail_user',
    );
    trackEventId(failingEvent.id);

    welcomeSpy.mockRejectedValueOnce(new Error('Forced SMTP failure'));

    await queueService.publish(failingEvent);
    await outboxProcessorService.processPendingMessages();

    const failedInboxRow = await waitFor(
      async () => {
        const row = await inboxRepo.findOneBy({
          eventId: failingEvent.id,
          consumer: 'MailListener.handleUserCreated',
        });
        return row?.status === InboxStatus.FAILED ? row : false;
      },
      15_000,
      100,
      'forced failure inbox FAILED status',
    );

    expect(failedInboxRow.status).toBe(InboxStatus.FAILED);
    expect(failedInboxRow.lastError).toContain('Forced SMTP failure');
    expect(failedInboxRow.retryCount).toBeGreaterThanOrEqual(1);
    welcomeSpy.mockRestore();

    // 5c. Outbox retry (FAILED) & stuck-release (PROCESSING olderThan 5m) against PostgreSQL
    const retryEvent = new UserCreatedEvent(
      randomUUID(),
      `retry-${randomUUID()}@mycast.test`,
      'Retry User',
      'retry_user',
    );
    const stuckEvent = new UserCreatedEvent(
      randomUUID(),
      `stuck-${randomUUID()}@mycast.test`,
      'Stuck User',
      'stuck_user',
    );
    trackEventId(retryEvent.id);
    trackEventId(stuckEvent.id);

    const [retryOutbox] = await queueService.publish(retryEvent);
    const [stuckOutbox] = await queueService.publish(stuckEvent);

    await outboxRepository.markByIdAsFailed(
      retryOutbox.id,
      'Simulated transient RabbitMQ error',
    );
    const failedOutboxState = await outboxRepo.findOneByOrFail({
      id: retryOutbox.id,
    });
    expect(failedOutboxState.status).toBe(OutboxStatus.FAILED);
    expect(failedOutboxState.retryCount).toBe(1);
    expect(failedOutboxState.lastError).toBe(
      'Simulated transient RabbitMQ error',
    );

    await dataSource
      .createQueryBuilder()
      .update(OutboxEntity)
      .set({
        status: OutboxStatus.PROCESSING,
        updatedAt: () => "NOW() - INTERVAL '10 minutes'",
      })
      .where('id = :id', { id: stuckOutbox.id })
      .execute();

    await outboxProcessorService.processPendingMessages();

    const retriedFinal = await outboxRepo.findOneByOrFail({
      id: retryOutbox.id,
    });
    const stuckFinal = await outboxRepo.findOneByOrFail({
      id: stuckOutbox.id,
    });

    expect(retriedFinal.status).toBe(OutboxStatus.PROCESSED);
    expect(retriedFinal.lastError).toBeNull();
    expect(retriedFinal.retryCount).toBe(1);

    expect(stuckFinal.status).toBe(OutboxStatus.PROCESSED);
    expect(stuckFinal.processedAt).toBeInstanceOf(Date);

    await waitFor(
      async () => {
        const r1 = await inboxRepo.findOneBy({
          eventId: retryEvent.id,
          consumer: 'MailListener.handleUserCreated',
        });
        const r2 = await inboxRepo.findOneBy({
          eventId: stuckEvent.id,
          consumer: 'MailListener.handleUserCreated',
        });
        return r1?.status === InboxStatus.PROCESSED &&
          r2?.status === InboxStatus.PROCESSED
          ? true
          : false;
      },
      15_000,
      100,
      'retried and released-stuck events delivered to MailListener inbox',
    );
  }, 30_000);

  it('6. Redis Stream E2E (TestEventConsumer): HTTP publish -> Outbox -> XADD -> RedisStreamExplorer -> XACK (XPENDING == 0)', async () => {
    const receivedPayloads: Record<string, unknown>[] = [];
    const subscription = testEventConsumer
      .getEventObservable()
      .subscribe((msgEvent) => {
        if (
          typeof msgEvent.data === 'object' &&
          msgEvent.data !== null &&
          !Array.isArray(msgEvent.data)
        ) {
          receivedPayloads.push(msgEvent.data as Record<string, unknown>);
        }
      });

    try {
      const httpRes = await request(app.getHttpServer())
        .get('/test-event/publish')
        .query({ message: 'e2e-ping' })
        .expect(200);

      const body = httpRes.body as { success: boolean; eventId: string };
      expect(body.success).toBe(true);
      expect(typeof body.eventId).toBe('string');
      trackEventId(body.eventId);

      const pendingOutbox = await outboxRepo.findOneByOrFail({
        eventId: body.eventId,
        transport: TransportType.REDIS_STREAM,
      });
      expect(pendingOutbox.status).toBe(OutboxStatus.PENDING);

      await outboxProcessorService.processPendingMessages();

      const processedOutbox = await outboxRepo.findOneByOrFail({
        id: pendingOutbox.id,
      });
      expect(processedOutbox.status).toBe(OutboxStatus.PROCESSED);

      const streamEntries = await redis.xrange('test.event', '-', '+');
      const matchedEntry = streamEntries.find(([, rawFields]) => {
        const parsed = parseStreamFields(rawFields);
        return parsed.eventId === body.eventId;
      });
      expect(matchedEntry).toBeDefined();

      const parsedEntry = parseStreamFields(matchedEntry![1]);
      expect(parsedEntry.event).toBe('test.event');
      expect(JSON.parse(parsedEntry.payload)).toMatchObject({
        id: body.eventId,
        message: 'e2e-ping',
      });
      expect(Number(parsedEntry.publishedAt)).toBeGreaterThan(0);

      await waitFor(
        async () =>
          receivedPayloads.find(
            (payload) =>
              payload.id === body.eventId && payload.message === 'e2e-ping',
          ) ?? false,
        15_000,
        100,
        'TestEventConsumer.handleTestEvent stream consumption',
      );

      const pendingCount = await waitFor(
        async () => {
          const pendingSummary = (await redis.xpending(
            'test.event',
            'test-group',
          )) as [number, string | null, string | null, unknown[]];
          return pendingSummary[0] === 0 ? 0 : false;
        },
        10_000,
        100,
        'Redis Stream test-group XPENDING == 0 (XACK)',
      );
      expect(pendingCount).toBe(0);
    } finally {
      subscription.unsubscribe();
    }
  }, 25_000);

  it('7. Redis Stream E2E (VideoModule & InteractionModule): relays all representative domain events with valid stream fields', async () => {
    const videoId = randomUUID();
    const authorId = randomUUID();
    const playlistId = randomUUID();
    const commentId = randomUUID();
    const reportId = randomUUID();
    const blockerId = randomUUID();
    const blockedId = randomUUID();

    const events = [
      new VideoUpdatedEvent(videoId, authorId),
      new VideoLikedEvent(videoId, authorId),
      new PlaylistCreatedEvent(playlistId, authorId, 'E2E Stream Playlist'),
      new CommentCreatedEvent(commentId, videoId, authorId, null),
      new ContentReportedEvent(
        reportId,
        ReportTargetType.VIDEO,
        videoId,
        authorId,
        ReportReason.SPAM,
      ),
      new UserBlockedEvent(blockerId, blockedId),
    ];

    for (const event of events) {
      trackEventId(event.id);
    }

    const outboxRows = await eventStreamService.publishMany(events);
    expect(outboxRows).toHaveLength(events.length);

    await outboxProcessorService.processPendingMessages();

    const savedRows = await outboxRepo.findBy({
      eventId: In(events.map((event) => event.id)),
    });
    expect(savedRows).toHaveLength(events.length);
    for (const row of savedRows) {
      expect(row.status).toBe(OutboxStatus.PROCESSED);
      expect(row.transport).toBe(TransportType.REDIS_STREAM);
    }

    for (const event of events) {
      const streamKey = event.getEventName();
      const entries = await redis.xrange(streamKey, '-', '+');
      const matched = entries.find(([, rawFields]) => {
        const fields = parseStreamFields(rawFields);
        return fields.eventId === event.id;
      });

      expect(matched).toBeDefined();
      const fields = parseStreamFields(matched![1]);
      expect(fields.eventId).toBe(event.id);
      expect(fields.event).toBe(streamKey);
      expect(Number(fields.publishedAt)).toBeGreaterThan(0);

      const decodedPayload = JSON.parse(fields.payload) as Record<
        string,
        unknown
      >;
      expect(decodedPayload.id).toBe(event.id);
    }
  }, 40_000);
});
