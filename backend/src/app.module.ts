import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from './modules/infra/infrastructure.module';
import { CoreModule } from './modules/core/core.module';
import {
  MessagingModule,
  ModuleTopology,
  TransportType,
} from './modules/core/messaging';
import { FeaturesModule } from './modules/features/features.module';
import { TestEventConsumer, TestStreamEvent } from './test-event.consumer';

export const TEST_EVENT_TOPOLOGY: ModuleTopology = {
  routes: [
    {
      eventType: TestStreamEvent.EVENT_NAME,
      transport: TransportType.REDIS_STREAM,
      destination: TestStreamEvent.EVENT_NAME,
    },
  ],
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    InfrastructureModule,
    CoreModule,
    MessagingModule.forFeature(TEST_EVENT_TOPOLOGY),
    FeaturesModule,
  ],
  controllers: [AppController],
  providers: [AppService, TestEventConsumer],
})
export class AppModule {}

