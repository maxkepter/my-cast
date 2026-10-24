import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestEventConsumer } from './test-event.consumer';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: TestEventConsumer,
          useValue: {
            publish: vi.fn(),
            getEventObservable: vi.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!!!!!!!!!!!!"', () => {
      expect(appController.getHello()).toBe('Hello World!!!!!!!!!!!!');
    });
  });
});

