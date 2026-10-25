import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './domain/entities/video.entity';
import { Playlist } from './domain/entities/playlist.entity';
import { WatchHistory } from './domain/entities/watch-history.entity';
import { VideoReaction } from './domain/entities/video-reaction.entity';
import { VideoShare } from './domain/entities/video-share.entity';

import { VideoService } from './application/services/video.service';
import { VideoInteractionService } from './application/services/video-interaction.service';
import { PlaylistService } from './application/services/playlist.service';
import { WatchHistoryService } from './application/services/watch-history.service';

import { VideoController } from './infra/controllers/video.controller';
import { VideoInteractionController } from './infra/controllers/video-interaction.controller';
import { PlaylistController } from './infra/controllers/playlist.controller';
import { WatchHistoryController } from './infra/controllers/watch-history.controller';
import { VideoWebhookController } from './infra/controllers/video-webhook.controller';
import { OptionalJwtGuard } from './infra/guards/optional-jwt.guard';

import { AuthModule } from '../auth/auth.module';
import { EventModule } from '../../core/event/event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Video,
      Playlist,
      WatchHistory,
      VideoReaction,
      VideoShare,
    ]),
    AuthModule,
    EventModule,
  ],
  controllers: [
    VideoController,
    VideoInteractionController,
    PlaylistController,
    WatchHistoryController,
    VideoWebhookController,
  ],
  providers: [
    VideoService,
    VideoInteractionService,
    PlaylistService,
    WatchHistoryService,
    OptionalJwtGuard,
  ],
  exports: [
    TypeOrmModule,
    VideoService,
    VideoInteractionService,
    PlaylistService,
    WatchHistoryService,
  ],
})
export class VideoModule {}
