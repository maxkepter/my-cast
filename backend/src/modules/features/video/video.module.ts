import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from './domain/entities/video.entity';
import { Playlist } from './domain/entities/playlist.entity';
import { WatchHistory } from './domain/entities/watch-history.entity';
import { VideoReaction } from './domain/entities/video-reaction.entity';
import { VideoShare } from './domain/entities/video-share.entity';
import { VideoUploadPolicy } from './domain/policies/video-upload.policy';

import { VideoService } from './application/services/video.service';
import { VideoUploadService } from './application/services/video-upload.service';
import { VideoStatusStreamService } from './application/services/video-status-stream.service';
import { VideoInteractionService } from './application/services/video-interaction.service';
import { PlaylistService } from './application/services/playlist.service';
import { WatchHistoryService } from './application/services/watch-history.service';
import { VideoProcessCompletedHandler } from './application/handlers/video-process-completed.handler';
import { VideoProcessFailedHandler } from './application/handlers/video-process-failed.handler';

import { VideoController } from './infra/controllers/video.controller';
import { VideoInteractionController } from './infra/controllers/video-interaction.controller';
import { PlaylistController } from './infra/controllers/playlist.controller';
import { WatchHistoryController } from './infra/controllers/watch-history.controller';
import { VideoWebhookController } from './infra/controllers/video-webhook.controller';
import { VideoProcessCompletedConsumer } from './infra/listeners/video-process-completed.consumer';
import { VideoProcessFailedConsumer } from './infra/listeners/video-process-failed.consumer';
import { OptionalJwtGuard } from './infra/guards/optional-jwt.guard';

import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../../core/storage';
import { MessagingModule } from '../../core/messaging';
import { VIDEO_MESSAGING_TOPOLOGY } from './infra/messaging/video-messaging.topology';

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
    StorageModule,
    MessagingModule.forFeature(VIDEO_MESSAGING_TOPOLOGY),
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
    VideoUploadPolicy,
    VideoUploadService,
    VideoStatusStreamService,
    VideoProcessFailedHandler,
    VideoProcessFailedConsumer,
    VideoProcessCompletedHandler,
    VideoProcessCompletedConsumer,
    VideoInteractionService,
    PlaylistService,
    WatchHistoryService,
    OptionalJwtGuard,
  ],
  exports: [
    TypeOrmModule,
    VideoService,
    VideoUploadService,
    VideoStatusStreamService,
    VideoInteractionService,
    PlaylistService,
    WatchHistoryService,
  ],
})
export class VideoModule {}
