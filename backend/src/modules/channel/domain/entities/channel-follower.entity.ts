export class ChannelFollower {
  id!: string;
  channelId!: string;
  followerId!: string;
  createdAt!: Date;

  static create(params: {
    id?: string;
    channelId: string;
    followerId: string;
    createdAt?: Date;
  }): ChannelFollower {
    const follower = new ChannelFollower();
    if (params.id) {
      follower.id = params.id;
    }
    follower.channelId = params.channelId;
    follower.followerId = params.followerId;
    follower.createdAt = params.createdAt ?? new Date();
    return follower;
  }
}
