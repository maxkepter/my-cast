import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtGuard } from '../../../auth/contracts/auth.contract';
import { OptionalJwtGuard } from '../guards/optional-jwt.guard';
import { PlaylistService } from '../../application/services/playlist.service';
import {
  AddVideoToPlaylistReq,
  CreatePlaylistReq,
  PlaylistQueryReq,
} from '../../dtos/req.dto';
import { PlaylistRes } from '../../dtos/res.dto';
import { Page } from '../../../../../common/dtos/page.dto';

@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  @UseGuards(JwtGuard)
  async createPlaylist(
    @CurrentUser('userId') userId: string,
    @Body() req: CreatePlaylistReq,
  ): Promise<PlaylistRes> {
    return this.playlistService.createPlaylist(userId, req);
  }

  @Post(':playlistId/videos')
  @UseGuards(JwtGuard)
  async addVideoToPlaylist(
    @CurrentUser('userId') userId: string,
    @Param('playlistId') playlistId: string,
    @Body() body: AddVideoToPlaylistReq,
  ): Promise<PlaylistRes> {
    const req: AddVideoToPlaylistReq = {
      ...body,
      playlistId,
    };
    return this.playlistService.addVideoToPlaylist(userId, req);
  }

  @Get('author/:authorId')
  @UseGuards(OptionalJwtGuard)
  async getPlaylistsByAuthor(
    @Param('authorId') authorId: string,
    @CurrentUser('userId') userId?: string | null,
    @Query() query?: PlaylistQueryReq,
  ): Promise<PlaylistRes[] | Page<PlaylistRes>> {
    if (query?.page && query?.size) {
      return this.playlistService.getPlayListByAuthorId(
        authorId,
        userId ?? null,
        query,
      );
    }
    return this.playlistService.getPlayListByAuthorId(authorId, userId ?? null);
  }

  @Get(':playlistId')
  @UseGuards(OptionalJwtGuard)
  async getPlaylist(
    @Param('playlistId') playlistId: string,
    @CurrentUser('userId') userId?: string | null,
  ): Promise<PlaylistRes | Page<PlaylistRes>> {
    return this.playlistService.watchPlaylist(playlistId, userId ?? null);
  }
}
