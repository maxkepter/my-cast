import { Module } from '@nestjs/common';

import { InfrastructureModule } from './modules/infra/infrastructure.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), InfrastructureModule],
})
export class AppModule {}
