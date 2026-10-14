export interface ChannelBasicInfo {
  channelId: string;
  ownerId: string;
  name: string;
  handle: string;
  isActive: boolean;
}

export interface ChannelQueryContract {
  getChannelBasicInfo(channelId: string): Promise<ChannelBasicInfo | null>;
  isOwnerOfChannel(channelId: string, userId: string): Promise<boolean>;
}

export const MockChannelQueryContract: ChannelQueryContract = {
  getChannelBasicInfo: async (channelId: string) => ({
    channelId,
    ownerId: 'creator-uuid-1',
    name: 'Sample Channel',
    handle: '@samplechannel',
    isActive: true,
  }),
  isOwnerOfChannel: async (channelId: string, userId: string) =>
    userId === 'creator-uuid-1',
};
