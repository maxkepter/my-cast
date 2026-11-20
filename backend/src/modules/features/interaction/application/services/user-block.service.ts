import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBlock } from '../../domain/entities/user-block.entity';
import { UserBlockedEvent } from '../../domain/events/user-blocked.event';
import { BlockUserReqDto } from '../../dtos/req.dto';
import { BlockStatusResDto } from '../../dtos/res.dto';
import { BlockUserUseCase } from '../usecases/block-user.usecase';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../../core/event/application/internal-event-bus.interface';

@Injectable()
export class UserBlockService implements BlockUserUseCase {
  constructor(
    @InjectRepository(UserBlock)
    private readonly blockRepo: Repository<UserBlock>,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly eventBus: InternalEventBus,
  ) {}

  async execute(
    blockerId: string,
    dto: BlockUserReqDto,
  ): Promise<BlockStatusResDto> {
    return this.blockUser(blockerId, dto);
  }

  async blockUser(
    blockerId: string,
    dto: BlockUserReqDto,
  ): Promise<BlockStatusResDto> {
    if (blockerId === dto.targetUserId) {
      throw new BadRequestException('User cannot block themselves');
    }

    const existing = await this.blockRepo.findOne({
      where: {
        blockerId,
        blockedId: dto.targetUserId,
      },
    });

    if (existing) {
      return BlockStatusResDto.of(blockerId, dto.targetUserId, true);
    }

    const block = UserBlock.create(undefined, blockerId, dto.targetUserId);
    await this.blockRepo.save(block);

    await this.eventBus.publish(
      new UserBlockedEvent(blockerId, dto.targetUserId),
    );

    return BlockStatusResDto.of(blockerId, dto.targetUserId, true);
  }
}
