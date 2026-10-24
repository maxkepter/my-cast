import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SharePlatform } from '../enums/share-platform.enum';

@Entity('video_shares')
export class VideoShare {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  videoId!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({
    type: 'enum',
    enum: SharePlatform,
    default: SharePlatform.DIRECT_LINK,
  })
  platform!: SharePlatform;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  static create(
    videoId: string,
    userId: string | null,
    platform: SharePlatform = SharePlatform.DIRECT_LINK,
  ): VideoShare {
    const share = new VideoShare();
    share.videoId = videoId;
    share.userId = userId;
    share.platform = platform;
    return share;
  }
}
