export class ChannelStatsResDto {
  followersCount!: number;
  videosCount!: number;
  totalViews?: number;

  static of(
    followersCount: number,
    videosCount: number,
    totalViews = 0,
  ): ChannelStatsResDto {
    const res = new ChannelStatsResDto();
    res.followersCount = followersCount;
    res.videosCount = videosCount;
    res.totalViews = totalViews;
    return res;
  }
}

export class ChannelDetailResDto {
  channelId!: string;
  ownerId!: string;
  name!: string;
  handle!: string;
  bio!: string;
  avatarUrl!: string;
  bannerUrl!: string;
  stats!: ChannelStatsResDto;
  socialLinks?: Record<string, string>;
  isFollowedByViewer?: boolean;

  static of(params: {
    channelId: string;
    ownerId: string;
    name: string;
    handle: string;
    bio: string;
    avatarUrl: string;
    bannerUrl: string;
    stats: ChannelStatsResDto;
    socialLinks?: Record<string, string>;
    isFollowedByViewer?: boolean;
  }): ChannelDetailResDto {
    const res = new ChannelDetailResDto();
    res.channelId = params.channelId;
    res.ownerId = params.ownerId;
    res.name = params.name;
    res.handle = params.handle;
    res.bio = params.bio;
    res.avatarUrl = params.avatarUrl;
    res.bannerUrl = params.bannerUrl;
    res.stats = params.stats;
    res.socialLinks = params.socialLinks;
    res.isFollowedByViewer = params.isFollowedByViewer;
    return res;
  }
}

export class FollowStatusResDto {
  channelId!: string;
  isFollowing!: boolean;
  followersCount!: number;

  static of(
    channelId: string,
    isFollowing: boolean,
    followersCount: number,
  ): FollowStatusResDto {
    const res = new FollowStatusResDto();
    res.channelId = channelId;
    res.isFollowing = isFollowing;
    res.followersCount = followersCount;
    return res;
  }
}
