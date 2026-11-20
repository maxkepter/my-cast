import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Comment } from './domain/entities/comment.entity';
import { ContentReport } from './domain/entities/content-report.entity';
import { UserBlock } from './domain/entities/user-block.entity';

// Domain Services & Policies
import { CommentAuthorizationPolicy } from './domain/services/comment-authorization.policy';

// Upstream Modules (Module CHỈ ĐƯỢC IMPORT MODULE)
import { VideoModule } from '../video/video.module';
import { AuthModule } from '../auth/auth.module';
import { EventModule } from '../../core/event/event.module';

// Application Services
import {
  CommentService,
  ContentReportService,
  UserBlockService,
} from './application/services';

// Controllers
import {
  CommentController,
  ContentReportController,
  UserBlockController,
} from './infra/controllers';

// Guards
import { OptionalJwtGuard } from './infra/guards/optional-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, ContentReport, UserBlock]),
    VideoModule,
    AuthModule,
    EventModule,
  ],
  controllers: [
    CommentController,
    ContentReportController,
    UserBlockController,
  ],
  providers: [
    CommentAuthorizationPolicy,
    CommentService,
    ContentReportService,
    UserBlockService,
    OptionalJwtGuard,
  ],
  exports: [
    TypeOrmModule,
    CommentService,
    ContentReportService,
    UserBlockService,
    CommentAuthorizationPolicy,
  ],
})
export class InteractionModule {}
