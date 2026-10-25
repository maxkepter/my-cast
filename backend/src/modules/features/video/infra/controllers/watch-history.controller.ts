import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtGuard } from '../../../auth/contracts/auth.contract';
import { WatchHistoryService } from '../../application/services/watch-history.service';
import { WatchHistoryQueryReq } from '../../dtos/req.dto';
import { WatchVideoRes } from '../../dtos/res.dto';
import { Page } from '../../../../../common/dtos/page.dto';

@Controller('videos/history')
export class WatchHistoryController {
  constructor(
    private readonly watchHistoryService: WatchHistoryService,
  ) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async getMyWatchHistory(
    @CurrentUser('userId') userId: string,
    @Query() query?: WatchHistoryQueryReq,
  ): Promise<WatchVideoRes[] | Page<WatchVideoRes>> {
    if (query?.page && query?.size) {
      return this.watchHistoryService.viewWatchHistory(userId, query);
    }
    return this.watchHistoryService.viewWatchHistory(userId);
  }
}
