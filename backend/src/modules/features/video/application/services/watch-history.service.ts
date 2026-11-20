import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchHistory } from '../../domain/entities/watch-history.entity';
import { WatchVideoRes } from '../../dtos/res.dto';
import { Page, PageReq } from '../../../../../common/dtos/page.dto';
import { ViewWatchHistoryUseCase } from '../usecases/view-watch-history.usecase';

@Injectable()
export class WatchHistoryService implements ViewWatchHistoryUseCase {
  constructor(
    @InjectRepository(WatchHistory)
    private readonly watchHistoryRepo: Repository<WatchHistory>,
  ) {}

  viewWatchHistory(userId: string): Promise<WatchVideoRes[]>;
  viewWatchHistory(
    userId: string,
    pageReq: PageReq,
  ): Promise<Page<WatchVideoRes>>;
  async viewWatchHistory(
    userId: string,
    pageReq?: PageReq,
  ): Promise<WatchVideoRes[] | Page<WatchVideoRes>> {
    if (pageReq) {
      const skip = (pageReq.page - 1) * pageReq.size;
      const [histories, total] = await this.watchHistoryRepo.findAndCount({
        where: { userId },
        relations: { video: true },
        order: { watchedAt: 'DESC' },
        skip,
        take: pageReq.size,
      });

      const data = histories
        .filter((h) => !!h.video)
        .map((h) => {
          const v = h.video!;
          return WatchVideoRes.of(
            v.videoId,
            v.authorId,
            v.description,
            v.title,
            v.thumbnail,
            v.videoFile,
            v.views,
            v.likesCount,
            v.sharesCount,
          );
        });

      return Page.of(data, total, pageReq);
    }

    const histories = await this.watchHistoryRepo.find({
      where: { userId },
      relations: { video: true },
      order: { watchedAt: 'DESC' },
    });

    return histories
      .filter((h) => !!h.video)
      .map((h) => {
        const v = h.video!;
        return WatchVideoRes.of(
          v.videoId,
          v.authorId,
          v.description,
          v.title,
          v.thumbnail,
          v.videoFile,
          v.views,
          v.likesCount,
          v.sharesCount,
        );
      });
  }
}
