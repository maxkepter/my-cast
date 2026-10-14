import { VideoVisibility } from '../domain/enums/video-visibility.enum';

export class VideoConfigRes {
  visibility!: VideoVisibility;
  allowComments!: boolean;
  scheduledAt?: Date;

  static of(
    visibility: VideoVisibility,
    allowComments: boolean,
    scheduledAt?: Date,
  ): VideoConfigRes {
    const res = new VideoConfigRes();
    res.visibility = visibility;
    res.allowComments = allowComments;
    res.scheduledAt = scheduledAt;
    return res;
  }
}

export class VideoRes {
  videoId!: string;
  authorId!: string;
  description!: string;
  title!: string;
  thumbnail!: string;
  videoFile!: string;
  views!: number;
  config!: VideoConfigRes;

  static of(
    videoId: string,
    authorId: string,
    description: string,
    title: string,
    thumbnail: string,
    videoFile: string,
    views: number,
    config: VideoConfigRes,
  ): VideoRes {
    const res = new VideoRes();
    res.videoId = videoId;
    res.authorId = authorId;
    res.description = description;
    res.title = title;
    res.thumbnail = thumbnail;
    res.videoFile = videoFile;
    res.views = views;
    res.config = config;
    return res;
  }
}

export class WatchVideoRes {
  videoId!: string;
  authorId!: string;
  description!: string;
  title!: string;
  thumbnail!: string;
  videoFile!: string;
  views!: number;

  static of(
    videoId: string,
    authorId: string,
    description: string,
    title: string,
    thumbnail: string,
    videoFile: string,
    views: number,
  ): WatchVideoRes {
    const res = new WatchVideoRes();
    res.videoId = videoId;
    res.authorId = authorId;
    res.description = description;
    res.title = title;
    res.thumbnail = thumbnail;
    res.videoFile = videoFile;
    res.views = views;
    return res;
  }
}

export class PlaylistRes {
  playlistId!: string;
  playlistName!: string;
  playlistDescription!: string;
  videos?: WatchVideoRes[];

  static of(
    playlistId: string,
    playlistName: string,
    playlistDescription: string,
    videos?: WatchVideoRes[],
  ): PlaylistRes {
    const res = new PlaylistRes();
    res.playlistId = playlistId;
    res.playlistName = playlistName;
    res.playlistDescription = playlistDescription;
    res.videos = videos;
    return res;
  }
}
