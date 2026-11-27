import type { HlsRendition } from '../../../../infra/video-transcode';
import { VideoProcessErrorCode } from '../enums/video-process-error-code.enum';
import { VideoProcessException } from '../exceptions/video-process.exception';

export interface RenditionRung {
  readonly resolution: HlsRendition['resolution'];
  readonly height: number;
  readonly videoBitrate: string;
  readonly audioBitrate: string;
}

function toEvenDimension(value: number): number {
  const rounded = Math.round(value);
  const even = rounded % 2 === 0 ? rounded : rounded + 1;
  return Math.max(2, even);
}

export class HlsRenditionLadder {
  static readonly DEFAULT = new HlsRenditionLadder([
    {
      resolution: '1080p',
      height: 1080,
      videoBitrate: '5000k',
      audioBitrate: '192k',
    },
    {
      resolution: '720p',
      height: 720,
      videoBitrate: '2800k',
      audioBitrate: '128k',
    },
    {
      resolution: '480p',
      height: 480,
      videoBitrate: '1400k',
      audioBitrate: '128k',
    },
    {
      resolution: '360p',
      height: 360,
      videoBitrate: '800k',
      audioBitrate: '96k',
    },
  ]);

  private readonly rungs: readonly RenditionRung[];

  constructor(rungs: readonly RenditionRung[]) {
    if (!rungs.length) {
      throw new VideoProcessException(
        'HLS rendition ladder must contain at least one rung',
        VideoProcessErrorCode.INVALID_MEDIA,
      );
    }
    this.rungs = [...rungs].sort((a, b) => b.height - a.height);
  }

  select(metadata: { width: number; height: number }): HlsRendition[] {
    if (
      !Number.isFinite(metadata.width) ||
      !Number.isFinite(metadata.height) ||
      metadata.width <= 0 ||
      metadata.height <= 0
    ) {
      throw new VideoProcessException(
        'Invalid video dimensions for rendition selection',
        VideoProcessErrorCode.INVALID_MEDIA,
      );
    }

    const eligible = this.rungs.filter(
      (rung) => rung.height <= metadata.height,
    );
    const chosen =
      eligible.length > 0 ? eligible : [this.rungs[this.rungs.length - 1]];

    return chosen.map((rung) => ({
      resolution: rung.resolution,
      width: toEvenDimension((rung.height * metadata.width) / metadata.height),
      height: rung.height,
      videoBitrate: rung.videoBitrate,
      audioBitrate: rung.audioBitrate,
    }));
  }
}
