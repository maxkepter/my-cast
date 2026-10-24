import { Column } from 'typeorm';
import { ValueObject } from '../../../../../common/domain/value-object';
import { VideoVisibility } from '../enums/video-visibility.enum';

export class VideoConfig implements ValueObject<VideoConfig> {
  equals(vo?: ValueObject<VideoConfig>): boolean {
    if (!vo) return false;
    if (!(vo instanceof VideoConfig)) return false;
    return (
      this.visibility === vo.visibility &&
      this.allowComments === vo.allowComments &&
      this.scheduledAt?.getTime() === vo.scheduledAt?.getTime()
    );
  }

  @Column({
    type: 'enum',
    enum: VideoVisibility,
    default: VideoVisibility.PUBLIC,
  })
  visibility!: VideoVisibility;

  @Column({ type: 'boolean', default: true })
  allowComments!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  static create(
    visibility: VideoVisibility,
    allowComments: boolean,
    scheduledAt?: Date,
  ): VideoConfig {
    const config = new VideoConfig();
    config.visibility = visibility;
    config.allowComments = allowComments;
    config.scheduledAt = scheduledAt;
    return config;
  }
}
