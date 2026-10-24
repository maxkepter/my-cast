export class VideoTranscodeException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'TRANSCODE_ERROR',
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'VideoTranscodeException';
  }
}
