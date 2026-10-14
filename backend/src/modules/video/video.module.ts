import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './domain/entities/video.entity';
import { Playlist } from './domain/entities/playlist.entity';
import { WatchHistory } from './domain/entities/watch-history.entity';
import { VideoReaction } from './domain/entities/video-reaction.entity';
import { VideoShare } from './domain/entities/video-share.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Video,
      Playlist,
      WatchHistory,
      VideoReaction,
      VideoShare,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class VideoModule {}
