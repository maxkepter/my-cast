import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtGuard } from '../../../auth/contracts/auth.contract';
import { VideoService } from '../../application/services/video.service';
import { UpdateVideoReq } from '../../dtos/req.dto';
import { VideoRes } from '../../dtos/res.dto';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

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
