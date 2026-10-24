import { CoreModule } from './modules/core/core.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { InfrastructureModule } from './modules/infra/infrastructure.module';

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
  ],
})
export class AppModule {}
