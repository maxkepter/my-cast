import * as nodePath from 'path';
import { Injectable } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import {
  ExtractAudioReq,
  GenerateHlsReq,
  GenerateThumbnailReq,
  GetVideoMetadataReq,
  VideoCompressionReq,
  VideoTranscodeReq,
} from '../../../dtos/req.dto';
import {
  HlsPlaylistRes,
  ThumbnailRes,
  VideoMetadataRes,
  VideoProcessRes,
} from '../../../dtos/res.dto';
import { VideoProcessingService } from '../../../application/interfaces/video-processing.interface';

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

/** Wrap fluent-ffmpeg 'end' event (emits stdout/stderr) into Promise<void> */
function runCommand(cmd: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    cmd
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err));
  });
}

@Injectable()
export class FfmpegService implements VideoProcessingService {
  async transcodeVideo(request: VideoTranscodeReq): Promise<VideoProcessRes> {
    const command = ffmpeg(request.inputPath);

    if (request.videoCodec) command.videoCodec(request.videoCodec);
    if (request.audioCodec) command.audioCodec(request.audioCodec);
    if (request.videoBitrate) command.videoBitrate(request.videoBitrate);
    if (request.audioBitrate) command.audioBitrate(request.audioBitrate);
    if (request.width || request.height) {
      command.size(`${request.width ?? '?'}x${request.height ?? '?'}`);
    }
    if (request.frameRate) command.fps(request.frameRate);
    if (request.format) command.format(request.format);

    await runCommand(command.save(request.outputPath));
    return VideoProcessRes.of(request.inputPath, request.outputPath);
  }

  async compressVideo(request: VideoCompressionReq): Promise<VideoProcessRes> {
    const command = ffmpeg(request.inputPath)
      .videoCodec('libx264')
      .outputOptions([`-crf ${request.crf}`, `-preset ${request.preset}`])
      .audioBitrate(request.audioBitrate)
      .save(request.outputPath);

    await runCommand(command);
    return VideoProcessRes.of(request.inputPath, request.outputPath);
  }

  async extractAudio(request: ExtractAudioReq): Promise<VideoProcessRes> {
    const command = ffmpeg(request.inputPath)
      .noVideo()
      .audioCodec(request.audioCodec)
      .audioBitrate(request.audioBitrate)
      .save(request.outputPath);

    await runCommand(command);
    return VideoProcessRes.of(request.inputPath, request.outputPath);
  }

  async generateThumbnail(request: GenerateThumbnailReq): Promise<ThumbnailRes> {
    const folder = nodePath.dirname(request.outputPath);
    const filename = nodePath.basename(request.outputPath);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(request.inputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .screenshots({
          timestamps: [request.timestamp],
          filename,
          folder,
          ...(request.size ? { size: request.size } : {}),
        });
    });

    return ThumbnailRes.of(request.inputPath, request.outputPath, request.timestamp);
  }

  async generateHls(request: GenerateHlsReq): Promise<HlsPlaylistRes> {
    const playlistPath = nodePath.join(request.outputDirectory, request.playlistName);

    const command = ffmpeg(request.inputPath)
      .outputOptions([
        '-preset veryfast',
        '-codec:v libx264',
        '-codec:a aac',
        '-f hls',
        `-hls_time ${request.segmentDuration}`,
        '-hls_playlist_type vod',
      ])
      .save(playlistPath);

    await runCommand(command);
    return HlsPlaylistRes.of(
      request.inputPath,
      request.outputDirectory,
      playlistPath,
      request.segmentDuration,
    );
  }

  async getMetadata(request: GetVideoMetadataReq): Promise<VideoMetadataRes> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(request.inputPath, (error, metadata) => {
        if (error) return reject(error);

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        resolve(
          VideoMetadataRes.of({
            format: metadata.format.format_name,
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            width: videoStream?.width,
            height: videoStream?.height,
            videoCodec: videoStream?.codec_name,
            audioCodec: audioStream?.codec_name,
          }),
        );
      });
    });
  }
}
