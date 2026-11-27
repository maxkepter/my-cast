import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosProgressEvent } from 'axios';
import { apiClient } from '@/lib/api-client';
import {
  getVideoUploadErrorMessage,
  isUploadCancelledError,
  VideoUploadError,
  VideoUploadService,
  videoUploadService,
} from './video-upload.service';
import {
  MockVideoUploadService,
  mockVideoUploadService,
} from './video-upload.mock';
import {
  CompleteVideoUploadRes,
  InitiateVideoUploadReq,
  InitiateVideoUploadRes,
  VideoStatusEventPayload,
} from '@/types/video-upload';

const mockS3Put = vi.fn();
const mockS3Client = {
  put: mockS3Put,
};

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('VideoUploadService (100% Axios)', () => {
  const originalMockEnv = process.env.NEXT_PUBLIC_USE_MOCK_VIDEO;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_USE_MOCK_VIDEO;
    vi.spyOn(axios, 'create').mockReturnValue(mockS3Client as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalMockEnv === undefined) {
      delete process.env.NEXT_PUBLIC_USE_MOCK_VIDEO;
    } else {
      process.env.NEXT_PUBLIC_USE_MOCK_VIDEO = originalMockEnv;
    }
  });

  it('exports singleton videoUploadService', () => {
    expect(videoUploadService).toBeInstanceOf(VideoUploadService);
  });

  describe('initiateUpload', () => {
    const sampleReq: InitiateVideoUploadReq = {
      title: 'Clean Architecture Demo',
      description: 'NestJS + Next.js',
      fileName: 'demo.mp4',
      contentType: 'video/mp4',
      fileSize: 10_485_760,
      videoConfig: {
        visibility: 'PUBLIC',
        allowComments: true,
      },
    };

    it('posts to /videos/upload via apiClient and returns presigned response', async () => {
      const mockRes: InitiateVideoUploadRes = {
        videoId: 'vid-123',
        storageKey: 'videos/vid-123',
        videoKey: 'videos/vid-123/video',
        uploadUrl: 'https://s3.local/videos/vid-123/video?sig=abc',
        status: 'UPLOADING',
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await videoUploadService.initiateUpload(sampleReq);

      expect(apiClient.post).toHaveBeenCalledWith('/videos/upload', sampleReq);
      expect(result).toEqual(mockRes);
    });

    it('maps 413, 415, 400, and 507 errors to clear Vietnamese messages', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: { status: 413, data: { message: 'Payload Too Large' } },
      });
      await expect(videoUploadService.initiateUpload(sampleReq)).rejects.toThrow(
        'Tệp video vượt quá dung lượng tối đa cho phép (100 MB).'
      );

      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: { status: 415, data: { message: 'Unsupported Media Type' } },
      });
      await expect(videoUploadService.initiateUpload(sampleReq)).rejects.toThrow(
        'Định dạng tệp video không được hỗ trợ. Vui lòng chọn MP4, MKV, MOV, AVI, WEBM hoặc M4V.'
      );

      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: ['title must be shorter than 150 characters'] },
        },
      });
      await expect(videoUploadService.initiateUpload(sampleReq)).rejects.toThrow(
        'Thông tin video không hợp lệ: title must be shorter than 150 characters'
      );

      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: { status: 507, data: { message: 'Insufficient Storage' } },
      });
      await expect(videoUploadService.initiateUpload(sampleReq)).rejects.toThrow(
        'Hệ thống lưu trữ hiện không khả dụng hoặc đã hết dung lượng. Vui lòng thử lại sau.'
      );
    });
  });

  describe('uploadFileToS3', () => {
    it('uploads directly to S3 via dedicated axios.create() client without Authorization header and reports progress', async () => {
      const file = new File([new Uint8Array(1000)], 'sample.mp4', {
        type: 'video/mp4',
      });
      const uploadUrl = 'https://s3.example.com/videos/vid-1/video?X-Amz-Signature=123';
      const controller = new AbortController();
      const progressEvents: number[] = [];

      mockS3Put.mockImplementationOnce(async (_url, _body, config) => {
        config.onUploadProgress?.({ loaded: 500, total: 1000 } as AxiosProgressEvent);
        config.onUploadProgress?.({ loaded: 1000, total: 1000 } as AxiosProgressEvent);
        return { status: 200 };
      });

      await videoUploadService.uploadFileToS3(
        uploadUrl,
        file,
        (progress) => progressEvents.push(progress.percentage),
        controller.signal
      );

      expect(axios.create).toHaveBeenCalledTimes(1);
      expect(apiClient.post).not.toHaveBeenCalled();
      expect(mockS3Put).toHaveBeenCalledTimes(1);

      const [calledUrl, calledBody, calledConfig] = mockS3Put.mock.calls[0];
      expect(calledUrl).toBe(uploadUrl);
      expect(calledBody).toBe(file);
      expect(calledConfig.headers).toEqual({ 'Content-Type': 'video/mp4' });
      expect(calledConfig.headers).not.toHaveProperty('Authorization');
      expect(calledConfig.signal).toBe(controller.signal);
      expect(progressEvents).toEqual([50, 100]);
    });

    it('preserves cancellation error when upload is aborted', async () => {
      const file = new File(['abc'], 'sample.mp4', { type: 'video/mp4' });
      const controller = new AbortController();
      const cancelErr = new axios.CanceledError('aborted');
      mockS3Put.mockRejectedValueOnce(cancelErr);
      controller.abort();

      await expect(
        videoUploadService.uploadFileToS3(
          'https://s3.example.com/put',
          file,
          undefined,
          controller.signal
        )
      ).rejects.toSatisfy((err: unknown) => isUploadCancelledError(err));
    });
  });

  describe('completeUpload', () => {
    it('posts to /videos/completeUpload via apiClient', async () => {
      const mockRes: CompleteVideoUploadRes = {
        videoId: 'vid-123',
        status: 'UPLOADED',
        storageKey: 'videos/vid-123',
        etag: '"etag-1"',
      };
      vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockRes });

      const result = await videoUploadService.completeUpload({ videoId: 'vid-123' });

      expect(apiClient.post).toHaveBeenCalledWith('/videos/completeUpload', {
        videoId: 'vid-123',
      });
      expect(result).toEqual(mockRes);
    });
  });

  describe('subscribeStatusEvents (Axios SSE onDownloadProgress)', () => {
    it('parses incremental SSE frames including CRLF, split chunks, failed event, and tail flush', async () => {
      const received: VideoStatusEventPayload[] = [];
      const onComplete = vi.fn();
      const controller = new AbortController();

      const chunk1 =
        ': keep-alive\r\n\r\n' +
        'event: status\r\n' +
        'data: {"videoId":"vid-1","status":"UPLOADED","message":"Queued"}\r\n\r\n' +
        'event: processing\n' +
        'data: {"videoId":"vid-1","status":';

      const chunk2 =
        chunk1 +
        '"PROCESSING","message":"Transcoding"}\n\n';

      // Tail delivered without trailing \n\n when apiClient.get resolves
      const finalFullText =
        chunk2 +
        'event: failed\n' +
        'data: {"videoId":"vid-1","status":"FAILED","reason":"Corrupted video stream","errorCode":"INVALID_MEDIA"}';

      vi.mocked(apiClient.get).mockImplementationOnce(async (_url, config) => {
        config?.onDownloadProgress?.({
          loaded: chunk1.length,
          event: { target: { responseText: chunk1 } },
        } as unknown as AxiosProgressEvent);

        config?.onDownloadProgress?.({
          loaded: chunk2.length,
          event: { target: { responseText: chunk2 } },
        } as unknown as AxiosProgressEvent);

        return { data: finalFullText };
      });

      await videoUploadService.subscribeStatusEvents(
        'vid-1',
        {
          onEvent: (payload) => received.push(payload),
          onComplete,
        },
        controller.signal
      );

      expect(apiClient.get).toHaveBeenCalledWith(
        '/videos/vid-1/status/events',
        expect.objectContaining({
          headers: { Accept: 'text/event-stream' },
          responseType: 'text',
          signal: controller.signal,
          onDownloadProgress: expect.any(Function),
        })
      );

      expect(received).toEqual([
        {
          videoId: 'vid-1',
          status: 'UPLOADED',
          event: 'status',
          message: 'Queued',
        },
        {
          videoId: 'vid-1',
          status: 'PROCESSING',
          event: 'processing',
          message: 'Transcoding',
        },
        {
          videoId: 'vid-1',
          status: 'FAILED',
          event: 'failed',
          reason: 'Corrupted video stream',
          errorCode: 'INVALID_MEDIA',
        },
      ]);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('handles axios.isCancel cleanly without invoking onError', async () => {
      const onError = vi.fn();
      const onComplete = vi.fn();
      vi.mocked(apiClient.get).mockRejectedValueOnce(
        new axios.CanceledError('Stream aborted by user')
      );

      await expect(
        videoUploadService.subscribeStatusEvents('vid-1', {
          onEvent: vi.fn(),
          onError,
          onComplete,
        })
      ).resolves.toBeUndefined();

      expect(onError).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('passes mapped VideoUploadError to onError on non-cancel failures', async () => {
      const onError = vi.fn();
      vi.mocked(apiClient.get).mockRejectedValueOnce({
        response: { status: 404, data: { message: 'Not Found' } },
      });

      await expect(
        videoUploadService.subscribeStatusEvents('missing-id', {
          onEvent: vi.fn(),
          onError,
        })
      ).resolves.toBeUndefined();

      expect(onError).toHaveBeenCalledTimes(1);
      const errArg = onError.mock.calls[0][0];
      expect(errArg).toBeInstanceOf(VideoUploadError);
      expect(errArg.status).toBe(404);
    });
  });

  describe('Mock activation guard', () => {
    it('routes to mockVideoUploadService ONLY when NEXT_PUBLIC_USE_MOCK_VIDEO === "true"', async () => {
      process.env.NEXT_PUBLIC_USE_MOCK_VIDEO = 'true';
      mockVideoUploadService.reset();
      mockVideoUploadService.setStepDelayMs(0);

      const res = await videoUploadService.initiateUpload({
        title: 'Mock Video',
        fileName: 'mock.mp4',
        contentType: 'video/mp4',
        fileSize: 1024,
        videoConfig: { visibility: 'PUBLIC', allowComments: true },
      });

      expect(res.videoId).toBe('mock-video-1');
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('getVideoUploadErrorMessage', () => {
    it('returns fallback messages for 400 and unknown errors', () => {
      expect(getVideoUploadErrorMessage({ response: { status: 400, data: {} } })).toBe(
        'Thông tin video không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.'
      );
      expect(getVideoUploadErrorMessage(null)).toBe(
        'Đã xảy ra lỗi không xác định khi tải video lên.'
      );
    });
  });
});

describe('MockVideoUploadService', () => {
  let mockService: MockVideoUploadService;

  beforeEach(() => {
    mockService = new MockVideoUploadService({ stepDelayMs: 0 });
  });

  it('emits normal SSE progression (UPLOADED -> PROCESSING -> PROCESSED)', async () => {
    const events: VideoStatusEventPayload[] = [];
    const onComplete = vi.fn();

    await mockService.subscribeStatusEvents('mock-video-1', {
      onEvent: (payload) => events.push(payload),
      onComplete,
    });

    expect(events.map((e) => e.status)).toEqual([
      'UPLOADED',
      'PROCESSING',
      'PROCESSED',
    ]);
    expect(events.map((e) => e.event)).toEqual([
      'status',
      'processing',
      'completed',
    ]);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('emits simulated FAILED event with reason and errorCode for failure recovery testing', async () => {
    mockService.setSimulateFailure(
      true,
      'Unsupported codec H.266',
      'PROBE_FAILED'
    );
    const events: VideoStatusEventPayload[] = [];
    const onComplete = vi.fn();

    await mockService.subscribeStatusEvents('mock-video-fail-1', {
      onEvent: (payload) => events.push(payload),
      onComplete,
    });

    expect(events.map((e) => e.status)).toEqual([
      'UPLOADED',
      'PROCESSING',
      'FAILED',
    ]);
    const last = events[2];
    expect(last.event).toBe('failed');
    expect(last.reason).toBe('Unsupported codec H.266');
    expect(last.errorCode).toBe('PROBE_FAILED');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
