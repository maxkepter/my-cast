import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Video } from './video.entity';

@Entity('watch_histories')
@Index(['userId', 'videoId'])
export class WatchHistory {
  @PrimaryGeneratedColumn('uuid')
  historyId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  videoId!: string;

  @ManyToOne(() => Video, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'videoId' })
  video?: Video;

  @Column({ type: 'int', default: 0 })
  watchedSeconds!: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  watchedAt!: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  updateProgress(watchedSeconds: number): void {
    this.watchedSeconds = watchedSeconds;
    this.watchedAt = new Date();
  }

  static create(
    historyId: string,
    userId: string,
    videoId: string,
    watchedSeconds: number,
    watchedAt: Date = new Date(),
  ): WatchHistory {
    const history = new WatchHistory();
    if (historyId) {
      history.historyId = historyId;
    }
    history.userId = userId;
    history.videoId = videoId;
    history.watchedSeconds = watchedSeconds ?? 0;
    history.watchedAt = watchedAt;
    return history;
  }
}
