import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { UserBlockService } from './user-block.service';
import { UserBlock } from '../../domain/entities/user-block.entity';
import { UserBlockedEvent } from '../../domain/events/user-blocked.event';
import { BlockUserReqDto } from '../../dtos/req.dto';

describe('UserBlockService', () => {
  let service: UserBlockService;
  let blockRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let eventBus: {
    publish: ReturnType<typeof vi.fn>;
  };

  const blockerId = '11111111-1111-4111-8111-111111111111';
  const targetUserId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    blockRepo = {
      findOne: vi.fn(),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };
    eventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    service = new UserBlockService(blockRepo as any, eventBus as any);
  });

  it('throws BadRequestException when user attempts to block themselves', async () => {
    const dto: BlockUserReqDto = { targetUserId: blockerId };

    await expect(service.blockUser(blockerId, dto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.blockUser(blockerId, dto)).rejects.toThrow(
      'User cannot block themselves',
    );
    expect(blockRepo.findOne).not.toHaveBeenCalled();
    expect(blockRepo.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('returns idempotent success without saving or publishing when already blocked', async () => {
    const dto: BlockUserReqDto = { targetUserId };
    const existingBlock = UserBlock.create(undefined, blockerId, targetUserId);
    blockRepo.findOne.mockResolvedValue(existingBlock);

    const result = await service.blockUser(blockerId, dto);

    expect(blockRepo.findOne).toHaveBeenCalledWith({
      where: {
        blockerId,
        blockedId: targetUserId,
      },
    });
    expect(blockRepo.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(result.blockerId).toBe(blockerId);
    expect(result.blockedId).toBe(targetUserId);
    expect(result.isBlocked).toBe(true);
  });

  it('creates block record, saves it, and publishes UserBlockedEvent when not yet blocked', async () => {
    const dto: BlockUserReqDto = { targetUserId };
    blockRepo.findOne.mockResolvedValue(null);

    const result = await service.blockUser(blockerId, dto);

    expect(blockRepo.findOne).toHaveBeenCalledWith({
      where: {
        blockerId,
        blockedId: targetUserId,
      },
    });
    expect(blockRepo.save).toHaveBeenCalledTimes(1);
    const savedEntity = blockRepo.save.mock.calls[0][0];
    expect(savedEntity.blockerId).toBe(blockerId);
    expect(savedEntity.blockedId).toBe(targetUserId);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = eventBus.publish.mock.calls[0][0];
    expect(publishedEvent).toBeInstanceOf(UserBlockedEvent);
    expect(publishedEvent.blockerId).toBe(blockerId);
    expect(publishedEvent.blockedId).toBe(targetUserId);
    expect(publishedEvent.getEventName()).toBe(UserBlockedEvent.EVENT_NAME);

    expect(result).toEqual({
      blockerId,
      blockedId: targetUserId,
      isBlocked: true,
    });
  });

  it('delegates execute() to blockUser()', async () => {
    const dto: BlockUserReqDto = { targetUserId };
    blockRepo.findOne.mockResolvedValue(null);

    const result = await service.execute(blockerId, dto);

    expect(result.isBlocked).toBe(true);
    expect(blockRepo.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
  });
});
