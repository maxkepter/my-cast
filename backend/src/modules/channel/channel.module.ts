import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './domain/entities/channel.entity';
import { ChannelFollower } from './domain/entities/channel-follower.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, ChannelFollower])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class ChannelModule {}