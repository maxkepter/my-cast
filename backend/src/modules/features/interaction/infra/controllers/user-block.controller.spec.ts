import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { UserBlockController } from './user-block.controller';
import { UserBlockService } from '../../application/services/user-block.service';
import { BlockUserReqDto } from '../../dtos/req.dto';
import { BlockStatusResDto } from '../../dtos/res.dto';

describe('UserBlockController', () => {
  let controller: UserBlockController;
  let userBlockService: {
    blockUser: ReturnType<typeof vi.fn>;
  };

  const blockerId = '11111111-1111-4111-8111-111111111111';
  const targetUserId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    userBlockService = {
      blockUser: vi.fn(),
    };

    controller = new UserBlockController(
      userBlockService as unknown as UserBlockService,
    );
  });

  it('delegates block request to UserBlockService and returns BlockStatusResDto', async () => {
    const dto: BlockUserReqDto = { targetUserId };
    const expectedRes = BlockStatusResDto.of(blockerId, targetUserId, true);
    userBlockService.blockUser.mockResolvedValue(expectedRes);

    const result = await controller.blockUser(blockerId, dto);

    expect(userBlockService.blockUser).toHaveBeenCalledWith(blockerId, dto);
    expect(result).toBe(expectedRes);
    expect(result.isBlocked).toBe(true);
  });

  it('propagates exceptions thrown by UserBlockService', async () => {
    const dto: BlockUserReqDto = { targetUserId: blockerId };
    userBlockService.blockUser.mockRejectedValue(
      new BadRequestException('User cannot block themselves'),
    );

    await expect(controller.blockUser(blockerId, dto)).rejects.toThrow(
      BadRequestException,
    );
  });
});
