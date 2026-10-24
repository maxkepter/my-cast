import {
  ExtractAudioReq,
  GenerateHlsReq,
  GenerateThumbnailReq,
  GetVideoMetadataReq,
  VideoCompressionReq,
  VideoTranscodeReq,
} from '../../dtos/req.dto';
import {
  HlsPlaylistRes,
  ThumbnailRes,
  VideoMetadataRes,
  VideoProcessRes,
} from '../../dtos/res.dto';

export const VIDEO_PROCESSING_SERVICE = Symbol('VIDEO_PROCESSING_SERVICE');

export interface VideoProcessingService {
  transcodeVideo(request: VideoTranscodeReq): Promise<VideoProcessRes>;
  compressVideo(request: VideoCompressionReq): Promise<VideoProcessRes>;
  extractAudio(request: ExtractAudioReq): Promise<VideoProcessRes>;
  generateThumbnail(request: GenerateThumbnailReq): Promise<ThumbnailRes>;
  generateHls(request: GenerateHlsReq): Promise<HlsPlaylistRes>;
  getMetadata(request: GetVideoMetadataReq): Promise<VideoMetadataRes>;
}

export const MockVideoProcessingService: VideoProcessingService = {
  transcodeVideo: async () => ({ inputPath: 'mock/in.mp4', outputPath: 'mock/out.mp4' }),
  compressVideo: async () => ({ inputPath: 'mock/in.mp4', outputPath: 'mock/out.mp4' }),
  extractAudio: async () => ({ inputPath: 'mock/in.mp4', outputPath: 'mock/out.mp3' }),
  generateThumbnail: async () => ({ inputPath: 'mock/in.mp4', outputPath: 'mock/thumb.jpg', timestamp: '00:00:01' }),
  generateHls: async () => ({ inputPath: 'mock/in.mp4', outputDirectory: 'mock/hls', playlistPath: 'mock/hls/master.m3u8', segmentDuration: 10 }),
  getMetadata: async () => ({ duration: 120, width: 1920, height: 1080, format: 'mp4', bitrate: 5000000 }),
};


