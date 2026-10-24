import * as fs from 'fs';
import * as nodePath from 'path';
import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
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

if (ffmpegPath?.path) {
  ffmpeg.setFfmpegPath(ffmpegPath.path);
}
if (ffprobePath?.path) {
  ffmpeg.setFfprobePath(ffprobePath.path);
}

function formatVttTime(seconds: number): string {
  const totalMs = Math.round(seconds * 1000);
  const h = Math.floor(totalMs / 3600000);
  const m = Math.floor((totalMs % 3600000) / 60000);
  const s = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

@Injectable()
export class FfmpegVideoTranscodeService implements VideoTranscodeContract {
  async probe(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error, metadata) => {
        if (error) {
          return reject(
            new VideoTranscodeException(error.message, 'PROBE_FAILED', error),
          );
        }

        const videoStream = metadata.streams?.find(
          (s) => s.codec_type === 'video',
        );
        if (!videoStream) {
          return reject(
            new VideoTranscodeException(
              'File does not contain a valid video stream',
              'INVALID_MEDIA',
            ),
          );
        }

        const width = Number(videoStream.width) || 0;
        const height = Number(videoStream.height) || 0;
        const duration = Number(
          metadata.format?.duration ?? videoStream.duration ?? 0,
        );

        if (duration <= 0 || width <= 0 || height <= 0) {
          return reject(
            new VideoTranscodeException(
              'Invalid video duration or dimensions',
              'INVALID_MEDIA',
            ),
          );
        }

        let fps = 24;
        const rFps = videoStream.r_frame_rate || videoStream.avg_frame_rate;
        if (rFps && typeof rFps === 'string' && rFps.includes('/')) {
          const [num, den] = rFps.split('/').map(Number);
          if (den && !isNaN(num) && !isNaN(den) && den !== 0) {
            fps = Number((num / den).toFixed(3));
          }
        } else if (rFps && !isNaN(Number(rFps))) {
          fps = Number(rFps);
        }

        let aspectRatio = videoStream.display_aspect_ratio;
        if (!aspectRatio || aspectRatio === '0:1' || aspectRatio === 'N/A') {
          const gcd = (a: number, b: number): number =>
            b === 0 ? a : gcd(b, a % b);
          const divisor = gcd(width, height);
          aspectRatio =
            divisor > 0 ? `${width / divisor}:${height / divisor}` : '16:9';
        }

        const audioStream = metadata.streams?.find(
          (s) => s.codec_type === 'audio',
        );
        const bitrate = Number(
          metadata.format?.bit_rate ?? videoStream.bit_rate ?? 0,
        );
        const size = Number(metadata.format?.size ?? 0);

        resolve({
          duration,
          width,
          height,
          aspectRatio,
          fps,
          bitrate,
          videoCodec: videoStream.codec_name ?? 'unknown',
          audioCodec: audioStream?.codec_name ?? 'none',
          size,
        });
      });
    });
  }

  async validate(filePath: string): Promise<boolean> {
    try {
      const metadata = await this.probe(filePath);
      return metadata.duration > 0 && metadata.width > 0 && metadata.height > 0;
    } catch {
      return false;
    }
  }

  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    options?: ThumbnailOptions,
  ): Promise<string> {
    await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });
    const timestamp = options?.timestampSec ?? 1;

    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg(inputPath).seekInput(timestamp).frames(1);

      if (options?.width || options?.height) {
        cmd.size(`${options.width ?? '?'}x${options.height ?? '?'}`);
      }

      cmd
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) =>
          reject(
            new VideoTranscodeException(
              err.message,
              'THUMBNAIL_FAILED',
              err,
            ),
          ),
        );
    });

    return outputPath;
  }

  async generateStoryboard(
    inputPath: string,
    outputDir: string,
    opt: StoryboardOptions,
  ): Promise<StoryboardResult> {
    await fs.promises.mkdir(outputDir, { recursive: true });
    const metadata = await this.probe(inputPath);
    const duration = metadata.duration;
    const totalFrames = Math.max(1, Math.floor(duration / opt.intervalSec));
    const columns = opt.columns;
    const rows = Math.min(10, Math.max(1, Math.ceil(totalFrames / columns)));
    const framesPerSheet = columns * rows;
    const spritePattern = nodePath.join(outputDir, 'sprite_%03d.jpg');

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf fps=1/${opt.intervalSec},scale=${opt.width}:${opt.height},tile=${columns}x${rows}`,
        ])
        .save(spritePattern)
        .on('end', () => resolve())
        .on('error', (err: Error) =>
          reject(
            new VideoTranscodeException(
              err.message,
              'STORYBOARD_FAILED',
              err,
            ),
          ),
        );
    });

    let vttContent = 'WEBVTT\n\n';
    for (let i = 0; i < totalFrames; i++) {
      const startSec = i * opt.intervalSec;
      const endSec = Math.min(duration, (i + 1) * opt.intervalSec);
      const sheetIndex = Math.floor(i / framesPerSheet);
      const frameInSheet = i % framesPerSheet;
      const col = frameInSheet % columns;
      const row = Math.floor(frameInSheet / columns);
      const x = col * opt.width;
      const y = row * opt.height;
      const spriteFile = `sprite_${String(sheetIndex).padStart(3, '0')}.jpg`;

      vttContent += `${formatVttTime(startSec)} --> ${formatVttTime(endSec)}\n`;
      vttContent += `${spriteFile}#xywh=${x},${y},${opt.width},${opt.height}\n\n`;
    }

    const vttPath = nodePath.join(outputDir, 'storyboard.vtt');
    await fs.promises.writeFile(vttPath, vttContent, 'utf-8');

    const dirEntries = await fs.promises.readdir(outputDir);
    const spritePaths = dirEntries
      .filter((f) => /^sprite_\d+\.jpg$/.test(f))
      .sort()
      .map((f) => nodePath.join(outputDir, f));

    return { vttPath, spritePaths };
  }

  async generatePreview(
    inputPath: string,
    outputPath: string,
    opt?: { durationSec?: number; fps?: number },
  ): Promise<string> {
    await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });
    const durationSec = opt?.durationSec ?? 4;
    const fps = opt?.fps ?? 15;

    const metadata = await this.probe(inputPath).catch(() => null);
    const startTime = metadata
      ? Math.max(0, Math.floor(metadata.duration / 4))
      : 0;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(startTime)
        .duration(durationSec)
        .fps(fps)
        .noAudio()
        .videoCodec('libx264')
        .outputOptions([
          '-preset veryfast',
          '-crf 26',
          '-vf scale=min(480\\,iw):-2',
          '-movflags +faststart',
        ])
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) =>
          reject(
            new VideoTranscodeException(
              err.message,
              'PREVIEW_FAILED',
              err,
            ),
          ),
        );
    });

    return outputPath;
  }

  async extractAudio(
    inputPath: string,
    outputPath: string,
    opt?: { format?: 'mp3' | 'aac' | 'wav' },
  ): Promise<string> {
    await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });
    const format = opt?.format ?? 'mp3';

    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg(inputPath).noVideo();
      if (format === 'mp3') {
        cmd.audioCodec('libmp3lame').audioBitrate('192k');
      } else if (format === 'aac') {
        cmd.audioCodec('aac').audioBitrate('192k');
      } else if (format === 'wav') {
        cmd.audioCodec('pcm_s16le');
      }

      cmd
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) =>
          reject(
            new VideoTranscodeException(
              err.message,
              'AUDIO_EXTRACTION_FAILED',
              err,
            ),
          ),
        );
    });

    return outputPath;
  }

  async transcodeHls(
    inputPath: string,
    outputDir: string,
    opt: HlsOptions,
  ): Promise<string> {
    await fs.promises.mkdir(outputDir, { recursive: true });
    const segmentDuration = opt.segmentDuration ?? 4;
    const totalRenditions = opt.renditions.length;

    for (let idx = 0; idx < totalRenditions; idx++) {
      const rendition = opt.renditions[idx];
      const renditionDir = nodePath.join(outputDir, rendition.resolution);
      await fs.promises.mkdir(renditionDir, { recursive: true });

      const renditionPlaylist = nodePath.join(renditionDir, 'playlist.m3u8');
      const segmentPattern = nodePath.join(renditionDir, 'segment_%03d.ts');
      const vBitrateK = parseInt(rendition.videoBitrate, 10) || 1000;

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-preset veryfast',
            `-vf scale=${rendition.width}:${rendition.height}`,
            `-b:v ${rendition.videoBitrate}`,
            `-maxrate ${rendition.videoBitrate}`,
            `-bufsize ${vBitrateK * 2}k`,
            `-b:a ${rendition.audioBitrate}`,
            '-f hls',
            `-hls_time ${segmentDuration}`,
            '-hls_playlist_type vod',
            `-hls_segment_filename ${segmentPattern}`,
          ])
          .on('progress', (progress) => {
            if (opt.onProgress && progress?.percent != null) {
              const renditionPercent = Math.min(
                100,
                Math.max(0, progress.percent),
              );
              const overall = Math.round(
                ((idx + renditionPercent / 100) / totalRenditions) * 100,
              );
              opt.onProgress(overall);
            }
          })
          .save(renditionPlaylist)
          .on('end', () => resolve())
          .on('error', (err: Error) =>
            reject(
              new VideoTranscodeException(
                err.message,
                'HLS_TRANSCODE_FAILED',
                err,
              ),
            ),
          );
      });
    }

    let masterContent =
      '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-INDEPENDENT-SEGMENTS\n';
    for (const rendition of opt.renditions) {
      const vBitrate = (parseInt(rendition.videoBitrate, 10) || 1000) * 1000;
      const aBitrate = (parseInt(rendition.audioBitrate, 10) || 128) * 1000;
      const bandwidth = vBitrate + aBitrate;

      masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${rendition.width}x${rendition.height},NAME="${rendition.resolution}"\n`;
      masterContent += `${rendition.resolution}/playlist.m3u8\n`;
    }

    const masterPath = nodePath.join(outputDir, 'master.m3u8');
    await fs.promises.writeFile(masterPath, masterContent, 'utf-8');
    opt.onProgress?.(100);

    return masterPath;
  }

  async compress(
    inputPath: string,
    outputPath: string,
    opt?: CompressionOptions,
  ): Promise<CompressionResult> {
    await fs.promises.mkdir(nodePath.dirname(outputPath), { recursive: true });
    const originalSizeBytes = (await fs.promises.stat(inputPath)).size;

    let vCodec = 'libx264';
    if (opt?.codec === 'h265') vCodec = 'libx265';
    else if (opt?.codec === 'av1') vCodec = 'libsvtav1';

    const preset = opt?.preset ?? 'medium';
    const audioBitrate = opt?.audioBitrate ?? '128k';
    const outputOptions: string[] = [`-preset ${preset}`];

    if (opt?.targetSizeMb) {
      const metadata = await this.probe(inputPath);
      const duration = metadata.duration || 1;
      const targetBits = opt.targetSizeMb * 8 * 1024 * 1024;
      const totalBitrateBps = targetBits / duration;
      const aBitrateBps = (parseInt(audioBitrate, 10) || 128) * 1000;
      const vBitrateBps = Math.max(
        100000,
        Math.floor(totalBitrateBps - aBitrateBps),
      );
      const vBitrateK = Math.floor(vBitrateBps / 1000);

      outputOptions.push(`-b:v ${vBitrateK}k`);
      outputOptions.push(`-maxrate ${Math.floor(vBitrateK * 1.5)}k`);
      outputOptions.push(`-bufsize ${vBitrateK * 2}k`);
    } else {
      const crf = opt?.crf ?? 23;
      outputOptions.push(`-crf ${crf}`);
      if (opt?.maxBitrate) {
        outputOptions.push(`-maxrate ${opt.maxBitrate}`);
        const maxNumeric = parseInt(opt.maxBitrate, 10);
        if (maxNumeric) outputOptions.push(`-bufsize ${maxNumeric * 2}k`);
      }
    }

    if (opt?.scale) {
      const w = opt.scale.width ?? -2;
      const h = opt.scale.height ?? -2;
      outputOptions.push(`-vf scale=${w}:${h}`);
    }

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec(vCodec)
        .audioCodec('aac')
        .audioBitrate(audioBitrate)
        .outputOptions(outputOptions)
        .on('progress', (progress) => {
          if (opt?.onProgress && progress?.percent != null) {
            opt.onProgress(
              Math.min(100, Math.max(0, Math.round(progress.percent))),
            );
          }
        })
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) =>
          reject(
            new VideoTranscodeException(
              err.message,
              'COMPRESSION_FAILED',
              err,
            ),
          ),
        );
    });

    const compressedSizeBytes = (await fs.promises.stat(outputPath)).size;
    const compressionRatio =
      compressedSizeBytes > 0
        ? Number((originalSizeBytes / compressedSizeBytes).toFixed(2))
        : 1;

    opt?.onProgress?.(100);

    return {
      outputPath,
      originalSizeBytes,
      compressedSizeBytes,
      compressionRatio,
    };
  }
}
