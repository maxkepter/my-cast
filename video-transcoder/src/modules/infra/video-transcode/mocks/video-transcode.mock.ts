import * as fs from 'fs';
import * as nodePath from 'path';
import { Injectable } from '@nestjs/common';
import {
  CompressionOptions,
  CompressionResult,
  HlsOptions,
  StoryboardOptions,
  StoryboardResult,
  ThumbnailOptions,
  VideoMetadata,
  VideoTranscodeContract,
} from '../contracts/video-transcode.contract';
import { VideoTranscodeException } from '../domain/exceptions/video-transcode.exception';

@Injectable()
export class MockVideoTranscodeService implements VideoTranscodeContract {
  async probe(filePath: string): Promise<VideoMetadata> {
    if (filePath.includes('invalid') || filePath.includes('corrupt')) {
      throw new VideoTranscodeException(
        'Invalid or corrupted media file',
        'PROBE_FAILED',
      );
    }
    if (filePath.includes('no-video')) {
      throw new VideoTranscodeException(
        'File does not contain a valid video stream',
        'INVALID_MEDIA',
      );
    }

    return {
      duration: 120,
      width: 1920,
      height: 1080,
      aspectRatio: '16:9',
      fps: 24,
      bitrate: 4500000,
      videoCodec: 'h264',
      audioCodec: 'aac',
      size: 67500000,
    };
  }

  async validate(filePath: string): Promise<boolean> {
    if (
      filePath.includes('invalid') ||
      filePath.includes('corrupt') ||
      filePath.includes('no-video')
    ) {
      return false;
    }
    return true;
  }

  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    options?: ThumbnailOptions,
  ): Promise<string> {
    if (inputPath.includes('fail')) {
      throw new VideoTranscodeException(
        'Failed to generate thumbnail',
        'THUMBNAIL_FAILED',
      );
    }

    await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(
      outputPath,
      Buffer.from('dummy thumbnail image data'),
    );
    return outputPath;
  }

  async generateStoryboard(
    inputPath: string,
    outputDir: string,
    opt: StoryboardOptions,
  ): Promise<StoryboardResult> {
    if (inputPath.includes('fail')) {
      throw new VideoTranscodeException(
        'Failed to generate storyboard',
        'STORYBOARD_FAILED',
      );
    }

    await fs.promises.mkdir(outputDir, { recursive: true });

    const vttPath = nodePath.join(outputDir, 'storyboard.vtt');
    const spritePath = nodePath.join(outputDir, 'sprite_000.jpg');

    const sampleVtt = [
      'WEBVTT',
      '',
      '00:00:00.000 --> 00:00:02.000',
      'sprite_000.jpg#xywh=0,0,160,90',
      '',
    ].join('\n');

    await fs.promises.writeFile(vttPath, sampleVtt, 'utf-8');
    await fs.promises.writeFile(
      spritePath,
      Buffer.from('dummy sprite image data'),
    );

    return {
      vttPath,
      spritePaths: [spritePath],
    };
  }

  async generatePreview(
    inputPath: string,
    outputPath: string,
    opt?: { durationSec?: number; fps?: number },
  ): Promise<string> {
    if (inputPath.includes('fail')) {
      throw new VideoTranscodeException(
        'Failed to generate preview',
        'PREVIEW_FAILED',
      );
    }

    await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(
      outputPath,
      Buffer.from('dummy preview mp4 data'),
    );
    return outputPath;
  }

  async extractAudio(
    inputPath: string,
    outputPath: string,
    opt?: { format?: 'mp3' | 'aac' | 'wav' },
  ): Promise<string> {
    if (inputPath.includes('fail')) {
      throw new VideoTranscodeException(
        'Failed to extract audio',
        'AUDIO_EXTRACTION_FAILED',
      );
    }

    await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(
      outputPath,
      Buffer.from('dummy audio file data'),
    );
    return outputPath;
  }

  async transcodeHls(
    inputPath: string,
    outputDir: string,
    opt: HlsOptions,
  ): Promise<string> {
    if (inputPath.includes('fail')) {
      throw new VideoTranscodeException(
        'Failed to transcode HLS',
        'HLS_TRANSCODE_FAILED',
      );
    }

    await fs.promises.mkdir(outputDir, { recursive: true });

    const renditions = opt.renditions?.length
      ? opt.renditions
      : [{ resolution: '720p', width: 1280, height: 720, videoBitrate: '2000k', audioBitrate: '128k' as const }];

    for (const rendition of renditions) {
      const renditionDir = nodePath.join(outputDir, rendition.resolution);
      await fs.promises.mkdir(renditionDir, { recursive: true });
      await fs.promises.writeFile(
        nodePath.join(renditionDir, 'playlist.m3u8'),
        `#EXTM3U\n#EXT-X-VERSION:3\n#EXTINF:4.0,\nsegment_000.ts\n#EXT-X-ENDLIST\n`,
      );
      await fs.promises.writeFile(
        nodePath.join(renditionDir, 'segment_000.ts'),
        Buffer.from('dummy ts segment'),
      );
    }

    const masterPath = nodePath.join(outputDir, 'master.m3u8');
    let masterContent = '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-INDEPENDENT-SEGMENTS\n';
    for (const rendition of renditions) {
      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=2128000,RESOLUTION=${rendition.width}x${rendition.height},NAME="${rendition.resolution}"\n`;
      masterContent += `${rendition.resolution}/playlist.m3u8\n`;
    }
    await fs.promises.writeFile(masterPath, masterContent, 'utf-8');

    opt.onProgress?.(100);

    return masterPath;
  }

  async compress(
    inputPath: string,
    outputPath: string,
    opt?: CompressionOptions,
  ): Promise<CompressionResult> {
    if (inputPath.includes('fail')) {
      throw new VideoTranscodeException(
        'Failed to compress video',
        'COMPRESSION_FAILED',
      );
    }

    await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(
      outputPath,
      Buffer.from('dummy compressed video data'),
    );

    opt?.onProgress?.(100);

    return {
      outputPath,
      originalSizeBytes: 104857600,
      compressedSizeBytes: 41943040,
      compressionRatio: 2.5,
    };
  }
}
