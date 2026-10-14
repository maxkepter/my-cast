export interface VideoBasicInfo {
  videoId: string;
  authorId: string;
  isCommentsAllowed: boolean;
  isActive: boolean;
}

export interface VideoQueryContract {
  getVideoBasicInfo(videoId: string): Promise<VideoBasicInfo | null>;
  isAuthorOfVideo(videoId: string, userId: string): Promise<boolean>;
}

export const MockVideoQueryContract: VideoQueryContract = {
  getVideoBasicInfo: async (videoId: string): Promise<VideoBasicInfo | null> => ({
    videoId,
    authorId: 'creator-uuid-1',
    isCommentsAllowed: true,
    isActive: true,
  }),
  isAuthorOfVideo: async (videoId: string, userId: string): Promise<boolean> =>
    userId === 'creator-uuid-1',
};
