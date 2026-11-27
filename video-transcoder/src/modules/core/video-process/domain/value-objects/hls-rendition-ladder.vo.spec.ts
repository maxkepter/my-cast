import { describe, expect, it } from 'vitest';
import { VideoProcessErrorCode } from '../enums/video-process-error-code.enum';
import { VideoProcessException } from '../exceptions/video-process.exception';
import { HlsRenditionLadder } from './hls-rendition-ladder.vo';

describe('HlsRenditionLadder', () => {
  it('selects all 4 rungs ordered high to low for a 1080p 16:9 source', () => {
    const renditions = HlsRenditionLadder.DEFAULT.select({
      width: 1920,
      height: 1080,
    });

    expect(renditions).toEqual([
      {
        resolution: '1080p',
        width: 1920,
        height: 1080,
        videoBitrate: '5000k',
        audioBitrate: '192k',
      },
      {
        resolution: '720p',
        width: 1280,
        height: 720,
        videoBitrate: '2800k',
        audioBitrate: '128k',
      },
      {
        resolution: '480p',
        width: 854,
        height: 480,
        videoBitrate: '1400k',
        audioBitrate: '128k',
      },
      {
        resolution: '360p',
        width: 640,
        height: 360,
        videoBitrate: '800k',
        audioBitrate: '96k',
      },
    ]);
  });

  it('caps a 4K source at 1080p and includes all 4 default rungs', () => {
    const renditions = HlsRenditionLadder.DEFAULT.select({
      width: 3840,
      height: 2160,
    });

    expect(renditions.map((r) => r.resolution)).toEqual([
      '1080p',
      '720p',
      '480p',
      '360p',
    ]);
  });

  it('selects 3 rungs (720p, 480p, 360p) for a 720p source', () => {
    const renditions = HlsRenditionLadder.DEFAULT.select({
      width: 1280,
      height: 720,
    });

    expect(renditions.map((r) => r.resolution)).toEqual([
      '720p',
      '480p',
      '360p',
    ]);
    expect(renditions[0].width).toBe(1280);
    expect(renditions[1].width).toBe(854);
    expect(renditions[2].width).toBe(640);
  });

  it('falls back to [360p] when source height is below 360p (240p)', () => {
    const renditions = HlsRenditionLadder.DEFAULT.select({
      width: 426,
      height: 240,
    });

    expect(renditions).toHaveLength(1);
    expect(renditions[0].resolution).toBe('360p');
    expect(renditions[0].height).toBe(360);
    expect(renditions[0].width % 2).toBe(0);
    expect(renditions[0].width).toBe(640);
  });

  it('preserves portrait aspect ratio with even positive widths for 1080x1920', () => {
    const renditions = HlsRenditionLadder.DEFAULT.select({
      width: 1080,
      height: 1920,
    });

    expect(renditions.map((r) => r.resolution)).toEqual([
      '1080p',
      '720p',
      '480p',
      '360p',
    ]);

    const sourceAspect = 1080 / 1920;
    for (const r of renditions) {
      expect(r.width).toBeGreaterThanOrEqual(2);
      expect(r.width % 2).toBe(0);
      expect(r.width).toBeLessThan(r.height);
      expect(Math.abs(r.width / r.height - sourceAspect)).toBeLessThan(0.01);
    }
  });

  it('clamps ultra-narrow aspect ratio width to at least 2 (even)', () => {
    const renditions = HlsRenditionLadder.DEFAULT.select({
      width: 1,
      height: 1000,
    });

    for (const r of renditions) {
      expect(r.width).toBeGreaterThanOrEqual(2);
      expect(r.width % 2).toBe(0);
    }
  });

  it('sorts custom rungs from high to low height', () => {
    const ladder = new HlsRenditionLadder([
      {
        resolution: '360p',
        height: 360,
        videoBitrate: '800k',
        audioBitrate: '96k',
      },
      {
        resolution: '720p',
        height: 720,
        videoBitrate: '2800k',
        audioBitrate: '128k',
      },
    ]);

    const renditions = ladder.select({ width: 1280, height: 720 });
    expect(renditions.map((r) => r.resolution)).toEqual(['720p', '360p']);
  });

  it('throws INVALID_MEDIA on invalid dimensions or empty ladder', () => {
    expect(() =>
      HlsRenditionLadder.DEFAULT.select({ width: 0, height: 720 }),
    ).toThrow(VideoProcessException);
    expect(() =>
      HlsRenditionLadder.DEFAULT.select({ width: 1280, height: -1 }),
    ).toThrow(VideoProcessException);
    expect(() =>
      HlsRenditionLadder.DEFAULT.select({ width: Number.NaN, height: 720 }),
    ).toThrow(VideoProcessException);

    try {
      new HlsRenditionLadder([]);
      expect.unreachable('Expected empty ladder to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(VideoProcessException);
      expect((error as VideoProcessException).code).toBe(
        VideoProcessErrorCode.INVALID_MEDIA,
      );
    }
  });
});
