import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlaylistVisibility } from '../enums/playlist-visibility.enum';
import { Video } from './video.entity';

@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  playlistId!: string;

  @Column({ type: 'uuid' })
  authorId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PlaylistVisibility,
    default: PlaylistVisibility.PUBLIC,
  })
  visibility!: PlaylistVisibility;

  @Column('text', { array: true, default: '{}' })
  videoIds!: string[];

  videos?: Video[] | undefined;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  addVideo(videoId: string): void {
    if (!this.videoIds) {
      this.videoIds = [];
    }
    if (!this.videoIds.includes(videoId)) {
      this.videoIds.push(videoId);
    }
  }

  removeVideo(videoId: string): void {
    if (this.videoIds) {
      this.videoIds = this.videoIds.filter((id) => id !== videoId);
    }
  }

  static create(
    playlistId: string,
    authorId: string,
    title: string,
    description: string | undefined,
    visibility: PlaylistVisibility,
    videoIds: string[],
  ): Playlist {
    const playlist = new Playlist();
    if (playlistId) {
      playlist.playlistId = playlistId;
    }
    playlist.authorId = authorId;
    playlist.title = title;
    playlist.description = description;
    playlist.visibility = visibility;
    playlist.videoIds = videoIds ?? [];
    return playlist;
  }
}
