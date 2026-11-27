import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from './modules/core/core.module';
import { InfrastructureModule } from './modules/infra/infrastructure.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    InfrastructureModule,
    CoreModule,
  ],
})
export class AppModule {}
