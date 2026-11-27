import { VideoUploadedEvent } from '../../domain/events/video-uploaded.event';

export interface VideoProcessResult {
  masterPlaylistKey: string;
  renditions: string[];
}

export interface ProcessVideoUseCase {
  /**
   * Runs the full pipeline. Publishes completed (on success) or failed (then rethrows)
   * to the outbox, and always cleans up the temporary workspace directory.
   */
  process(event: VideoUploadedEvent): Promise<VideoProcessResult>;
}
