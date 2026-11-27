import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  Patch,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CurrentUser, JwtGuard } from '../../../auth/contracts/auth.contract';
import { VideoService } from '../../application/services/video.service';
import { VideoUploadService } from '../../application/services/video-upload.service';
import { VideoStatusStreamService } from '../../application/services/video-status-stream.service';
import {
  CompleteVideoUploadReq,
  InitiateVideoUploadReq,
  UpdateVideoReq,
} from '../../dtos/req.dto';
import {
  CompleteVideoUploadRes,
  InitiateVideoUploadRes,
  VideoRes,
} from '../../dtos/res.dto';

@Controller('videos')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly videoUploadService: VideoUploadService,
    private readonly videoStatusStreamService: VideoStatusStreamService,
  ) {}

  @Post('upload')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async initiateUpload(
    @CurrentUser('userId') userId: string,
    @Body() req: InitiateVideoUploadReq,
  ): Promise<InitiateVideoUploadRes> {
    return this.videoUploadService.initiateUpload(userId, req);
  }

  @Post('completeUpload')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @CurrentUser('userId') userId: string,
    @Body() req: CompleteVideoUploadReq,
  ): Promise<CompleteVideoUploadRes> {
    return this.videoUploadService.completeUpload(userId, req);
  }

  @Sse(':videoId/status/events')
  @UseGuards(JwtGuard)
  async streamVideoStatus(
    @CurrentUser('userId') userId: string,
    @Param('videoId') videoId: string,
  ): Promise<Observable<MessageEvent>> {
    const snapshot = await this.videoUploadService.getUploadStatusSnapshot(
      userId,
      videoId,
    );
    return this.videoStatusStreamService.createStream(videoId, snapshot);
  }

  @Patch(':videoId')
  @UseGuards(JwtGuard)
  async updateVideo(
    @CurrentUser('userId') userId: string,
    @Param('videoId') videoId: string,
    @Body() req: UpdateVideoReq,
  ): Promise<VideoRes> {
    return this.videoService.updateVideo(userId, videoId, req);
  }

  @Delete(':videoId')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVideo(
    @CurrentUser('userId') userId: string,
    @Param('videoId') videoId: string,
  ): Promise<void> {
    await this.videoService.deleteVideo(userId, videoId);
  }
}
