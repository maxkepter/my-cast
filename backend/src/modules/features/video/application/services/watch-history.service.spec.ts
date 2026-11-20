import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistory } from '../../domain/entities/watch-history.entity';
import { Video } from '../../domain/entities/video.entity';
import { VideoConfig } from '../../domain/value-objects/video-config.vo';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { PageReq } from '../../../../../common/dtos/page.dto';

describe('WatchHistoryService', () => {
  let service: WatchHistoryService;
  let watchHistoryRepo: any;

  const mockVideo = (id: string) =>
    Video.create(
      id,
      'u-creator-1',
      `Desc ${id}`,
      `Title ${id}`,
      `https://thumb-${id}.jpg`,
      `https://video-${id}.mp4`,
      100,
      VideoConfig.create(VideoVisibility.PUBLIC, true),
      10,
      2,
    );

  const mockHistory = (id: string, videoId: string) => {
    const history = WatchHistory.create(`h-${id}`, 'u-user-1', videoId, 120);
    history.video = mockVideo(videoId);
    return history;
  };

  beforeEach(() => {
    watchHistoryRepo = {
      find: vi.fn(),
      findAndCount: vi.fn(),
    };

    service = new WatchHistoryService(watchHistoryRepo);
  });

  it('should return array of WatchVideoRes without pagination', async () => {
    watchHistoryRepo.find.mockResolvedValue([
      mockHistory('1', 'v-1'),
      mockHistory('2', 'v-2'),
    ]);

    const res = (await service.viewWatchHistory('u-user-1')) as any[];

    expect(res).toHaveLength(2);
    expect(res[0].videoId).toBe('v-1');
    expect(res[1].videoId).toBe('v-2');
    expect(watchHistoryRepo.find).toHaveBeenCalledWith({
      where: { userId: 'u-user-1' },
      relations: { video: true },
      order: { watchedAt: 'DESC' },
    });
  });

  it('should return paginated Page<WatchVideoRes> when pageReq is provided', async () => {
    const pageReq: PageReq = { page: 1, size: 10 };
    watchHistoryRepo.findAndCount.mockResolvedValue([
      [mockHistory('1', 'v-1')],
      1,
    ]);

    const res = (await service.viewWatchHistory('u-user-1', pageReq)) as any;

    expect(res.data).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(res.req).toEqual(pageReq);
    expect(watchHistoryRepo.findAndCount).toHaveBeenCalledWith({
      where: { userId: 'u-user-1' },
      relations: { video: true },
      order: { watchedAt: 'DESC' },
      skip: 0,
      take: 10,
    });
  });
});
