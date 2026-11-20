import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { Playlist } from '../../domain/entities/playlist.entity';
import { Video } from '../../domain/entities/video.entity';
import { VideoConfig } from '../../domain/value-objects/video-config.vo';
import { PlaylistVisibility } from '../../domain/enums/playlist-visibility.enum';
import { VideoVisibility } from '../../domain/enums/video-visibility.enum';
import { PlaylistCreatedEvent } from '../../domain/events/playlist-created.event';
import { VideoAddedToPlaylistEvent } from '../../domain/events/video-added-to-playlist.event';

describe('PlaylistService', () => {
  let service: PlaylistService;
  let playlistRepo: any;
  let videoRepo: any;
  let eventBus: any;

  const mockPlaylist = (visibility = PlaylistVisibility.PUBLIC) =>
    Playlist.create(
      'pl-1',
      'u-author-1',
      'My Playlist',
      'Playlist Description',
      visibility,
      ['v-1', 'v-2'],
    );

  const mockVideo = (id: string, visibility = VideoVisibility.PUBLIC, authorId = 'u-author-1') =>
    Video.create(
      id,
      authorId,
      `Desc ${id}`,
      `Title ${id}`,
      `https://thumb-${id}.jpg`,
      `https://stream-${id}.mp4`,
      100,
      VideoConfig.create(visibility, true),
      10,
      2,
    );

  beforeEach(() => {
    playlistRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
      findAndCount: vi.fn(),
      save: vi.fn((entity) =>
        Promise.resolve({
          ...entity,
          playlistId: entity.playlistId || 'pl-created-id',
        }),
      ),
    };

    videoRepo = {
      findOne: vi.fn(),
      find: vi.fn(),
    };

    eventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    service = new PlaylistService(playlistRepo, videoRepo, eventBus);
  });

  describe('createPlaylist', () => {
    it('should throw ConflictException when playlist name already exists for author', async () => {
      playlistRepo.findOne.mockResolvedValue(mockPlaylist());

      await expect(
        service.createPlaylist('u-author-1', {
          playlistName: 'My Playlist',
          visibility: PlaylistVisibility.PUBLIC,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create playlist and publish PlaylistCreatedEvent', async () => {
      playlistRepo.findOne.mockResolvedValue(null);

      const res = await service.createPlaylist('u-author-1', {
        playlistName: 'Brand New Playlist',
        playlistDescription: 'Desc',
        visibility: PlaylistVisibility.PUBLIC,
      });

      expect(res.playlistName).toBe('Brand New Playlist');
      expect(playlistRepo.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(PlaylistCreatedEvent),
      );
    });
  });

  describe('addVideoToPlaylist', () => {
    it('should throw NotFoundException when playlist not found', async () => {
      playlistRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addVideoToPlaylist('u-author-1', {
          playlistId: 'pl-missing',
          videoId: 'v-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      playlistRepo.findOne.mockResolvedValue(mockPlaylist());

      await expect(
        service.addVideoToPlaylist('u-intruder', {
          playlistId: 'pl-1',
          videoId: 'v-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when video not found', async () => {
      playlistRepo.findOne.mockResolvedValue(mockPlaylist());
      videoRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addVideoToPlaylist('u-author-1', {
          playlistId: 'pl-1',
          videoId: 'v-missing',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add video and publish VideoAddedToPlaylistEvent', async () => {
      const pl = mockPlaylist();
      playlistRepo.findOne.mockResolvedValue(pl);
      const v = mockVideo('v-3');
      videoRepo.findOne.mockResolvedValue(v);
      videoRepo.find.mockResolvedValue([mockVideo('v-1'), mockVideo('v-2'), v]);

      const res = await service.addVideoToPlaylist('u-author-1', {
        playlistId: 'pl-1',
        videoId: 'v-3',
      });

      expect(pl.videoIds).toContain('v-3');
      expect(playlistRepo.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(VideoAddedToPlaylistEvent),
      );
      expect(res.videos).toHaveLength(3);
    });
  });

  describe('watchPlaylist', () => {
    it('should throw NotFoundException when playlist not found', async () => {
      playlistRepo.findOne.mockResolvedValue(null);

      await expect(service.watchPlaylist('pl-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when playlist is PRIVATE and viewer is not owner', async () => {
      playlistRepo.findOne.mockResolvedValue(
        mockPlaylist(PlaylistVisibility.PRIVATE),
      );

      await expect(
        service.watchPlaylist('pl-1', 'u-stranger'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to watch PRIVATE playlist', async () => {
      playlistRepo.findOne.mockResolvedValue(
        mockPlaylist(PlaylistVisibility.PRIVATE),
      );
      videoRepo.find.mockResolvedValue([mockVideo('v-1'), mockVideo('v-2')]);

      const res = (await service.watchPlaylist(
        'pl-1',
        'u-author-1',
      )) as any;
      expect(res.playlistId).toBe('pl-1');
      expect(res.videos).toHaveLength(2);
    });

    it('should filter out PRIVATE videos belonging to another author', async () => {
      playlistRepo.findOne.mockResolvedValue(mockPlaylist());
      const publicVideo = mockVideo('v-1', VideoVisibility.PUBLIC, 'u-author-1');
      const privateVideo = mockVideo('v-2', VideoVisibility.PRIVATE, 'u-other-author');
      videoRepo.find.mockResolvedValue([publicVideo, privateVideo]);

      const res = (await service.watchPlaylist('pl-1', 'u-viewer')) as any;
      expect(res.videos).toHaveLength(1);
      expect(res.videos[0].videoId).toBe('v-1');
    });
  });

  describe('getPlayListByAuthorId', () => {
    it('should fetch all playlists when viewer is author', async () => {
      const pl1 = mockPlaylist(PlaylistVisibility.PUBLIC);
      const pl2 = mockPlaylist(PlaylistVisibility.PRIVATE);
      playlistRepo.find.mockResolvedValue([pl1, pl2]);
      videoRepo.find.mockResolvedValue([]);

      const list = (await service.getPlayListByAuthorId(
        'u-author-1',
        'u-author-1',
      )) as any[];

      expect(playlistRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { authorId: 'u-author-1' } }),
      );
      expect(list).toHaveLength(2);
    });

    it('should filter only PUBLIC when viewer is not author', async () => {
      playlistRepo.find.mockResolvedValue([mockPlaylist()]);
      videoRepo.find.mockResolvedValue([]);

      await service.getPlayListByAuthorId('u-author-1', 'u-stranger');

      expect(playlistRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            authorId: 'u-author-1',
            visibility: PlaylistVisibility.PUBLIC,
          },
        }),
      );
    });
  });
});
