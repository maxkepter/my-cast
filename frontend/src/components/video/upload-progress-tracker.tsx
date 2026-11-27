'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { UploadProgressInfo, VideoUploadStatus } from '@/types/video-upload';
import { formatFileSize } from './upload-metadata-form';

export type UploadPipelineStep =
  | 'initiating'
  | 'uploading'
  | 'completing'
  | 'sse'
  | 'completed'
  | 'failed';

export interface UploadProgressTrackerProps {
  videoTitle: string;
  videoId: string | null;
  pipelineStep: UploadPipelineStep;
  progress: UploadProgressInfo;
  sseStatus: VideoUploadStatus | null;
  sseMessage: string | null;
  failureReason: string | null;
  failureErrorCode?: string | null;
  channelHref: string;
  onCancelUpload: () => void;
  onResetNewUpload: () => void;
  onRetryMetadata?: () => void;
}

interface StepItem {
  id: number;
  label: string;
  state: 'pending' | 'active' | 'done' | 'error';
}

function computeSteps(
  pipelineStep: UploadPipelineStep,
  percentage: number
): StepItem[] {
  const stepOrder: Record<UploadPipelineStep, number> = {
    initiating: 1,
    uploading: 2,
    completing: 3,
    sse: 4,
    completed: 5,
    failed: 4,
  };

  const currentRank = stepOrder[pipelineStep];
  const isFailed = pipelineStep === 'failed';

  return [
    {
      id: 1,
      label: '1. Khởi tạo phiên tải',
      state:
        currentRank > 1
          ? 'done'
          : currentRank === 1
            ? isFailed
              ? 'error'
              : 'active'
            : 'pending',
    },
    {
      id: 2,
      label:
        pipelineStep === 'uploading'
          ? `2. Tải tệp lên S3 (${percentage}%)`
          : '2. Tải tệp lên S3',
      state:
        currentRank > 2
          ? 'done'
          : currentRank === 2
            ? isFailed
              ? 'error'
              : 'active'
            : 'pending',
    },
    {
      id: 3,
      label: '3. Đưa vào hàng đợi',
      state:
        currentRank > 3
          ? 'done'
          : currentRank === 3
            ? isFailed
              ? 'error'
              : 'active'
            : 'pending',
    },
    {
      id: 4,
      label: '4. Chuyển mã (SSE)',
      state:
        pipelineStep === 'completed'
          ? 'done'
          : pipelineStep === 'failed'
            ? 'error'
            : pipelineStep === 'sse'
              ? 'active'
              : 'pending',
    },
  ];
}

export function UploadProgressTracker({
  videoTitle,
  videoId,
  pipelineStep,
  progress,
  sseStatus,
  sseMessage,
  failureReason,
  failureErrorCode,
  channelHref,
  onCancelUpload,
  onResetNewUpload,
  onRetryMetadata,
}: UploadProgressTrackerProps) {
  const steps = computeSteps(pipelineStep, progress.percentage);
  const canCancel =
    pipelineStep === 'initiating' || pipelineStep === 'uploading';
  const showSseCard =
    pipelineStep === 'sse' ||
    pipelineStep === 'completed' ||
    pipelineStep === 'failed';

  const displayPercentage =
    pipelineStep === 'completing' ||
    pipelineStep === 'sse' ||
    pipelineStep === 'completed'
      ? 100
      : progress.percentage;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold text-[#ececec]">
          Tiến trình tải lên &amp; xử lý video:{' '}
          <span className="text-[#9bf73c]">&ldquo;{videoTitle}&rdquo;</span>
        </h2>
      </div>

      {/* 4-STEP STEPPER + S3 PROGRESS BAR */}
      <section className="bg-[#2d2d2d] border border-[#525252] rounded-2xl p-5 sm:p-6 space-y-6">
        <ol
          aria-label="Các bước tải lên và xử lý video"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {steps.map((step) => {
            const borderClass =
              step.state === 'done'
                ? 'border-[#9bf73c]/60 bg-[#9bf73c]/10'
                : step.state === 'active'
                  ? 'border-[#9bf73c] bg-[#141414]'
                  : step.state === 'error'
                    ? 'border-[#ff5c5c]/60 bg-[#ff5c5c]/10'
                    : 'border-[#3d3d3d] bg-[#141414]';

            return (
              <li
                key={step.id}
                className={`rounded-xl border px-3.5 py-3 flex items-center gap-2.5 text-xs sm:text-sm font-medium ${borderClass}`}
              >
                {step.state === 'done' && (
                  <CheckCircle2
                    className="w-4 h-4 text-[#9bf73c] shrink-0"
                    aria-hidden="true"
                  />
                )}
                {step.state === 'active' && (
                  <Loader2
                    className="w-4 h-4 text-[#9bf73c] animate-spin motion-reduce:animate-none shrink-0"
                    aria-hidden="true"
                  />
                )}
                {step.state === 'error' && (
                  <AlertCircle
                    className="w-4 h-4 text-[#ff5c5c] shrink-0"
                    aria-hidden="true"
                  />
                )}
                {step.state === 'pending' && (
                  <span
                    className="w-4 h-4 rounded-full border border-[#525252] shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={
                    step.state === 'pending'
                      ? 'text-[#8a8a8a]'
                      : step.state === 'error'
                        ? 'text-[#ff5c5c]'
                        : 'text-[#ececec]'
                  }
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        {/* S3 Upload Progress Bar */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
            <span className="text-[#d4d4d4] font-medium">
              Tiến trình truyền tải S3:
            </span>
            <span className="font-mono text-[#ececec]">
              {displayPercentage}% ({formatFileSize(progress.loaded)} /{' '}
              {formatFileSize(progress.total)})
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Tiến trình tải tệp video lên S3"
            aria-valuenow={displayPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-3 rounded-full bg-[#141414] border border-[#3d3d3d] overflow-hidden"
          >
            <div
              className={`h-full transition-all duration-200 motion-reduce:transition-none ${
                pipelineStep === 'failed' ? 'bg-[#ff5c5c]' : 'bg-[#9bf73c]'
              }`}
              style={{ width: `${displayPercentage}%` }}
            />
          </div>

          {canCancel && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onCancelUpload}
                className="min-h-[44px] inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#141414] border border-[#525252] hover:border-[#ff5c5c] hover:text-[#ff5c5c] text-xs sm:text-sm font-semibold text-[#ececec] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5c5c]"
              >
                Hủy tải lên
              </button>
            </div>
          )}
        </div>
      </section>

      {/* LIVE SSE STATUS / TERMINAL CARD */}
      <div aria-live="polite" className="space-y-4">
        {showSseCard && pipelineStep === 'failed' && (
          <section
            role="alert"
            className="bg-[#2d2d2d] border border-[#ff5c5c]/60 rounded-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="w-5 h-5 text-[#ff5c5c] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-base font-bold text-[#ff5c5c]">
                    Xử lý video thất bại (FAILED)
                  </h3>
                  {videoId && (
                    <p className="text-xs font-mono text-[#8a8a8a] mt-0.5">
                      Video ID: {videoId}
                    </p>
                  )}
                </div>
              </div>

              {failureErrorCode && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#ff5c5c]/15 border border-[#ff5c5c]/40 text-[11px] font-mono font-semibold text-[#ff5c5c]">
                  {failureErrorCode}
                </span>
              )}
            </div>

            <div className="rounded-xl bg-[#141414] border border-[#ff5c5c]/30 p-4 space-y-2 text-sm">
              <p className="text-[#ececec]">
                <span className="font-semibold text-[#ff5c5c]">
                  Lý do từ hệ thống:{' '}
                </span>
                <span>
                  &ldquo;
                  {failureReason ||
                    sseMessage ||
                    'Quá trình chuyển mã hoặc kiểm tra video gặp sự cố.'}
                  &rdquo;
                </span>
              </p>
              <p className="text-xs text-[#8a8a8a]">
                Gợi ý: Kiểm tra lại tệp nguồn (H.264/AAC MP4 hợp lệ) rồi thử
                tải lên lại.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onResetNewUpload}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#9bf73c] hover:bg-[#7ad81f] active:bg-[#5aa616] text-[#1c1c1c] font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ececec]"
              >
                <RotateCcw className="w-4 h-4 text-[#1c1c1c]" aria-hidden="true" />
                <span>Chọn &amp; Tải lên lại video khác</span>
              </button>

              {onRetryMetadata && (
                <button
                  type="button"
                  onClick={onRetryMetadata}
                  className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#141414] border border-[#525252] hover:bg-[#3d3d3d] text-sm font-semibold text-[#ececec] transition-colors motion-reduce:transition-none"
                >
                  Quay lại chỉnh sửa
                </button>
              )}

              <Link
                href={channelHref}
                className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#141414] border border-[#525252] hover:bg-[#3d3d3d] text-sm font-semibold text-[#ececec] transition-colors motion-reduce:transition-none"
              >
                Về kênh của tôi
              </Link>
            </div>
          </section>
        )}

        {showSseCard && pipelineStep !== 'failed' && (
          <section
            className={`bg-[#2d2d2d] rounded-2xl p-5 sm:p-6 space-y-4 border ${
              pipelineStep === 'completed'
                ? 'border-[#9bf73c]/60'
                : 'border-[#525252]'
            }`}
          >
            <div className="flex items-start gap-3">
              {pipelineStep === 'completed' ? (
                <CheckCircle2
                  className="w-5 h-5 text-[#9bf73c] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <Loader2
                  className="w-5 h-5 text-[#9bf73c] animate-spin motion-reduce:animate-none shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}

              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#ececec]">
                  {sseMessage ||
                    (pipelineStep === 'completed'
                      ? 'Video đã được xử lý và sẵn sàng phát.'
                      : 'Đã tải tệp lên thành công. Hệ thống đang xử lý video (SSE trực tiếp).')}
                </h3>
                <p className="text-xs font-mono text-[#8a8a8a]">
                  Video ID: {videoId ?? '—'} | Trạng thái:{' '}
                  <span className="text-[#9bf73c] font-semibold">
                    {sseStatus ?? 'UPLOADED'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {videoId && (
                <Link
                  href={`/watch/${encodeURIComponent(videoId)}`}
                  className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#9bf73c] hover:bg-[#7ad81f] active:bg-[#5aa616] text-[#1c1c1c] font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ececec]"
                >
                  Xem trang video
                </Link>
              )}

              <button
                type="button"
                onClick={onResetNewUpload}
                className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#141414] border border-[#525252] hover:bg-[#3d3d3d] text-sm font-semibold text-[#ececec] transition-colors motion-reduce:transition-none"
              >
                Tải lên video khác
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
