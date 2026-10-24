import { ValueObject } from '../../../../../common/domain/value-object';

export class ChannelStats implements ValueObject<ChannelStats> {
  constructor(
    public readonly followersCount: number = 0,
    public readonly totalVideos: number = 0,
    public readonly totalViews: number = 0,
  ) {}

  static create(
    followersCount = 0,
    totalVideos = 0,
    totalViews = 0,
  ): ChannelStats {
    return new ChannelStats(
      Math.max(0, followersCount),
      Math.max(0, totalVideos),
      Math.max(0, totalViews),
    );
  }

  withFollowers(count: number): ChannelStats {
    return new ChannelStats(Math.max(0, count), this.totalVideos, this.totalViews);
  }

  withVideos(count: number): ChannelStats {
    return new ChannelStats(this.followersCount, Math.max(0, count), this.totalViews);
  }

  withViews(count: number): ChannelStats {
    return new ChannelStats(this.followersCount, this.totalVideos, Math.max(0, count));
  }

  equals(vo?: ValueObject<ChannelStats>): boolean {
    if (!vo) return false;
    if (!(vo instanceof ChannelStats)) return false;
    return (
      this.followersCount === vo.followersCount &&
      this.totalVideos === vo.totalVideos &&
      this.totalViews === vo.totalViews
    );
  }
}
