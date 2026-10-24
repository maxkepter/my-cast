import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FeaturesModule } from './modules/features/features.module';
import { InfrastructureModule } from './modules/infra/infrastructure.module';

@Module({
  imports: [
    FeaturesModule,
    InfrastructureModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
