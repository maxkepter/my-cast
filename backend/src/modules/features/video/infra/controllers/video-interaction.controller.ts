import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtGuard } from '../../../auth/contracts/auth.contract';
import { OptionalJwtGuard } from '../guards/optional-jwt.guard';
import { VideoInteractionService } from '../../application/services/video-interaction.service';
import { ShareVideoReqDto, ToggleVideoLikeReqDto } from '../../dtos/req.dto';
import { ShareVideoResDto, VideoLikeResDto } from '../../dtos/res.dto';

@Controller('videos')
export class VideoInteractionController {
  constructor(
    private readonly interactionService: VideoInteractionService,
  ) {}

  @Post(':videoId/like')
  @UseGuards(JwtGuard)
  async toggleLike(
    @CurrentUser('userId') userId: string,
    @Param('videoId') videoId: string,
    @Body() body?: ToggleVideoLikeReqDto,
  ): Promise<VideoLikeResDto> {
    const req: ToggleVideoLikeReqDto = {
      videoId: body?.videoId ?? videoId,
    };
    return this.interactionService.toggleLike(userId, req);
  }

  @Get(':videoId/reaction-status')
  @UseGuards(OptionalJwtGuard)
  async getReactionStatus(
    @Param('videoId') videoId: string,
    @CurrentUser('userId') userId?: string | null,
  ): Promise<VideoLikeResDto> {
    return this.interactionService.getReactionStatus(videoId, userId ?? null);
  }

  @Post(':videoId/share')
  @UseGuards(OptionalJwtGuard)
  async shareVideo(
    @Param('videoId') videoId: string,
    @Body() body: ShareVideoReqDto,
    @CurrentUser('userId') userId?: string | null,
  ): Promise<ShareVideoResDto> {
    const req: ShareVideoReqDto = {
      ...body,
      videoId,
    };
    return this.interactionService.shareVideo(req, userId ?? null);
  }
}
