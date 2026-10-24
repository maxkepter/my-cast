import { ChannelStatus } from '../enums/channel-status.enum';
import { ChannelStats } from '../value-objects/channel-stats.vo';
import { SocialLinks } from '../value-objects/social-links.vo';

export class Channel {
  channelId!: string;
  ownerId!: string;
  name!: string;
  handle!: string;
  bio!: string;
  avatarUrl!: string;
  bannerUrl!: string;
  status!: ChannelStatus;
  followersCount!: number;
  stats?: ChannelStats;
  socialLinks?: SocialLinks;
  createdAt!: Date;
  updatedAt!: Date;

  static create(params: {
    channelId?: string;
    ownerId: string;
    name: string;
    handle: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    status?: ChannelStatus;
    followersCount?: number;
    socialLinks?: SocialLinks;
  }): Channel {
    const channel = new Channel();
    if (params.channelId) {
      channel.channelId = params.channelId;
    }
    channel.ownerId = params.ownerId;
    channel.name = params.name;
    channel.handle = params.handle;
    channel.bio = params.bio ?? '';
    channel.avatarUrl = params.avatarUrl ?? '';
    channel.bannerUrl = params.bannerUrl ?? '';
    channel.status = params.status ?? ChannelStatus.ACTIVE;
    channel.followersCount = Math.max(0, params.followersCount ?? 0);
    channel.socialLinks = params.socialLinks ?? SocialLinks.create();
    channel.stats = ChannelStats.create(channel.followersCount);
    channel.createdAt = new Date();
    channel.updatedAt = new Date();
    return channel;
  }

  updateProfile(params: {
    name?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    socialLinks?: SocialLinks;
  }): void {
    if (params.name !== undefined) this.name = params.name;
    if (params.bio !== undefined) this.bio = params.bio;
    if (params.avatarUrl !== undefined) this.avatarUrl = params.avatarUrl;
    if (params.bannerUrl !== undefined) this.bannerUrl = params.bannerUrl;
    if (params.socialLinks !== undefined) this.socialLinks = params.socialLinks;
    this.updatedAt = new Date();
  }

  incrementFollowers(): void {
    this.followersCount = (this.followersCount || 0) + 1;
    if (this.stats) {
      this.stats = this.stats.withFollowers(this.followersCount);
    }
    this.updatedAt = new Date();
  }

  decrementFollowers(): void {
    this.followersCount = Math.max(0, (this.followersCount || 0) - 1);
    if (this.stats) {
      this.stats = this.stats.withFollowers(this.followersCount);
    }
    this.updatedAt = new Date();
  }

  suspend(): void {
    this.status = ChannelStatus.SUSPENDED;
    this.updatedAt = new Date();
  }

  reactivate(): void {
    this.status = ChannelStatus.ACTIVE;
    this.updatedAt = new Date();
  }
}
