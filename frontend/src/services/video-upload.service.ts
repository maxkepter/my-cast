import axios, { AxiosProgressEvent } from 'axios';
import { apiClient } from '@/lib/api-client';
import {
  CompleteVideoUploadReq,
  CompleteVideoUploadRes,
  InitiateVideoUploadReq,
  InitiateVideoUploadRes,
  UploadProgressInfo,
  VideoStatusEventPayload,
  VideoStatusSseEventType,
  VideoStatusStreamHandlers,
  VideoUploadServiceContract,
  VideoUploadStatus,
} from '@/types/video-upload';
import { mockVideoUploadService } from './video-upload.mock';

export const isMockVideoUploadEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_MOCK_VIDEO === 'true';
};

export class VideoUploadError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'VideoUploadError';
    this.status = status;
    this.code = code;
  }
}

interface HttpErrorShape {
  response?: {
    status?: number;
    data?: {
      code?: string;
      message?: string | string[];
    };
  };
  code?: string;
  name?: string;
  message?: string;
}

export function isUploadCancelledError(error: unknown): boolean {
  if (axios.isCancel(error)) {
    return true;
  }
  const err = error as HttpErrorShape | null | undefined;
  return (
    err?.name === 'CanceledError' ||
    err?.name === 'AbortError' ||
    err?.code === 'ERR_CANCELED'
  );
}

export function getVideoUploadErrorMessage(error: unknown): string {
  if (!error) {
    return 'Đã xảy ra lỗi không xác định khi tải video lên.';
  }

  const err = error as HttpErrorShape;
  const status = err.response?.status;
  const backendMessage = err.response?.data?.message;

  if (status === 413) {
    return 'Tệp video vượt quá dung lượng tối đa cho phép (100 MB).';
  }

  if (status === 415) {
    return 'Định dạng tệp video không được hỗ trợ. Vui lòng chọn MP4, MKV, MOV, AVI, WEBM hoặc M4V.';
  }

  if (status === 507) {
    return 'Hệ thống lưu trữ hiện không khả dụng hoặc đã hết dung lượng. Vui lòng thử lại sau.';
  }

  if (status === 400) {
    if (Array.isArray(backendMessage) && backendMessage.length > 0) {
      return `Thông tin video không hợp lệ: ${backendMessage.join(', ')}`;
    }
    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
    }
    return 'Thông tin video không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.';
  }

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Bạn không có quyền thực hiện thao tác tải lên cho video này.';
  }

  if (status === 404) {
    return 'Không tìm thấy phiên tải lên hoặc video được yêu cầu.';
  }

  if (status === 409) {
    return 'Video đang ở trạng thái không thể hoàn tất tải lên.';
  }

  if (Array.isArray(backendMessage) && backendMessage.length > 0) {
    return backendMessage.join(', ');
  }

  if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
    return backendMessage;
  }

  if (typeof err.message === 'string' && err.message.trim().length > 0) {
    return err.message;
  }

  return 'Đã xảy ra lỗi khi kết nối với máy chủ tải lên.';
}

function toVideoUploadError(error: unknown): VideoUploadError {
  if (error instanceof VideoUploadError) {
    return error;
  }
  const err = error as HttpErrorShape | null | undefined;
  return new VideoUploadError(
    getVideoUploadErrorMessage(error),
    err?.response?.status,
    err?.response?.data?.code ?? err?.code
  );
}

function inferSseEventType(
  eventName: string | undefined,
  status: VideoUploadStatus | undefined
): VideoStatusSseEventType | undefined {
  if (
    eventName === 'status' ||
    eventName === 'processing' ||
    eventName === 'completed' ||
    eventName === 'failed'
  ) {
    return eventName;
  }
  if (status === 'FAILED') return 'failed';
  if (status === 'PROCESSED') return 'completed';
  if (status === 'PROCESSING') return 'processing';
  if (status === 'UPLOADING' || status === 'UPLOADED') return 'status';
  return undefined;
}

function parseSseFrame(rawFrame: string): VideoStatusEventPayload | null {
  const lines = rawFrame.split('\n');
  let eventName: string | undefined;
  const dataLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (!line || line.startsWith(':')) {
      continue;
    }
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join('\n').trim();
  if (!rawData) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawData) as VideoStatusEventPayload;
    const inferredEvent = inferSseEventType(eventName ?? parsed.event, parsed.status);
    return {
      ...parsed,
      ...(inferredEvent ? { event: inferredEvent } : {}),
    };
  } catch {
    return null;
  }
}

export class VideoUploadService implements VideoUploadServiceContract {
  async initiateUpload(
    req: InitiateVideoUploadReq
  ): Promise<InitiateVideoUploadRes> {
    if (isMockVideoUploadEnabled()) {
      return mockVideoUploadService.initiateUpload(req);
    }

    try {
      const response = await apiClient.post<InitiateVideoUploadRes>(
        '/videos/upload',
        req
      );
      return response.data;
    } catch (error) {
      throw toVideoUploadError(error);
    }
  }

  async uploadFileToS3(
    uploadUrl: string,
    file: File | Blob,
    onProgress?: (progress: UploadProgressInfo) => void,
    signal?: AbortSignal
  ): Promise<void> {
    if (isMockVideoUploadEnabled()) {
      return mockVideoUploadService.uploadFileToS3(
        uploadUrl,
        file,
        onProgress,
        signal
      );
    }

    // Dedicated clean Axios instance so apiClient Bearer Authorization is never sent to S3 presigned URLs.
    const s3Client = axios.create();

    try {
      await s3Client.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        signal,
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (!onProgress) {
            return;
          }
          const loaded = progressEvent.loaded ?? 0;
          const total = progressEvent.total ?? file.size ?? 0;
          const percentage =
            total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
          onProgress({ loaded, total, percentage });
        },
      });
    } catch (error) {
      if (isUploadCancelledError(error) || signal?.aborted) {
        throw error;
      }
      throw toVideoUploadError(error);
    }
  }

  async completeUpload(
    req: CompleteVideoUploadReq
  ): Promise<CompleteVideoUploadRes> {
    if (isMockVideoUploadEnabled()) {
      return mockVideoUploadService.completeUpload(req);
    }

    try {
      const response = await apiClient.post<CompleteVideoUploadRes>(
        '/videos/completeUpload',
        req
      );
      return response.data;
    } catch (error) {
      throw toVideoUploadError(error);
    }
  }

  async subscribeStatusEvents(
    videoId: string,
    handlers: VideoStatusStreamHandlers,
    signal?: AbortSignal
  ): Promise<void> {
    if (isMockVideoUploadEnabled()) {
      return mockVideoUploadService.subscribeStatusEvents(
        videoId,
        handlers,
        signal
      );
    }

    let lastIndex = 0;
    let buffer = '';

    const processDelta = (delta: string, flushTail: boolean): void => {
      if (delta.length > 0) {
        buffer += delta;
      }

      const normalized = buffer.replace(/\r\n/g, '\n');
      const frames = normalized.split('\n\n');
      const completeFrames = flushTail ? frames : frames.slice(0, -1);
      buffer = flushTail ? '' : (frames[frames.length - 1] ?? '');

      for (const frame of completeFrames) {
        const trimmed = frame.trim();
        if (!trimmed) {
          continue;
        }
        const payload = parseSseFrame(trimmed);
        if (payload) {
          handlers.onEvent(payload);
        }
      }
    };

    try {
      const response = await apiClient.get<string>(
        `/videos/${encodeURIComponent(videoId)}/status/events`,
        {
          headers: {
            Accept: 'text/event-stream',
          },
          responseType: 'text',
          signal,
          onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
            const target = progressEvent.event?.target as
              | { responseText?: string }
              | undefined;
            const responseText = target?.responseText ?? '';
            if (responseText.length > lastIndex) {
              const delta = responseText.slice(lastIndex);
              lastIndex = responseText.length;
              processDelta(delta, false);
            }
          },
        }
      );

      const finalText = typeof response?.data === 'string' ? response.data : '';
      const tailDelta =
        finalText.length > lastIndex ? finalText.slice(lastIndex) : '';
      lastIndex = Math.max(lastIndex, finalText.length);

      if (tailDelta.length > 0 || buffer.trim().length > 0) {
        processDelta(tailDelta, true);
      }

      handlers.onComplete?.();
    } catch (error) {
      if (isUploadCancelledError(error) || signal?.aborted) {
        return;
      }

      const mappedError = toVideoUploadError(error);
      if (handlers.onError) {
        handlers.onError(mappedError);
        return;
      }
      throw mappedError;
    }
  }
}

export const videoUploadService = new VideoUploadService();
