export type PlaylistVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export interface PlaylistVideoItem {
  videoId: string;
  authorId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  videoFile?: string;
  views: number;
  likesCount: number;
  sharesCount: number;
  durationSeconds?: number;
}

export interface PlaylistRes {
  playlistId: string;
  playlistName: string;
  playlistDescription?: string;
  visibility?: PlaylistVisibility;
  authorId?: string;
  videos: PlaylistVideoItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlaylistReq {
  playlistName: string;
  playlistDescription?: string;
  visibility?: PlaylistVisibility;
}

export interface AddVideoToPlaylistReq {
  videoId: string;
  playlistId: string;
}

export interface PlaylistQueryReq {
  page?: number;
  size?: number;
}

export interface PaginatedPlaylistRes {
  data: PlaylistRes[];
  total: number;
  req?: {
    page: number;
    size: number;
  };
}
