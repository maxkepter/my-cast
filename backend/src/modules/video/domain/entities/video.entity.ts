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

  @Column(() => VideoConfig, { prefix: false })
  config!: VideoConfig;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  incrementViews(): void {
    this.views = (this.views || 0) + 1;
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
    video.config = config;
    return video;
  }
}
