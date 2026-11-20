import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtGuard } from '../../../auth/contracts/auth.contract';
import { UserBlockService } from '../../application/services/user-block.service';
import { BlockUserReqDto } from '../../dtos/req.dto';
import { BlockStatusResDto } from '../../dtos/res.dto';

@Controller(['users', 'api/users'])
export class UserBlockController {
  constructor(private readonly userBlockService: UserBlockService) {}

  @Post('blocks')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @CurrentUser('userId') blockerId: string,
    @Body() dto: BlockUserReqDto,
  ): Promise<BlockStatusResDto> {
    return this.userBlockService.blockUser(blockerId, dto);
  }
}
