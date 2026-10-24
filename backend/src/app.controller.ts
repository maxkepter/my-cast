import {
  Controller,
  Get,
  Post,
  Body,
  Sse,
  MessageEvent,
  Query,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AppService } from './app.service';
import { TestEventConsumer } from './test-event.consumer';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly testEventConsumer: TestEventConsumer,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/test')
  test(): string {
    return 'test--';
  }

  @Get('/test-event/publish')
  async publishTestEvent(@Query('message') message: string) {
    const eventId = await this.testEventConsumer.publish(
      message || 'Hello from Redis Stream',
    );
    return { success: true, eventId };
  }

  @Sse('/test-event/sse')
  sseTestEvent(): Observable<MessageEvent> {
    return this.testEventConsumer.getEventObservable();
  }
}
