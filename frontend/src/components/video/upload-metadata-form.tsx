'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Globe,
  ImagePlus,
  Link2,
  Loader2,
  Lock,
  X,
} from 'lucide-react';
import { VideoVisibility } from '@/types/video';
import {
  MAX_THUMBNAIL_FILE_SIZE_BYTES,
  SUPPORTED_THUMBNAIL_MIME_TYPES,
} from '@/types/video-upload';
import { resolveVideoMimeType } from './upload-dropzone';

export interface UploadMetadataDraft {
  title: string;
  description: string;
  visibility: VideoVisibility;
  allowComments: boolean;
  scheduleAt: string;
  thumbnailFile: File | null;
}

export interface UploadMetadataFormProps {
  videoFile: File;
  draft: UploadMetadataDraft;
  onDraftChange: (next: UploadMetadataDraft) => void;
  onSubmit: (validatedDraft: UploadMetadataDraft) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  cancelNotice?: string | null;
}

interface VisibilityOption {
  value: VideoVisibility;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    value: 'PUBLIC',
    label: 'Công khai',
    description: 'Ai cũng xem được',
    icon: Globe,
  },
  {
    value: 'UNLISTED',
    label: 'Không công khai',
    description: 'Chỉ qua liên kết',
    icon: Link2,
  },
  {
    value: 'PRIVATE',
    label: 'Riêng tư',
    description: 'Chỉ mình bạn',
    icon: Lock,
  },
  {
    value: 'SCHEDULED',
    label: 'Lên lịch',
    description: 'Chọn giờ phát hành',
    icon: Clock,
  },
];

export function stripFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) {
    return fileName;
  }
  return fileName.slice(0, lastDot);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadMetadataForm({
  videoFile,
  draft,
  onDraftChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
  cancelNotice = null,
}: UploadMetadataFormProps) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const thumbnailImgRef = useRef<HTMLImageElement>(null);

  const [scheduleCheckNowMs, setScheduleCheckNowMs] = useState<number>(0);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{
    title: boolean;
    description: boolean;
    scheduleAt: boolean;
  }>({
    title: false,
    description: false,
    scheduleAt: false,
  });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    const videoEl = videoPreviewRef.current;
    if (!videoEl) {
      return;
    }
    const objectUrl = URL.createObjectURL(videoFile);
    videoEl.src = objectUrl;
    return () => {
      videoEl.removeAttribute('src');
      videoEl.load();
      URL.revokeObjectURL(objectUrl);
    };
  }, [videoFile]);

  useEffect(() => {
    const imgEl = thumbnailImgRef.current;
    if (!draft.thumbnailFile || !imgEl) {
      return;
    }
    const objectUrl = URL.createObjectURL(draft.thumbnailFile);
    imgEl.src = objectUrl;
    return () => {
      imgEl.removeAttribute('src');
      URL.revokeObjectURL(objectUrl);
    };
  }, [draft.thumbnailFile]);

  const titleError = useMemo(() => {
    const trimmed = draft.title.trim();
    if (!trimmed) {
      return 'Vui lòng nhập tiêu đề video.';
    }
    if (trimmed.length > 150) {
      return 'Tiêu đề video không được vượt quá 150 ký tự.';
    }
    return null;
  }, [draft.title]);

  const descriptionError = useMemo(() => {
    if (draft.description.length > 5000) {
      return 'Mô tả video không được vượt quá 5000 ký tự.';
    }
    return null;
  }, [draft.description]);

  const scheduleError = useMemo(() => {
    if (draft.visibility !== 'SCHEDULED') {
      return null;
    }
    if (!draft.scheduleAt) {
      return 'Vui lòng chọn ngày giờ phát hành cho video lên lịch.';
    }
    const parsedTime = new Date(draft.scheduleAt).getTime();
    if (
      Number.isNaN(parsedTime) ||
      (scheduleCheckNowMs > 0 && parsedTime <= scheduleCheckNowMs)
    ) {
      return 'Thời gian phát hành phải nằm trong tương lai.';
    }
    return null;
  }, [draft.visibility, draft.scheduleAt, scheduleCheckNowMs]);

  const showTitleError = (touched.title || hasAttemptedSubmit) && titleError;
  const showDescriptionError =
    (touched.description || hasAttemptedSubmit) && descriptionError;
  const showScheduleError =
    (touched.scheduleAt || hasAttemptedSubmit) && scheduleError;

  const isFormValid =
    !titleError && !descriptionError && !scheduleError && !thumbnailError;

  const updateField = <K extends keyof UploadMetadataDraft>(
    key: K,
    value: UploadMetadataDraft[K]
  ) => {
    onDraftChange({
      ...draft,
      [key]: value,
    });
  };

  const handleThumbnailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (
      !(SUPPORTED_THUMBNAIL_MIME_TYPES as readonly string[]).includes(file.type)
    ) {
      setThumbnailError(
        'Ảnh bìa chỉ hỗ trợ định dạng PNG, JPG hoặc WEBP.'
      );
      return;
    }

    if (file.size > MAX_THUMBNAIL_FILE_SIZE_BYTES) {
      setThumbnailError('Ảnh bìa vượt quá dung lượng tối đa 5 MB.');
      return;
    }

    setThumbnailError(null);
    updateField('thumbnailFile', file);
  };

  const handleClearThumbnail = () => {
    setThumbnailError(null);
    updateField('thumbnailFile', null);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nowMs = Date.now();
    setScheduleCheckNowMs(nowMs);
    setHasAttemptedSubmit(true);
    setTouched({ title: true, description: true, scheduleAt: true });

    const isScheduleValid =
      draft.visibility !== 'SCHEDULED' ||
      (Boolean(draft.scheduleAt) &&
        !Number.isNaN(new Date(draft.scheduleAt).getTime()) &&
        new Date(draft.scheduleAt).getTime() > nowMs);

    if (!isFormValid || !isScheduleValid || isSubmitting) {
      return;
    }

    onSubmit({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
    });
  };

  const resolvedMime = resolveVideoMimeType(videoFile);

  return (
    <form
      onSubmit={handleFormSubmit}
      noValidate
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    >
      {/* COL 1 (7/12): CHI TIẾT PHÁT HÀNH */}
      <section className="lg:col-span-7 bg-[#2d2d2d] border border-[#525252] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="border-b border-[#525252] pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#ececec]">
            Chi tiết phát hành
          </h2>
        </div>

        {cancelNotice && (
          <div
            role="status"
            className="rounded-xl border border-[#f7c93c]/50 bg-[#f7c93c]/10 px-4 py-3 text-xs sm:text-sm text-[#f7c93c] flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{cancelNotice}</span>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-[#ff5c5c]/60 bg-[#ff5c5c]/10 px-4 py-3 text-xs sm:text-sm text-[#ff5c5c] flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Tiêu đề video */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor="upload-video-title"
              className="text-sm font-semibold text-[#ececec]"
            >
              Tiêu đề video <span className="text-[#ff5c5c]">*</span>
            </label>
            <span className="text-xs font-mono text-[#8a8a8a]">
              {draft.title.length}/150
            </span>
          </div>
          <input
            id="upload-video-title"
            name="videoTitle"
            type="text"
            autoComplete="off"
            maxLength={150}
            value={draft.title}
            disabled={isSubmitting}
            onChange={(event) => updateField('title', event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            placeholder="Nhập tiêu đề video rõ ràng, thu hút người xem..."
            aria-invalid={Boolean(showTitleError)}
            aria-describedby={
              showTitleError ? 'upload-video-title-error' : undefined
            }
            className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#141414] border text-sm text-[#ececec] placeholder-[#8a8a8a] focus:outline-none transition-colors motion-reduce:transition-none ${
              showTitleError
                ? 'border-[#ff5c5c] focus:border-[#ff5c5c]'
                : 'border-[#3d3d3d] focus:border-[#9bf73c]'
            }`}
          />
          {showTitleError && (
            <p
              id="upload-video-title-error"
              role="alert"
              className="mt-1.5 text-xs text-[#ff5c5c] flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{showTitleError}</span>
            </p>
          )}
        </div>

        {/* Mô tả video */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor="upload-video-description"
              className="text-sm font-semibold text-[#ececec]"
            >
              Mô tả video
            </label>
            <span className="text-xs font-mono text-[#8a8a8a]">
              {draft.description.length}/5000
            </span>
          </div>
          <textarea
            id="upload-video-description"
            name="videoDescription"
            rows={4}
            maxLength={5000}
            value={draft.description}
            disabled={isSubmitting}
            onChange={(event) => updateField('description', event.target.value)}
            onBlur={() =>
              setTouched((prev) => ({ ...prev, description: true }))
            }
            placeholder="Giới thiệu nội dung chính, chương mục hoặc liên kết tài liệu..."
            aria-invalid={Boolean(showDescriptionError)}
            aria-describedby={
              showDescriptionError
                ? 'upload-video-description-error'
                : undefined
            }
            className={`w-full px-4 py-3 rounded-xl bg-[#141414] border text-sm text-[#ececec] placeholder-[#8a8a8a] focus:outline-none resize-y transition-colors motion-reduce:transition-none ${
              showDescriptionError
                ? 'border-[#ff5c5c] focus:border-[#ff5c5c]'
                : 'border-[#3d3d3d] focus:border-[#9bf73c]'
            }`}
          />
          {showDescriptionError && (
            <p
              id="upload-video-description-error"
              role="alert"
              className="mt-1.5 text-xs text-[#ff5c5c] flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{showDescriptionError}</span>
            </p>
          )}
        </div>

        {/* Chế độ hiển thị */}
        <div>
          <span
            id="upload-visibility-label"
            className="block text-sm font-semibold text-[#ececec] mb-2"
          >
            Chế độ hiển thị <span className="text-[#ff5c5c]">*</span>
          </span>
          <div
            role="radiogroup"
            aria-labelledby="upload-visibility-label"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {VISIBILITY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = draft.visibility === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isSubmitting}
                  onClick={() => {
                    if (option.value === 'SCHEDULED') {
                      setScheduleCheckNowMs(Date.now());
                    }
                    updateField('visibility', option.value);
                  }}
                  className={`min-h-[44px] w-full text-left p-3.5 rounded-xl border transition-all motion-reduce:transition-none flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf73c] ${
                    isSelected
                      ? 'border-[#9bf73c] bg-[#9bf73c]/10 text-[#ececec]'
                      : 'border-[#525252] bg-[#141414] text-[#d4d4d4] hover:border-[#8a8a8a]'
                  }`}
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-[#9bf73c]' : 'border-[#8a8a8a]'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#9bf73c]" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-[#ececec]">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-[#9bf73c]' : 'text-[#8a8a8a]'
                        }`}
                        aria-hidden={true}
                      />
                      <span>{option.label}</span>
                    </span>
                    <span className="block text-xs text-[#8a8a8a] mt-0.5">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional scheduleAt */}
        {draft.visibility === 'SCHEDULED' && (
          <div>
            <label
              htmlFor="upload-schedule-at"
              className="block text-sm font-semibold text-[#ececec] mb-1.5"
            >
              Ngày giờ phát hành <span className="text-[#ff5c5c]">*</span>
            </label>
            <input
              id="upload-schedule-at"
              name="scheduleAt"
              type="datetime-local"
              value={draft.scheduleAt}
              disabled={isSubmitting}
              onChange={(event) => {
                setScheduleCheckNowMs(Date.now());
                updateField('scheduleAt', event.target.value);
              }}
              onBlur={() => {
                setScheduleCheckNowMs(Date.now());
                setTouched((prev) => ({ ...prev, scheduleAt: true }));
              }}
              aria-invalid={Boolean(showScheduleError)}
              aria-describedby={
                showScheduleError ? 'upload-schedule-at-error' : undefined
              }
              className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-[#141414] border text-sm text-[#ececec] focus:outline-none transition-colors motion-reduce:transition-none ${
                showScheduleError
                  ? 'border-[#ff5c5c] focus:border-[#ff5c5c]'
                  : 'border-[#3d3d3d] focus:border-[#9bf73c]'
              }`}
            />
            {showScheduleError && (
              <p
                id="upload-schedule-at-error"
                role="alert"
                className="mt-1.5 text-xs text-[#ff5c5c] flex items-center gap-1.5"
              >
                <AlertCircle
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{showScheduleError}</span>
              </p>
            )}
          </div>
        )}

        {/* Allow comments switch */}
        <div className="pt-2 border-t border-[#525252] flex items-center justify-between gap-4 min-h-[44px]">
          <div>
            <span
              id="upload-allow-comments-label"
              className="text-sm font-semibold text-[#ececec]"
            >
              Bình luận
            </span>
            <p className="text-xs text-[#8a8a8a]">
              Cho phép người xem bình luận bên dưới video
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={draft.allowComments}
            aria-labelledby="upload-allow-comments-label"
            disabled={isSubmitting}
            onClick={() => updateField('allowComments', !draft.allowComments)}
            className={`relative inline-flex items-center w-12 h-7 rounded-full transition-colors motion-reduce:transition-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf73c] ${
              draft.allowComments ? 'bg-[#9bf73c]' : 'bg-[#3d3d3d]'
            }`}
          >
            <span
              className={`inline-block w-5 h-5 rounded-full transition-transform motion-reduce:transition-none ${
                draft.allowComments
                  ? 'translate-x-6 bg-[#1c1c1c]'
                  : 'translate-x-1 bg-[#ececec]'
              }`}
            />
          </button>
        </div>
      </section>

      {/* COL 2 (5/12): XEM TRƯỚC TRỰC TIẾP & XUẤT BẢN */}
      <aside className="lg:col-span-5 bg-[#2d2d2d] border border-[#525252] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="border-b border-[#525252] pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#ececec]">
            Xem trước trực tiếp
          </h2>
        </div>

        {/* Live Video Preview */}
        <div className="rounded-xl overflow-hidden bg-[#141414] border border-[#3d3d3d] aspect-video">
          <video
            ref={videoPreviewRef}
            controls
            preload="metadata"
            className="w-full h-full object-contain bg-[#141414]"
          />
        </div>

        {/* File Info */}
        <div className="rounded-xl bg-[#141414] border border-[#3d3d3d] p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#8a8a8a] shrink-0">Tên tệp:</span>
            <span
              className="text-[#ececec] font-medium truncate"
              title={videoFile.name}
            >
              {videoFile.name}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#8a8a8a] shrink-0">Dung lượng &amp; Loại:</span>
            <span className="text-[#d4d4d4] font-mono">
              {formatFileSize(videoFile.size)} / {resolvedMime}
            </span>
          </div>
        </div>

        {/* Optional Thumbnail Picker */}
        <div>
          <label className="block text-sm font-semibold text-[#ececec] mb-2">
            Ảnh bìa tùy chọn (tối đa 5 MB)
          </label>
          <input
            ref={thumbnailInputRef}
            id="upload-thumbnail-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleThumbnailChange}
            disabled={isSubmitting}
            className="hidden"
            aria-label="Chọn ảnh bìa tùy chọn"
          />

          {draft.thumbnailFile ? (
            <div className="space-y-2.5">
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#525252] bg-[#141414]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={thumbnailImgRef}
                  alt="Xem trước ảnh bìa video"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleClearThumbnail}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] border border-[#525252] hover:border-[#ff5c5c] hover:text-[#ff5c5c] text-xs font-semibold text-[#ececec] transition-colors motion-reduce:transition-none"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>Xóa ảnh</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => thumbnailInputRef.current?.click()}
              aria-describedby={
                thumbnailError ? 'upload-thumbnail-error' : undefined
              }
              className="min-h-[44px] w-full py-4 px-4 rounded-xl bg-[#141414] border border-dashed border-[#525252] hover:border-[#9bf73c] text-xs sm:text-sm text-[#d4d4d4] hover:text-[#ececec] flex items-center justify-center gap-2 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf73c]"
            >
              <ImagePlus
                className="w-4 h-4 text-[#9bf73c] shrink-0"
                aria-hidden="true"
              />
              <span>Chọn ảnh PNG/JPG/WEBP</span>
            </button>
          )}

          {thumbnailError && (
            <p
              id="upload-thumbnail-error"
              role="alert"
              className="mt-1.5 text-xs text-[#ff5c5c] flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{thumbnailError}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#525252] flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#141414] border border-[#525252] hover:bg-[#3d3d3d] text-sm font-semibold text-[#ececec] transition-colors motion-reduce:transition-none disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#9bf73c] hover:bg-[#7ad81f] active:bg-[#5aa616] text-[#1c1c1c] font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ececec]"
          >
            {isSubmitting && (
              <Loader2
                className="w-4 h-4 text-[#1c1c1c] animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            <span>
              {isSubmitting ? 'Đang khởi tạo...' : 'Tải lên & Xuất bản'}
            </span>
          </button>
        </div>
      </aside>
    </form>
  );
}
