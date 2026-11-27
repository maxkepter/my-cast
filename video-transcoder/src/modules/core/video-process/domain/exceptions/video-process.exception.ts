import { VideoProcessErrorCode } from '../enums/video-process-error-code.enum';

export class VideoProcessException extends Error {
  constructor(
    message: string,
    public readonly code: VideoProcessErrorCode = VideoProcessErrorCode.UNKNOWN,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'VideoProcessException';
  }
}
