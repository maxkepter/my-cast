import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Playlist } from '../../domain/entities/playlist.entity';
import { Video } from '../../domain/entities/video.entity';
import { PlaylistVisibility } from '../../domain/enums/playlist-visibility.enum';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { PlaylistCreatedEvent } from '../../domain/events/playlist-created.event';
import { VideoAddedToPlaylistEvent } from '../../domain/events/video-added-to-playlist.event';
import { AddVideoToPlaylistReq, CreatePlaylistReq } from '../../dtos/req.dto';
import { PlaylistRes, WatchVideoRes } from '../../dtos/res.dto';
import { Page, PageReq } from '../../../../../common/dtos/page.dto';
import { CreatePlaylistUseCase } from '../usecases/create-playlist.usecase';
import { AddVideoToPlaylistUseCase } from '../usecases/add-video-to-playlist.usecase';
import { WatchPlaylistUseCase } from '../usecases/watch-playlist.usecase';
import {
  INTERNAL_EVENT_BUS,
  InternalEventBus,
} from '../../../../core/event/application/internal-event-bus.interface';

@Injectable()
export class PlaylistService
  implements
    CreatePlaylistUseCase,
    AddVideoToPlaylistUseCase,
    WatchPlaylistUseCase
{
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,
    @InjectRepository(Video)
    private readonly videoRepo: Repository<Video>,
    @Inject(INTERNAL_EVENT_BUS)
    private readonly eventBus: InternalEventBus,
  ) {}

  execute(
    authorId: string,
    req: CreatePlaylistReq,
  ): Promise<PlaylistRes>;
  execute(
    authorId: string,
    req: AddVideoToPlaylistReq,
  ): Promise<PlaylistRes>;
  execute(
    playlistId: string,
    userId?: string | null,
  ): Promise<PlaylistRes>;
  execute(
    playlistId: string,
    userId: string | null | undefined,
    pageReq: PageReq,
  ): Promise<Page<PlaylistRes>>;
  async execute(
    arg1: string,
    arg2?: CreatePlaylistReq | AddVideoToPlaylistReq | string | null | PageReq,
    arg3?: PageReq,
  ): Promise<PlaylistRes | Page<PlaylistRes>> {
    if (arg2 && typeof arg2 === 'object') {
      if ('playlistName' in arg2) {
        return this.createPlaylist(arg1, arg2 as CreatePlaylistReq);
      }
      if ('playlistId' in arg2 && 'videoId' in arg2) {
        return this.addVideoToPlaylist(arg1, arg2 as AddVideoToPlaylistReq);
      }
    }

    const userId = typeof arg2 === 'string' || arg2 === null ? arg2 : undefined;
    const pageReq = arg3 ?? (arg2 instanceof PageReq || (typeof arg2 === 'object' && arg2 !== null && 'page' in arg2 && 'size' in arg2) ? (arg2 as PageReq) : undefined);

    return this.watchPlaylist(arg1, userId, pageReq);
  }

  async createPlaylist(
    authorId: string,
    req: CreatePlaylistReq,
  ): Promise<PlaylistRes> {
    const existing = await this.playlistRepo.findOne({
      where: { authorId, title: req.playlistName },
    });
    if (existing) {
      throw new ConflictException('Playlist with this name already exists');
    }

    const playlist = Playlist.create(
      '',
      authorId,
      req.playlistName,
      req.playlistDescription,
      req.visibility ?? PlaylistVisibility.PUBLIC,
      [],
    );

    const saved = await this.playlistRepo.save(playlist);
    await this.eventBus.publish(
      new PlaylistCreatedEvent(saved.playlistId, authorId, saved.title),
    );

    return PlaylistRes.of(
      saved.playlistId,
      saved.title,
      saved.description ?? '',
      [],
    );
  }

  async addVideoToPlaylist(
    authorId: string,
    req: AddVideoToPlaylistReq,
  ): Promise<PlaylistRes> {
    const playlist = await this.playlistRepo.findOne({
      where: { playlistId: req.playlistId },
    });
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.authorId !== authorId) {
      throw new ForbiddenException('You are not the owner of this playlist');
    }

    const video = await this.videoRepo.findOne({
      where: { videoId: req.videoId },
    });
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    playlist.addVideo(req.videoId);
    await this.playlistRepo.save(playlist);

    await this.eventBus.publish(
      new VideoAddedToPlaylistEvent(playlist.playlistId, req.videoId, authorId),
    );

    const videos = await this.loadPlaylistVideos(playlist.videoIds, authorId);
    return PlaylistRes.of(
      playlist.playlistId,
      playlist.title,
      playlist.description ?? '',
      videos,
    );
  }

  async watchPlaylist(
    playlistId: string,
    userId?: string | null,
    pageReq?: PageReq,
  ): Promise<PlaylistRes | Page<PlaylistRes>> {
    const playlist = await this.playlistRepo.findOne({
      where: { playlistId },
    });
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (
      playlist.visibility === PlaylistVisibility.PRIVATE &&
      playlist.authorId !== userId
    ) {
      throw new ForbiddenException('This playlist is private');
    }

    const videos = await this.loadPlaylistVideos(playlist.videoIds, userId);
    const playlistRes = PlaylistRes.of(
      playlist.playlistId,
      playlist.title,
      playlist.description ?? '',
      videos,
    );

    if (pageReq) {
      return Page.of([playlistRes], 1, pageReq);
    }

    return playlistRes;
  }

  getPlayListByAuthorId(
    authorId: string,
    userId?: string | null,
  ): Promise<PlaylistRes[]>;
  getPlayListByAuthorId(
    authorId: string,
    userId: string | null | undefined,
    pageReq: PageReq,
  ): Promise<Page<PlaylistRes>>;
  async getPlayListByAuthorId(
    authorId: string,
    userId?: string | null,
    pageReq?: PageReq,
  ): Promise<PlaylistRes[] | Page<PlaylistRes>> {
    const isOwner = userId === authorId;
    const where: any = { authorId };
    if (!isOwner) {
      where.visibility = PlaylistVisibility.PUBLIC;
    }

    if (pageReq) {
      const skip = (pageReq.page - 1) * pageReq.size;
      const [playlists, total] = await this.playlistRepo.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip,
        take: pageReq.size,
      });

      const resList = await Promise.all(
        playlists.map(async (pl) => {
          const videos = await this.loadPlaylistVideos(pl.videoIds, userId);
          return PlaylistRes.of(
            pl.playlistId,
            pl.title,
            pl.description ?? '',
            videos,
          );
        }),
      );

      return Page.of(resList, total, pageReq);
    }

    const playlists = await this.playlistRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      playlists.map(async (pl) => {
        const videos = await this.loadPlaylistVideos(pl.videoIds, userId);
        return PlaylistRes.of(
          pl.playlistId,
          pl.title,
          pl.description ?? '',
          videos,
        );
      }),
    );
  }

  private async loadPlaylistVideos(
    videoIds: string[] | undefined,
    userId?: string | null,
  ): Promise<WatchVideoRes[]> {
    if (!videoIds || videoIds.length === 0) {
      return [];
    }

    const foundVideos = await this.videoRepo.find({
      where: { videoId: In(videoIds) },
    });

    const videoMap = new Map<string, Video>();
    for (const v of foundVideos) {
      videoMap.set(v.videoId, v);
    }

    const result: WatchVideoRes[] = [];
    for (const id of videoIds) {
      const v = videoMap.get(id);
      if (!v) continue;

      if (
        v.config?.visibility === VideoVisibility.PRIVATE &&
        v.authorId !== userId
      ) {
        continue;
      }

      result.push(
        WatchVideoRes.of(
          v.videoId,
          v.authorId,
          v.description,
          v.title,
          v.thumbnail,
          v.videoFile,
          v.views,
          v.likesCount,
          v.sharesCount,
        ),
      );
    }

    return result;
  }
}
