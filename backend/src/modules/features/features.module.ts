import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChannelModule } from './channel/channel.module';
import { InteractionModule } from './interaction/interaction.module';
import { UserModule } from './user/user.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    AuthModule,
    ChannelModule,
    InteractionModule,
    UserModule,
    VideoModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    AuthModule,
    ChannelModule,
    InteractionModule,
    UserModule,
    VideoModule,
  ],
})
export class FeaturesModule {}
