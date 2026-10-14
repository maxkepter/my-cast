import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VideoConfig } from '../value-objects/video-config.vo';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  videoId!: string;

  @Column({ type: 'uuid' })
  authorId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  thumbnail!: string;

  @Column({ type: 'varchar', length: 500 })
  videoFile!: string;

  @Column({ type: 'int', default: 0 })
  views!: number;

  @Column({ type: 'int', default: 0 })
  likesCount!: number;

  @Column({ type: 'int', default: 0 })
  sharesCount!: number;

  @Column(() => VideoConfig, { prefix: false })
  config!: VideoConfig;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  incrementViews(): void {
    this.views = (this.views || 0) + 1;
  }

  incrementLikes(): void {
    this.likesCount = (this.likesCount || 0) + 1;
  }

  decrementLikes(): void {
    this.likesCount = Math.max(0, (this.likesCount || 0) - 1);
  }

  incrementShares(): void {
    this.sharesCount = (this.sharesCount || 0) + 1;
  }

  static create(
    videoId: string,
    authorId: string,
    description: string,
    title: string,
    thumbnail: string,
    videoFile: string,
    views: number,
    config: VideoConfig,
    likesCount = 0,
    sharesCount = 0,
  ): Video {
    const video = new Video();
    if (videoId) {
      video.videoId = videoId;
    }
    video.authorId = authorId;
    video.description = description;
    video.title = title;
    video.thumbnail = thumbnail;
    video.videoFile = videoFile;
    video.views = views ?? 0;
    video.likesCount = likesCount ?? 0;
    video.sharesCount = sharesCount ?? 0;
    video.config = config;
    return video;
  }
}
