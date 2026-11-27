import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { VideoProcessCompletedMessageDto } from './video-process-completed-message.dto';

const valid = {
  id: '22222222-2222-4222-8222-222222222222', occuredOn: '2026-11-27T09:00:00.000Z',
  videoId: '11111111-1111-4111-8111-111111111111', authorId: '33333333-3333-4333-8333-333333333333',
  videoKey: 'videos/id/source.mp4', masterPlaylistKey: 'videos/id/hls/master.m3u8',
  thumbnailKey: 'videos/id/thumbnail.jpg', storyboardVttKey: 'videos/id/storyboard/a.vtt',
  storyboardSpriteKeys: ['videos/id/storyboard/a.jpg'], previewKey: 'videos/id/previews/a.mp4',
  renditions: ['720p', '480p', '360p'], duration: 120.5, width: 1280, height: 720,
};

describe('VideoProcessCompletedMessageDto', () => {
  it('accepts C3', async () => {
    expect(await validate(plainToInstance(VideoProcessCompletedMessageDto, valid))).toHaveLength(0);
  });
  it.each([
    { id: 'bad' }, { occuredOn: 'not-date' }, { videoId: '' }, { authorId: '' },
    { videoKey: '../source.mp4' }, { thumbnailKey: '/absolute' }, { previewKey: 'x'.repeat(501) },
    { storyboardSpriteKeys: [] }, { storyboardSpriteKeys: ['../bad'] }, { renditions: ['4k'] },
    { duration: 0 }, { duration: Infinity }, { width: 1.5 }, { height: -1 },
  ])('rejects malformed C3 %j', async (change) => {
    expect((await validate(plainToInstance(VideoProcessCompletedMessageDto, { ...valid, ...change }))).length).toBeGreaterThan(0);
  });
});
