import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { VideoUploadedMessageDto } from './video-uploaded-message.dto';

async function validatePayload(payload: Record<string, unknown>) {
  const dto = plainToInstance(VideoUploadedMessageDto, payload);
  return validate(dto, { whitelist: true });
}

describe('VideoUploadedMessageDto', () => {
  const validFixture = {
    id: '6f1c1e9a-2b7d-4c55-9f31-0b8f3c7a1d20',
    occuredOn: '2026-11-27T09:00:00.000Z',
    videoId: 'c0a8012e-0000-4000-8000-000000000001',
    authorId: 'c0a8012e-0000-4000-8000-0000000000aa',
    videoKey: 'videos/c0a8012e-0000-4000-8000-000000000001/source.mp4',
    isSuccess: true,
    thumbnailKey: null,
    nodeId: 'node-1',
  };

  it('passes validation for a valid C1 fixture with null thumbnailKey', async () => {
    const errors = await validatePayload(validFixture);
    expect(errors).toHaveLength(0);
  });

  it('passes validation with a non-null thumbnailKey and minimal required fields', async () => {
    expect(
      await validatePayload({
        ...validFixture,
        thumbnailKey: 'videos/x/thumb.jpg',
      }),
    ).toHaveLength(0);

    expect(
      await validatePayload({
        id: validFixture.id,
        videoId: validFixture.videoId,
        authorId: validFixture.authorId,
        videoKey: validFixture.videoKey,
      }),
    ).toHaveLength(0);
  });

  it('fails when id is not a valid UUID', async () => {
    const errors = await validatePayload({
      ...validFixture,
      id: 'not-a-uuid',
    });

    expect(errors.some((e) => e.property === 'id')).toBe(true);
  });

  it('fails when videoId is missing, empty, or contains path traversal', async () => {
    const { videoId: _omitted, ...withoutVideoId } = validFixture;
    expect(
      (await validatePayload(withoutVideoId)).some(
        (e) => e.property === 'videoId',
      ),
    ).toBe(true);

    for (const badId of ['', '../escape', 'vid/123', 'vid\\123', 'vid 123']) {
      const errors = await validatePayload({
        ...validFixture,
        videoId: badId,
      });
      expect(errors.some((e) => e.property === 'videoId')).toBe(true);
    }
  });

  it('fails when authorId is missing or empty', async () => {
    const { authorId: _omitted, ...withoutAuthorId } = validFixture;
    expect(
      (await validatePayload(withoutAuthorId)).some(
        (e) => e.property === 'authorId',
      ),
    ).toBe(true);
  });

  it('fails when videoKey contains "..", starts with "/", or uses backslashes', async () => {
    for (const badKey of [
      '',
      '/videos/source.mp4',
      '../source.mp4',
      'videos/../secret.mp4',
      'videos\\source.mp4',
    ]) {
      const errors = await validatePayload({
        ...validFixture,
        videoKey: badKey,
      });
      expect(errors.some((e) => e.property === 'videoKey')).toBe(true);
    }
  });

  it('fails when isSuccess is not boolean or videoKey exceeds max length', async () => {
    const badBool = await validatePayload({
      ...validFixture,
      isSuccess: 'true',
    });
    expect(badBool.some((e) => e.property === 'isSuccess')).toBe(true);

    const tooLong = await validatePayload({
      ...validFixture,
      videoKey: 'a'.repeat(1025),
    });
    expect(tooLong.some((e) => e.property === 'videoKey')).toBe(true);
  });
});
