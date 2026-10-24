export class VideoProcessRes {
  inputPath!: string;
  outputPath!: string;
  duration?: number;
  size?: number;

  static of(
    inputPath: string,
    outputPath: string,
    duration?: number,
    size?: number,
  ): VideoProcessRes {
    const res = new VideoProcessRes();
    res.inputPath = inputPath;
    res.outputPath = outputPath;
    res.duration = duration;
    res.size = size;
    return res;
  }
}

export class VideoMetadataRes {
  format?: string;
  duration?: number;
  size?: number;
  bitrate?: number;
  width?: number;
  height?: number;
  videoCodec?: string;
  audioCodec?: string;

  static of(partial: Partial<VideoMetadataRes>): VideoMetadataRes {
    return Object.assign(new VideoMetadataRes(), partial);
  }
}

export class ThumbnailRes {
  inputPath!: string;
  outputPath!: string;
  timestamp!: string;

  static of(
    inputPath: string,
    outputPath: string,
    timestamp: string,
  ): ThumbnailRes {
    const res = new ThumbnailRes();
    res.inputPath = inputPath;
    res.outputPath = outputPath;
    res.timestamp = timestamp;
    return res;
  }
}

export class HlsPlaylistRes {
  inputPath!: string;
  outputDirectory!: string;
  playlistPath!: string;
  segmentDuration!: number;

  static of(
    inputPath: string,
    outputDirectory: string,
    playlistPath: string,
    segmentDuration: number,
  ): HlsPlaylistRes {
    const res = new HlsPlaylistRes();
    res.inputPath = inputPath;
    res.outputDirectory = outputDirectory;
    res.playlistPath = playlistPath;
    res.segmentDuration = segmentDuration;
    return res;
  }
}
