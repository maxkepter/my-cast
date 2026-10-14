import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './domain/entities/video.entity';
import { Playlist } from './domain/entities/playlist.entity';
import { WatchHistory } from './domain/entities/watch-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Video, Playlist, WatchHistory])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class VideoModule {}
