import * as fs from 'fs';
import * as nodePath from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MockVideoTranscodeService } from './video-transcode.mock';
import { VideoTranscodeException } from '../domain/exceptions/video-transcode.exception';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readdir: vi.fn().mockResolvedValue(['sprite_000.jpg']),
    },
  };
});

describe('MockVideoTranscodeService', () => {
  let mockService: MockVideoTranscodeService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockService = new MockVideoTranscodeService();
  });

  describe('probe', () => {
    it('should return standard mocked metadata', async () => {
      const meta = await mockService.probe('/valid/path/video.mp4');
      expect(meta).toEqual({
        duration: 120,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        fps: 24,
        bitrate: 4500000,
        videoCodec: 'h264',
        audioCodec: 'aac',
        size: 67500000,
      });
    });

    it('should throw PROBE_FAILED when path has invalid or corrupt', async () => {
      await expect(mockService.probe('/path/invalid.mp4')).rejects.toThrow(
        VideoTranscodeException,
      );
      await expect(mockService.probe('/path/corrupt.mp4')).rejects.toMatchObject({
        code: 'PROBE_FAILED',
      });
    });

    it('should throw INVALID_MEDIA when path has no-video', async () => {
      await expect(mockService.probe('/path/no-video.mp4')).rejects.toMatchObject({
        code: 'INVALID_MEDIA',
      });
    });
  });

  describe('validate', () => {
    it('should return true for normal files', async () => {
      const isValid = await mockService.validate('/path/video.mp4');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid files', async () => {
      expect(await mockService.validate('/path/invalid.mp4')).toBe(false);
      expect(await mockService.validate('/path/corrupt.mp4')).toBe(false);
      expect(await mockService.validate('/path/no-video.mp4')).toBe(false);
    });
  });

  describe('generateThumbnail', () => {
    it('should create dummy thumbnail file and return outputPath', async () => {
      const out = '/tmp/thumb.jpg';
      const result = await mockService.generateThumbnail('/video.mp4', out);
      expect(fs.promises.mkdir).toHaveBeenCalledWith(nodePath.dirname(out), {
        recursive: true,
      });
      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(result).toBe(out);
    });

    it('should throw THUMBNAIL_FAILED when input contains fail', async () => {
      await expect(
        mockService.generateThumbnail('/fail-video.mp4', '/tmp/thumb.jpg'),
      ).rejects.toMatchObject({
        code: 'THUMBNAIL_FAILED',
      });
    });
  });

  describe('generateStoryboard', () => {
    it('should create dummy vtt and sprite sheet', async () => {
      const result = await mockService.generateStoryboard(
        '/video.mp4',
        '/tmp/sb',
        {
          intervalSec: 2,
          width: 160,
          height: 90,
          columns: 5,
        },
      );
      expect(result.vttPath).toBe(nodePath.join('/tmp/sb', 'storyboard.vtt'));
      expect(result.spritePaths).toEqual([
        nodePath.join('/tmp/sb', 'sprite_000.jpg'),
      ]);
    });

    it('should throw STORYBOARD_FAILED when input contains fail', async () => {
      await expect(
        mockService.generateStoryboard('/fail.mp4', '/tmp/sb', {
          intervalSec: 2,
          width: 160,
          height: 90,
          columns: 5,
        }),
      ).rejects.toMatchObject({
        code: 'STORYBOARD_FAILED',
      });
    });
  });

  describe('generatePreview', () => {
    it('should create preview and return outputPath', async () => {
      const out = '/tmp/preview.mp4';
      const result = await mockService.generatePreview('/video.mp4', out);
      expect(result).toBe(out);
    });
  });

  describe('extractAudio', () => {
    it('should extract audio and return outputPath', async () => {
      const out = '/tmp/audio.mp3';
      const result = await mockService.extractAudio('/video.mp4', out);
      expect(result).toBe(out);
    });
  });

  describe('transcodeHls', () => {
    it('should create master and rendition playlists', async () => {
      const onProgress = vi.fn();
      const result = await mockService.transcodeHls('/video.mp4', '/tmp/hls', {
        renditions: [
          {
            resolution: '720p',
            width: 1280,
            height: 720,
            videoBitrate: '2000k',
            audioBitrate: '128k',
          },
        ],
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(100);
      expect(result).toBe(nodePath.join('/tmp/hls', 'master.m3u8'));
    });
  });

  describe('compress', () => {
    it('should return mock compression metrics', async () => {
      const onProgress = vi.fn();
      const result = await mockService.compress(
        '/video.mp4',
        '/tmp/comp.mp4',
        { onProgress },
      );

      expect(onProgress).toHaveBeenCalledWith(100);
      expect(result).toEqual({
        outputPath: '/tmp/comp.mp4',
        originalSizeBytes: 104857600,
        compressedSizeBytes: 41943040,
        compressionRatio: 2.5,
      });
    });
  });
});
