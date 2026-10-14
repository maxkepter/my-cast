import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { VideoReactionType } from '../enums/video-reaction-type.enum';

@Entity('video_reactions')
@Unique(['videoId', 'userId'])
export class VideoReaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  videoId!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: VideoReactionType,
    default: VideoReactionType.LIKE,
  })
  type!: VideoReactionType;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  static create(
    videoId: string,
    userId: string,
    type: VideoReactionType = VideoReactionType.LIKE,
  ): VideoReaction {
    const reaction = new VideoReaction();
    reaction.videoId = videoId;
    reaction.userId = userId;
    reaction.type = type;
    return reaction;
  }
}
