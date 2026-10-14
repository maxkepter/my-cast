import { ChannelModule } from './modules/channel/channel.module';
import { InteractionModule } from './modules/interaction/interaction.module';
import { VideoModule } from './modules/video/video.module';
import { InfrastructureModule } from './modules/infra/infrastructure.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ChannelModule,
    InteractionModule,
    VideoModule,
    InfrastructureModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
