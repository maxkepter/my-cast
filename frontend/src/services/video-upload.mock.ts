import {
  CompleteVideoUploadReq,
  CompleteVideoUploadRes,
  InitiateVideoUploadReq,
  InitiateVideoUploadRes,
  MAX_VIDEO_FILE_SIZE_BYTES,
  SUPPORTED_VIDEO_MIME_TYPES,
  UploadProgressInfo,
  VideoStatusEventPayload,
  VideoStatusStreamHandlers,
  VideoUploadServiceContract,
} from '@/types/video-upload';

export class MockVideoUploadHttpError extends Error {
  response: {
    status: number;
    data: {
      code?: string;
      message: string;
    };
  };

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'MockVideoUploadHttpError';
    this.response = {
      status,
      data: { code, message },
    };
  }
}

export interface MockVideoUploadOptions {
  simulateFailure?: boolean;
  failureReason?: string;
  failureErrorCode?: string;
  stepDelayMs?: number;
}

const DEFAULT_FAILURE_REASON =
  'Corrupted video stream or unsupported codec (video.process.failed)';

function createAbortError(): Error {
  const err = new Error('Upload cancelled');
  err.name = 'CanceledError';
  return err;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return signal?.aborted ? Promise.reject(createAbortError()) : Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(createAbortError());
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export class MockVideoUploadService implements VideoUploadServiceContract {
  private simulateFailure: boolean;
  private failureReason: string;
  private failureErrorCode: string;
  private stepDelayMs: number;
  private sequence = 0;

  constructor(options: MockVideoUploadOptions = {}) {
    this.simulateFailure = options.simulateFailure ?? false;
    this.failureReason = options.failureReason ?? DEFAULT_FAILURE_REASON;
    this.failureErrorCode = options.failureErrorCode ?? 'INVALID_MEDIA';
    this.stepDelayMs = options.stepDelayMs ?? 350;
  }

  setSimulateFailure(
    enabled: boolean,
    reason = DEFAULT_FAILURE_REASON,
    errorCode = 'INVALID_MEDIA'
  ): void {
    this.simulateFailure = enabled;
    this.failureReason = reason;
    this.failureErrorCode = errorCode;
  }

  setStepDelayMs(ms: number): void {
    this.stepDelayMs = Math.max(0, ms);
  }

  reset(): void {
    this.simulateFailure = false;
    this.failureReason = DEFAULT_FAILURE_REASON;
    this.failureErrorCode = 'INVALID_MEDIA';
    this.stepDelayMs = 350;
    this.sequence = 0;
  }

  async initiateUpload(
    req: InitiateVideoUploadReq
  ): Promise<InitiateVideoUploadRes> {
    if (req.fileSize > MAX_VIDEO_FILE_SIZE_BYTES) {
      throw new MockVideoUploadHttpError(
        413,
        'Tệp video vượt quá dung lượng tối đa cho phép (100 MB).',
        'PAYLOAD_TOO_LARGE'
      );
    }

    const isSupportedMime = (
      SUPPORTED_VIDEO_MIME_TYPES as readonly string[]
    ).includes(req.contentType);
    if (!isSupportedMime) {
      throw new MockVideoUploadHttpError(
        415,
        'Định dạng tệp video không được hỗ trợ. Vui lòng chọn MP4, MKV, MOV, AVI, WEBM hoặc M4V.',
        'UNSUPPORTED_MEDIA_TYPE'
      );
    }

    this.sequence += 1;
    const isFailTrigger =
      this.simulateFailure || req.title.toLowerCase().includes('[fail]');
    const videoId = isFailTrigger
      ? `mock-video-fail-${this.sequence}`
      : `mock-video-${this.sequence}`;
    const storageKey = `videos/${videoId}`;

    return {
      videoId,
      storageKey,
      videoKey: `${storageKey}/video`,
      uploadUrl: `https://mock-s3.mycast.local/${storageKey}/video?X-Amz-Signature=mock`,
      ...(req.thumbnailFileName
        ? {
            thumbnailKey: `${storageKey}/thumbnail`,
            thumbnailUploadUrl: `https://mock-s3.mycast.local/${storageKey}/thumbnail?X-Amz-Signature=mock`,
          }
        : {}),
      status: 'UPLOADING',
      expiresInSeconds: 900,
    };
  }

  async uploadFileToS3(
    _uploadUrl: string,
    file: File | Blob,
    onProgress?: (progress: UploadProgressInfo) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const total = file.size || 1024;
    const steps = [0.25, 0.65, 1];

    for (const ratio of steps) {
      await delay(Math.min(this.stepDelayMs, 150), signal);
      const loaded = Math.round(total * ratio);
      onProgress?.({
        loaded,
        total,
        percentage: Math.round(ratio * 100),
      });
    }
  }

  async completeUpload(
    req: CompleteVideoUploadReq
  ): Promise<CompleteVideoUploadRes> {
    return {
      videoId: req.videoId,
      status: 'UPLOADED',
      storageKey: `videos/${req.videoId}`,
      etag: '"mock-s3-etag-001"',
      message: 'Video upload completed and queued for processing',
    };
  }

  async subscribeStatusEvents(
    videoId: string,
    handlers: VideoStatusStreamHandlers,
    signal?: AbortSignal
  ): Promise<void> {
    const shouldFail =
      this.simulateFailure ||
      videoId.includes('fail') ||
      process.env.NEXT_PUBLIC_MOCK_VIDEO_FAIL === 'true';

    const events: VideoStatusEventPayload[] = shouldFail
      ? [
          {
            videoId,
            status: 'UPLOADED',
            event: 'status',
            message: 'Đã tải tệp lên S3, đang chờ xử lý.',
            updatedAt: new Date().toISOString(),
          },
          {
            videoId,
            status: 'PROCESSING',
            event: 'processing',
            message: 'Hệ thống đang chuyển mã video...',
            updatedAt: new Date().toISOString(),
          },
          {
            videoId,
            status: 'FAILED',
            event: 'failed',
            message: this.failureReason,
            reason: this.failureReason,
            errorCode: this.failureErrorCode,
            updatedAt: new Date().toISOString(),
          },
        ]
      : [
          {
            videoId,
            status: 'UPLOADED',
            event: 'status',
            message: 'Đã tải tệp lên S3, đang chờ xử lý.',
            updatedAt: new Date().toISOString(),
          },
          {
            videoId,
            status: 'PROCESSING',
            event: 'processing',
            message: 'Hệ thống đang chuyển mã video...',
            updatedAt: new Date().toISOString(),
          },
          {
            videoId,
            status: 'PROCESSED',
            event: 'completed',
            message: 'Video đã được xử lý và sẵn sàng phát.',
            updatedAt: new Date().toISOString(),
          },
        ];

    try {
      for (const payload of events) {
        await delay(this.stepDelayMs, signal);
        if (signal?.aborted) {
          return;
        }
        handlers.onEvent(payload);
      }

      handlers.onComplete?.();
    } catch (error) {
      if (signal?.aborted || (error as { name?: string })?.name === 'CanceledError') {
        return;
      }
      const mapped =
        error instanceof Error ? error : new Error('Mock SSE stream error');
      if (handlers.onError) {
        handlers.onError(mapped);
        return;
      }
      throw mapped;
    }
  }
}

export const mockVideoUploadService = new MockVideoUploadService();
