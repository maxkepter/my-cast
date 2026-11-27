import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { Video } from '../../domain/entities/video.entity';
import { VideoStatus } from '../../domain/enums/video-status.enum';
import { VideoProcessCompletedEvent } from '../../domain/events/video-process-completed.event';
import { VideoStatusStreamService } from '../services/video-status-stream.service';
import { VideoProcessCompletedHandler } from './video-process-completed.handler';

const props = {
  videoId: '11111111-1111-4111-8111-111111111111', authorId: '33333333-3333-4333-8333-333333333333', videoKey: 'videos/id/source.mp4',
  masterPlaylistKey: 'videos/id/hls/master.m3u8', thumbnailKey: 'videos/id/thumb.jpg', storyboardVttKey: 'videos/id/a.vtt',
  storyboardSpriteKeys: ['videos/id/a.jpg'], previewKey: 'videos/id/a.mp4', renditions: ['360p'], duration: 4, width: 640, height: 360,
};

function setup(status = VideoStatus.UPLOADED) {
  const video = { videoId: props.videoId, authorId: props.authorId, videoFile: props.videoKey, videoStatus: status, thumbnail: 'user.jpg' };
  const qb = { update: vi.fn().mockReturnThis(), set: vi.fn().mockReturnThis(), setParameter: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), andWhere: vi.fn().mockReturnThis(), execute: vi.fn().mockResolvedValue({ affected: 1 }) };
  const repo = { findOne: vi.fn().mockResolvedValue(video), createQueryBuilder: vi.fn().mockReturnValue(qb) };
  const stream = { emitStatus: vi.fn() };
  return { video, qb, repo, stream, handler: new VideoProcessCompletedHandler(repo as unknown as Repository<Video>, stream as unknown as VideoStatusStreamService) };
}

describe('VideoProcessCompletedHandler', () => {
  it('conditionally updates matching row, preserves thumbnail in SQL, then emits', async () => {
    const { handler, qb, stream } = setup();
    const event = new VideoProcessCompletedEvent(props);
    qb.execute.mockImplementation(async () => { expect(stream.emitStatus).not.toHaveBeenCalled(); return { affected: 1 }; });
    await handler.handle(event);
    expect(qb.set).toHaveBeenCalledWith(expect.objectContaining({ videoStatus: VideoStatus.PROCESSED, failureReason: null, processingMetadata: expect.objectContaining({ processedEventId: event.id, masterPlaylistKey: props.masterPlaylistKey }) }));
    const set = qb.set.mock.calls[0][0] as { thumbnail: () => string };
    expect(set.thumbnail()).toContain('ELSE "thumbnail"');
    expect(qb.andWhere).toHaveBeenCalledWith('"videoStatus" IN (:...allowedStatuses)', { allowedStatuses: [VideoStatus.UPLOADED, VideoStatus.PROCESSING] });
    expect(stream.emitStatus).toHaveBeenCalledOnce();
  });
  it.each([VideoStatus.FAILED, VideoStatus.PROCESSED])('ignores terminal %s', async (status) => {
    const { handler, repo, stream } = setup(status);
    await handler.handle(new VideoProcessCompletedEvent(props));
    expect(repo.createQueryBuilder).not.toHaveBeenCalled(); expect(stream.emitStatus).not.toHaveBeenCalled();
  });
  it.each(['authorId', 'videoKey'])('rejects mismatched %s', async (field) => {
    const { handler, repo } = setup();
    await handler.handle(new VideoProcessCompletedEvent({ ...props, [field]: 'different' }));
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });
  it('skips lost race and propagates database failure', async () => {
    const { handler, qb, stream } = setup();
    qb.execute.mockResolvedValueOnce({ affected: 0 }).mockRejectedValueOnce(new Error('DB down'));
    await handler.handle(new VideoProcessCompletedEvent(props));
    await expect(handler.handle(new VideoProcessCompletedEvent(props))).rejects.toThrow('DB down');
    expect(stream.emitStatus).not.toHaveBeenCalled();
  });
});
