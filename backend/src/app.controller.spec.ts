import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom } from 'rxjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  EVENT_STREAM_SERVICE,
  EventStreamServiceContract,
  OutboxStatus,
  TransportType,
} from './modules/core/messaging';
import { TestEventConsumer, TestStreamEvent } from './test-event.consumer';

describe('AppController', () => {
  let appController: AppController;
  let testEventConsumer: TestEventConsumer;
  let publishMock: ReturnType<typeof vi.fn<EventStreamServiceContract['publish']>>;

  beforeEach(async () => {
    publishMock = vi.fn<EventStreamServiceContract['publish']>().mockResolvedValue([
      {
        id: 'outbox-1',
        eventId: 'evt-1',
        eventType: TestStreamEvent.EVENT_NAME,
        payload: '{}',
        transport: TransportType.REDIS_STREAM,
        destination: TestStreamEvent.EVENT_NAME,
        status: OutboxStatus.PENDING,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const eventStreamServiceMock: EventStreamServiceContract = {
      publish: publishMock,
      publishMany: vi.fn<EventStreamServiceContract['publishMany']>().mockResolvedValue([]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        TestEventConsumer,
        {
          provide: EVENT_STREAM_SERVICE,
          useValue: eventStreamServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    testEventConsumer = app.get<TestEventConsumer>(TestEventConsumer);
  });

  describe('root', () => {
    it('should return "Hello World!!!!!!!!!!!!"', () => {
      expect(appController.getHello()).toBe('Hello World!!!!!!!!!!!!');
    });
  });

  describe('test-event', () => {
    it('should publish TestStreamEvent through EVENT_STREAM_SERVICE and return eventId', async () => {
      const result = await appController.publishTestEvent('ping');

      expect(publishMock).toHaveBeenCalledTimes(1);
      const publishedEvent = publishMock.mock.calls[0][0] as TestStreamEvent;
      expect(publishedEvent).toBeInstanceOf(TestStreamEvent);
      expect(publishedEvent.message).toBe('ping');
      expect(result).toEqual({ success: true, eventId: 'evt-1' });
    });

    it('should fallback to event.id when outboxRows is empty', async () => {
      publishMock.mockResolvedValueOnce([]);

      const result = await appController.publishTestEvent('fallback');

      const publishedEvent = publishMock.mock.calls[0][0] as TestStreamEvent;
      expect(result).toEqual({ success: true, eventId: publishedEvent.id });
    });

    it('should emit incoming stream payload to SSE observable', async () => {
      const nextEventPromise = firstValueFrom(appController.sseTestEvent());
      const payload = { id: 'evt-2', message: 'hello-stream' };

      await testEventConsumer.handleTestEvent(payload);

      await expect(nextEventPromise).resolves.toEqual({ data: payload });
    });
  });
});

