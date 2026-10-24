import { Handler } from '../../../../../common/application/handler';
import { VideoUploadSuccessEvent } from '../../domain/events/video-upload-success.event';

export class VideoProcessHandler implements Handler<VideoUploadSuccessEvent> {
  handle(data: VideoUploadSuccessEvent): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
