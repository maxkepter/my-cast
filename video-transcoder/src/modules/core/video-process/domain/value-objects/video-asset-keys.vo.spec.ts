import { describe, expect, it } from 'vitest';
import { VideoProcessErrorCode } from '../enums/video-process-error-code.enum';
import { VideoProcessException } from '../exceptions/video-process.exception';
import { VideoAssetKeys } from './video-asset-keys.vo';

const WEBHOOK_IGNORED_MARKERS = [
  '/hls/',
  '/thumbnails/',
  '/storyboard/',
  '/previews/',
];

describe('VideoAssetKeys', () => {
  const videoId = 'c0a8012e-0000-4000-8000-000000000001';

  it('builds expected storage key layout under videos/{videoId}/...', () => {
    const keys = VideoAssetKeys.for(videoId);

    expect(keys.hlsPrefix).toBe(`videos/${videoId}/hls/`);
    expect(keys.hlsKey('720p/segment_000.ts')).toBe(
      `videos/${videoId}/hls/720p/segment_000.ts`,
    );
    expect(keys.masterPlaylistKey).toBe(`videos/${videoId}/hls/master.m3u8`);
    expect(keys.thumbnailKey).toBe(
      `videos/${videoId}/thumbnails/thumbnail.jpg`,
    );
    expect(keys.storyboardKey('storyboard.vtt')).toBe(
      `videos/${videoId}/storyboard/storyboard.vtt`,
    );
    expect(keys.storyboardKey('sprite_000.jpg')).toBe(
      `videos/${videoId}/storyboard/sprite_000.jpg`,
    );
    expect(keys.previewKey).toBe(`videos/${videoId}/previews/preview.mp4`);
  });

  it('normalizes Windows backslashes and redundant POSIX segments in hlsKey', () => {
    const keys = VideoAssetKeys.for(videoId);

    expect(keys.hlsKey('720p\\segment_001.ts')).toBe(
      `videos/${videoId}/hls/720p/segment_001.ts`,
    );
    expect(keys.hlsKey('./720p//playlist.m3u8')).toBe(
      `videos/${videoId}/hls/720p/playlist.m3u8`,
    );
  });

  it('ensures every generated key contains a backend webhook-ignored marker', () => {
    const keys = VideoAssetKeys.for(videoId);
    const allKeys = [
      keys.hlsPrefix,
      keys.hlsKey('720p/playlist.m3u8'),
      keys.hlsKey('720p/segment_000.ts'),
      keys.masterPlaylistKey,
      keys.thumbnailKey,
      keys.storyboardKey('storyboard.vtt'),
      keys.storyboardKey('sprite_000.jpg'),
      keys.previewKey,
    ];

    for (const key of allKeys) {
      expect(
        WEBHOOK_IGNORED_MARKERS.some((marker) => key.includes(marker)),
      ).toBe(true);
    }
  });

  it('rejects path traversal and leading slashes in hlsKey', () => {
    const keys = VideoAssetKeys.for(videoId);

    for (const badPath of [
      '',
      '   ',
      '.',
      '/master.m3u8',
      '\\master.m3u8',
      '../source.mp4',
      '720p/../../secret.mp4',
      '720p\\..\\secret.mp4',
    ]) {
      expect(() => keys.hlsKey(badPath)).toThrow(VideoProcessException);
    }
  });

  it('rejects path traversal and separators in storyboardKey', () => {
    const keys = VideoAssetKeys.for(videoId);

    for (const badName of [
      '',
      '   ',
      '../storyboard.vtt',
      'sub/sprite_000.jpg',
      'sub\\sprite_000.jpg',
      '..',
    ]) {
      expect(() => keys.storyboardKey(badName)).toThrow(VideoProcessException);
    }
  });

  it('rejects invalid videoId values', () => {
    for (const badId of [
      '',
      '   ',
      '../escape',
      'foo/bar',
      'foo\\bar',
      'vid 123',
    ]) {
      try {
        VideoAssetKeys.for(badId);
        expect.unreachable(`Expected "${badId}" to throw`);
      } catch (error) {
        expect(error).toBeInstanceOf(VideoProcessException);
        expect((error as VideoProcessException).code).toBe(
          VideoProcessErrorCode.INVALID_MESSAGE,
        );
      }
    }
  });
});
