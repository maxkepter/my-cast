import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './domain/entities/comment.entity';
import { ContentReport } from './domain/entities/content-report.entity';
import { UserBlock } from './domain/entities/user-block.entity';
import { CommentAuthorizationPolicy } from './domain/services/comment-authorization.policy';
import { VideoModule } from '../video/video.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, ContentReport, UserBlock]),
    VideoModule,
  ],
  controllers: [],
  providers: [CommentAuthorizationPolicy],
  exports: [TypeOrmModule, CommentAuthorizationPolicy],
})
export class InteractionModule {}