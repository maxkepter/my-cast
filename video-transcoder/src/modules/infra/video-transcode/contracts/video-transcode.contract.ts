export const VIDEO_TRANSCODE_CONTRACT = Symbol('VIDEO_TRANSCODE_CONTRACT');
export const VIDEO_TRANSCODE_SERVICE = VIDEO_TRANSCODE_CONTRACT;

export interface VideoMetadata {
  duration: number; // giây
  width: number;
  height: number;
  aspectRatio: string;
  fps: number;
  bitrate: number;
  videoCodec: string;
  audioCodec: string;
  size: number; // bytes
}

export interface ThumbnailOptions {
  timestampSec?: number; // mặc định 1s hoặc giữa video
  width?: number;
  height?: number;
}

export interface StoryboardOptions {
  intervalSec: number; // chụp mỗi X giây (thường 2s-5s)
  width: number; // chiều rộng 1 frame (thường 160px)
  height: number; // chiều cao 1 frame (thường 90px)
  columns: number; // số cột trên 1 ảnh sprite sheet (thường 5-10)
}

export interface StoryboardResult {
  vttPath: string; // file WebVTT mapping time -> coordinates
  spritePaths: string[]; // danh sách ảnh sprite sheets
}

export interface HlsRendition {
  resolution: '1080p' | '720p' | '480p' | '360p';
  width: number;
  height: number;
  videoBitrate: string; // vd: '2800k'
  audioBitrate: string; // vd: '128k'
}

export interface HlsOptions {
  segmentDuration?: number; // mặc định 4s - 6s
  renditions: HlsRendition[];
  onProgress?: (percent: number) => void;
}

export interface CompressionOptions {
  codec?: 'h264' | 'h265' | 'av1'; // default 'h264'
  crf?: number; // 18 (gần lossless) - 28 (nén sâu), default 23
  preset?: 'ultrafast' | 'veryfast' | 'medium' | 'slow'; // default 'medium'
  targetSizeMb?: number; // giới hạn dung lượng cố định (tự tính bitrate 2-pass)
  maxBitrate?: string; // trần bitrate, vd '2000k'
  audioBitrate?: string; // vd '96k', '128k'
  scale?: { width?: number; height?: number }; // hạ độ phân giải để giảm dung lượng
  onProgress?: (percent: number) => void;
}

export interface CompressionResult {
  outputPath: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number; // original / compressed
}

export interface VideoTranscodeContract {
  //1. Validate
  probe(filePath: string): Promise<VideoMetadata>;
  validate(filePath: string): Promise<boolean>;

  // 2. Tạo ảnh bổ trợ
  generateThumbnail(
    inputPath: string,
    outputPath: string,
    options?: ThumbnailOptions,
  ): Promise<string>;
  generateStoryboard(
    inputPath: string,
    outputDir: string,
    opt: StoryboardOptions,
  ): Promise<StoryboardResult>;
  generatePreview(
    inputPath: string,
    outputPath: string,
    opt?: { durationSec?: number; fps?: number },
  ): Promise<string>;

  // 3. Xử lý âm thanh
  extractAudio(
    inputPath: string,
    outputPath: string,
    opt?: { format?: 'mp3' | 'aac' | 'wav' },
  ): Promise<string>;

  // 4. Mã hóa phân phối (Streaming & Fallback)
  transcodeHls(
    inputPath: string,
    outputDir: string,
    opt: HlsOptions,
  ): Promise<string>; // Trả về master.m3u8 path

  //   5. Nén video
  compress(
    inputPath: string,
    outputPath: string,
    opt?: CompressionOptions,
  ): Promise<CompressionResult>;
}
