import * as fsPromises from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoTranscodeException } from '../domain/exceptions/video-transcode.exception';
import { FfmpegVideoTranscodeService } from './ffmpeg-video-transcode.service';

const { mockFfprobe, mockFfmpegCommand, mockFfmpeg } = vi.hoisted(() => {
  const mockFfprobe = vi.fn();
  const mockFfmpegCommand = {
    seekInput: vi.fn().mockReturnThis(),
    frames: vi.fn().mockReturnThis(),
    size: vi.fn().mockReturnThis(),
    duration: vi.fn().mockReturnThis(),
    fps: vi.fn().mockReturnThis(),
    noAudio: vi.fn().mockReturnThis(),
    noVideo: vi.fn().mockReturnThis(),
    videoCodec: vi.fn().mockReturnThis(),
    audioCodec: vi.fn().mockReturnThis(),
    audioBitrate: vi.fn().mockReturnThis(),
    outputOptions: vi.fn().mockReturnThis(),
    save: vi.fn().mockReturnThis(),
    on: vi.fn().mockImplementation(function (
      this: any,
      event: string,
      callback: Function,
    ) {
      if (event === 'end') {
        setTimeout(() => callback(), 5);
      }
      return this;
    }),
  };

  const mockFfmpeg = vi.fn(() => ({ ...mockFfmpegCommand }));
  (mockFfmpeg as any).ffprobe = mockFfprobe;
  (mockFfmpeg as any).setFfmpegPath = vi.fn();
  (mockFfmpeg as any).setFfprobePath = vi.fn();

  return { mockFfprobe, mockFfmpegCommand, mockFfmpeg };
});

vi.mock('fluent-ffmpeg', () => ({
  default: mockFfmpeg,
}));

describe('FfmpegVideoTranscodeService', () => {
  let service: FfmpegVideoTranscodeService;
  let tempDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    service = new FfmpegVideoTranscodeService();
    tempDir = path.join(
      os.tmpdir(),
      `test-transcode-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    );
    await fsPromises.mkdir(tempDir, { recursive: true });
  });

  describe('probe', () => {
    it('should return valid VideoMetadata when video has valid streams', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: {
            duration: 60,
            bit_rate: 2000000,
            size: 15000000,
          },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1',
              display_aspect_ratio: '16:9',
            },
            {
              codec_type: 'audio',
              codec_name: 'aac',
            },
          ],
        });
      });

      const result = await service.probe('test.mp4');
      expect(result).toEqual({
        duration: 60,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        fps: 30,
        bitrate: 2000000,
        videoCodec: 'h264',
        audioCodec: 'aac',
        size: 15000000,
      });
    });

    it('should calculate aspect ratio with GCD if display_aspect_ratio is missing', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: { duration: 10, size: 5000 },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1280,
              height: 720,
              r_frame_rate: '24/1',
            },
          ],
        });
      });

      const result = await service.probe('test.mp4');
      expect(result.aspectRatio).toBe('16:9');
      expect(result.fps).toBe(24);
      expect(result.audioCodec).toBe('none');
    });

    it('should throw VideoTranscodeException with INVALID_MEDIA if no video stream', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: { duration: 10 },
          streams: [{ codec_type: 'audio', codec_name: 'aac' }],
        });
      });

      await expect(service.probe('audio-only.mp3')).rejects.toThrow(
        VideoTranscodeException,
      );
      await expect(service.probe('audio-only.mp3')).rejects.toMatchObject({
        code: 'INVALID_MEDIA',
      });
    });

    it('should throw VideoTranscodeException with PROBE_FAILED if ffprobe fails', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(new Error('ffprobe execution failed'));
      });

      await expect(service.probe('broken.mp4')).rejects.toThrow(
        VideoTranscodeException,
      );
      await expect(service.probe('broken.mp4')).rejects.toMatchObject({
        code: 'PROBE_FAILED',
      });
    });
  });

  describe('validate', () => {
    it('should return true for valid video', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: { duration: 10, size: 1000 },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 640,
              height: 480,
              r_frame_rate: '25/1',
            },
          ],
        });
      });

      const isValid = await service.validate('valid.mp4');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid media without throwing', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(new Error('Corrupt file'));
      });

      const isValid = await service.validate('corrupt.mp4');
      expect(isValid).toBe(false);
    });
  });

  describe('generateThumbnail', () => {
    it('should invoke ffmpeg and return outputPath', async () => {
      const outputPath = path.join(tempDir, 'thumb.jpg');
      const result = await service.generateThumbnail('input.mp4', outputPath, {
        timestampSec: 2,
        width: 320,
        height: 240,
      });

      expect(result).toBe(outputPath);
      expect(mockFfmpeg).toHaveBeenCalledWith('input.mp4');
    });

    it('should wrap ffmpeg error into THUMBNAIL_FAILED exception', async () => {
      mockFfmpeg.mockImplementationOnce(() => ({
        ...mockFfmpegCommand,
        on: vi.fn().mockImplementation(function (
          this: any,
          event: string,
          callback: Function,
        ) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Thumbnail failed')), 5);
          }
          return this;
        }),
      }));

      await expect(
        service.generateThumbnail(
          'input.mp4',
          path.join(tempDir, 'thumb-fail.jpg'),
        ),
      ).rejects.toMatchObject({ code: 'THUMBNAIL_FAILED' });
    });
  });

  describe('generateStoryboard', () => {
    it('should generate sprite sheet and webvtt mapping', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: { duration: 10, size: 1000 },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1280,
              height: 720,
              r_frame_rate: '30/1',
            },
          ],
        });
      });

      // Mock sprite creation on disk
      await fsPromises.writeFile(
        path.join(tempDir, 'sprite_000.jpg'),
        'fake sprite image',
      );

      const result = await service.generateStoryboard('input.mp4', tempDir, {
        intervalSec: 2,
        width: 160,
        height: 90,
        columns: 5,
      });

      expect(result.vttPath).toBe(path.join(tempDir, 'storyboard.vtt'));
      expect(result.spritePaths.length).toBe(1);

      const vttContent = await fsPromises.readFile(result.vttPath, 'utf-8');
      expect(vttContent).toContain('WEBVTT');
      expect(vttContent).toContain('sprite_000.jpg#xywh=0,0,160,90');
    });

    it('should throw STORYBOARD_FAILED if ffmpeg fails during sprite rendering', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: { duration: 10, size: 1000 },
          streams: [
            {
              codec_type: 'video',
              codec_name: 'h264',
              width: 1280,
              height: 720,
              r_frame_rate: '30/1',
            },
          ],
        });
      });

      mockFfmpeg.mockImplementationOnce(() => ({
        ...mockFfmpegCommand,
        on: vi.fn().mockImplementation(function (
          this: any,
          event: string,
          callback: Function,
        ) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Filtergraph error')), 5);
          }
          return this;
        }),
      }));

      await expect(
        service.generateStoryboard('input.mp4', tempDir, {
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
    it('should generate silent preview and return outputPath', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: { duration: 20 },
          streams: [{ codec_type: 'video', width: 1280, height: 720 }],
        });
      });

      const previewPath = path.join(tempDir, 'preview.mp4');
      const result = await service.generatePreview('input.mp4', previewPath, {
        durationSec: 3,
        fps: 12,
      });

      expect(result).toBe(previewPath);
      expect(mockFfmpeg).toHaveBeenCalledWith('input.mp4');
    });

    it('should throw PREVIEW_FAILED when ffmpeg preview rendering fails', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: { duration: 20 },
          streams: [{ codec_type: 'video', width: 1280, height: 720 }],
        });
      });

      mockFfmpeg.mockImplementationOnce(() => ({
        ...mockFfmpegCommand,
        on: vi.fn().mockImplementation(function (
          this: any,
          event: string,
          callback: Function,
        ) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Preview render failure')), 5);
          }
          return this;
        }),
      }));

      await expect(
        service.generatePreview('input.mp4', path.join(tempDir, 'preview-fail.mp4')),
      ).rejects.toMatchObject({
        code: 'PREVIEW_FAILED',
      });
    });
  });

  describe('extractAudio', () => {
    it('should extract mp3 audio successfully', async () => {
      const audioPath = path.join(tempDir, 'audio.mp3');
      const result = await service.extractAudio('input.mp4', audioPath, {
        format: 'mp3',
      });
      expect(result).toBe(audioPath);
    });

    it('should extract aac audio successfully', async () => {
      const audioPath = path.join(tempDir, 'audio.aac');
      const result = await service.extractAudio('input.mp4', audioPath, {
        format: 'aac',
      });
      expect(result).toBe(audioPath);
    });

    it('should extract wav audio successfully', async () => {
      const audioPath = path.join(tempDir, 'audio.wav');
      const result = await service.extractAudio('input.mp4', audioPath, {
        format: 'wav',
      });
      expect(result).toBe(audioPath);
    });

    it('should throw AUDIO_EXTRACTION_FAILED on ffmpeg failure', async () => {
      mockFfmpeg.mockImplementationOnce(() => ({
        ...mockFfmpegCommand,
        on: vi.fn().mockImplementation(function (
          this: any,
          event: string,
          callback: Function,
        ) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Audio stream error')), 5);
          }
          return this;
        }),
      }));

      await expect(
        service.extractAudio('input.mp4', path.join(tempDir, 'audio-fail.mp3')),
      ).rejects.toMatchObject({
        code: 'AUDIO_EXTRACTION_FAILED',
      });
    });
  });

  describe('transcodeHls', () => {
    it('should transcode multi-rendition HLS and generate master.m3u8', async () => {
      const onProgress = vi.fn();
      const outputHlsDir = path.join(tempDir, 'hls');

      const masterPath = await service.transcodeHls('input.mp4', outputHlsDir, {
        segmentDuration: 4,
        renditions: [
          {
            resolution: '720p',
            width: 1280,
            height: 720,
            videoBitrate: '2000k',
            audioBitrate: '128k',
          },
          {
            resolution: '360p',
            width: 640,
            height: 360,
            videoBitrate: '800k',
            audioBitrate: '96k',
          },
        ],
        onProgress,
      });

      expect(masterPath).toBe(path.join(outputHlsDir, 'master.m3u8'));
      const masterContent = await fsPromises.readFile(masterPath, 'utf-8');
      expect(masterContent).toContain('#EXTM3U');
      expect(masterContent).toContain('720p/playlist.m3u8');
      expect(masterContent).toContain('360p/playlist.m3u8');
      expect(onProgress).toHaveBeenCalledWith(100);
    });

    it('should throw HLS_TRANSCODE_FAILED on ffmpeg error during rendition segmenting', async () => {
      mockFfmpeg.mockImplementationOnce(() => ({
        ...mockFfmpegCommand,
        on: vi.fn().mockImplementation(function (
          this: any,
          event: string,
          callback: Function,
        ) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Segment creation failed')), 5);
          }
          return this;
        }),
      }));

      await expect(
        service.transcodeHls('input.mp4', path.join(tempDir, 'hls-fail'), {
          renditions: [
            {
              resolution: '720p',
              width: 1280,
              height: 720,
              videoBitrate: '2000k',
              audioBitrate: '128k',
            },
          ],
        }),
      ).rejects.toMatchObject({
        code: 'HLS_TRANSCODE_FAILED',
      });
    });
  });

  describe('compress', () => {
    it('should compress video with CRF mode', async () => {
      const inputPath = path.join(tempDir, 'orig.mp4');
      const outputPath = path.join(tempDir, 'comp.mp4');
      await fsPromises.writeFile(inputPath, Buffer.alloc(1000));
      await fsPromises.writeFile(outputPath, Buffer.alloc(400));

      const result = await service.compress(inputPath, outputPath, {
        crf: 28,
        preset: 'veryfast',
      });

      expect(result.originalSizeBytes).toBe(1000);
      expect(result.compressedSizeBytes).toBe(400);
      expect(result.compressionRatio).toBe(2.5);
    });

    it('should compress video with targetSizeMb mode', async () => {
      mockFfprobe.mockImplementation((filePath, callback) => {
        callback(null, {
          format: { duration: 60, size: 50000000 },
          streams: [{ codec_type: 'video', width: 1920, height: 1080 }],
        });
      });

      const inputPath = path.join(tempDir, 'orig-target.mp4');
      const outputPath = path.join(tempDir, 'comp-target.mp4');
      await fsPromises.writeFile(inputPath, Buffer.alloc(2000));
      await fsPromises.writeFile(outputPath, Buffer.alloc(1000));

      const result = await service.compress(inputPath, outputPath, {
        targetSizeMb: 10,
      });

      expect(result.compressionRatio).toBe(2);
    });

    it('should throw COMPRESSION_FAILED when ffmpeg compression fails', async () => {
      const inputPath = path.join(tempDir, 'orig-fail.mp4');
      const outputPath = path.join(tempDir, 'comp-fail.mp4');
      await fsPromises.writeFile(inputPath, Buffer.alloc(1000));

      mockFfmpeg.mockImplementationOnce(() => ({
        ...mockFfmpegCommand,
        on: vi.fn().mockImplementation(function (
          this: any,
          event: string,
          callback: Function,
        ) {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Encoder crashed')), 5);
          }
          return this;
        }),
      }));

      await expect(
        service.compress(inputPath, outputPath, { crf: 23 }),
      ).rejects.toMatchObject({
        code: 'COMPRESSION_FAILED',
      });
    });
  });
});
