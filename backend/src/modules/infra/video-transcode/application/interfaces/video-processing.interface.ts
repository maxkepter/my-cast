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

