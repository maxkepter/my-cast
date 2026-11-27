'use client';

import React, { useRef, useState } from 'react';
import { AlertCircle, Film, UploadCloud } from 'lucide-react';
import {
  MAX_VIDEO_FILE_SIZE_BYTES,
  SUPPORTED_VIDEO_EXTENSIONS,
  SUPPORTED_VIDEO_MIME_TYPES,
} from '@/types/video-upload';

export interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  externalError?: string | null;
}

const EXTENSION_MIME_MAP: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.webm': 'video/webm',
  '.m4v': 'video/x-m4v',
};

export function resolveVideoMimeType(file: File): string {
  if (
    file.type &&
    (SUPPORTED_VIDEO_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    return file.type;
  }
  const lowerName = file.name.toLowerCase();
  const matchedExt = SUPPORTED_VIDEO_EXTENSIONS.find((ext) =>
    lowerName.endsWith(ext)
  );
  if (matchedExt) {
    return EXTENSION_MIME_MAP[matchedExt] ?? 'video/mp4';
  }
  return file.type || 'application/octet-stream';
}

export function validateSelectedVideoFile(file: File): string | null {
  if (file.size <= 0) {
    return 'Tệp video trống hoặc không thể đọc được. Vui lòng chọn tệp khác.';
  }

  if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    return 'Tệp video vượt quá dung lượng tối đa cho phép (100 MB).';
  }

  const lowerName = file.name.toLowerCase();
  const hasSupportedExtension = SUPPORTED_VIDEO_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );
  const hasSupportedMime = (
    SUPPORTED_VIDEO_MIME_TYPES as readonly string[]
  ).includes(file.type);

  const isAmbiguousBrowserMime =
    !file.type || file.type === 'application/octet-stream';

  if (hasSupportedMime || (isAmbiguousBrowserMime && hasSupportedExtension)) {
    return null;
  }

  return 'Định dạng tệp video không được hỗ trợ. Vui lòng chọn MP4, MKV, MOV, AVI, WEBM hoặc M4V.';
}

export function UploadDropzone({
  onFileSelected,
  disabled = false,
  externalError = null,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const displayError = validationError ?? externalError;

  const handleCandidateFile = (file: File | undefined) => {
    if (!file || disabled) {
      return;
    }
    const err = validateSelectedVideoFile(file);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    onFileSelected(file);
  };

  const openFilePicker = () => {
    if (disabled) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (disabled) {
      return;
    }
    const droppedFile = event.dataTransfer.files?.[0];
    handleCandidateFile(droppedFile);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFile = event.target.files?.[0];
    handleCandidateFile(pickedFile);
    event.target.value = '';
  };

  const handleZoneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  };

  return (
    <section
      aria-label="Khu vực chọn tệp video tải lên"
      className="bg-[#2d2d2d] border border-[#525252] rounded-2xl p-5 sm:p-8"
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={displayError ? 'upload-dropzone-error' : undefined}
        onClick={openFilePicker}
        onKeyDown={handleZoneKeyDown}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-[#141414] border-2 border-dashed rounded-xl py-14 sm:py-16 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9bf73c] ${
          isDragging
            ? 'border-[#9bf73c] bg-[#9bf73c]/5'
            : displayError
              ? 'border-[#ff5c5c]/70 hover:border-[#ff5c5c]'
              : 'border-[#525252] hover:border-[#9bf73c]/80'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          id="upload-video-file-input"
          type="file"
          accept="video/*,.mp4,.mkv,.mov,.avi,.webm,.m4v"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="Chọn tệp video từ máy"
        />

        <div className="w-20 h-20 rounded-full bg-[#2d2d2d] border border-[#525252] flex items-center justify-center mb-5">
          <UploadCloud className="w-10 h-10 text-[#9bf73c]" aria-hidden="true" />
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#ececec] tracking-tight">
          Kéo thả tệp video vào đây để bắt đầu
        </h2>

        <p className="mt-2 text-sm text-[#8a8a8a] max-w-md leading-relaxed">
          Hỗ trợ MP4, MKV, MOV, AVI, WEBM, M4V — Dung lượng tối đa 100 MB
        </p>

        <div className="mt-6">
          <button
            type="button"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#9bf73c] hover:bg-[#7ad81f] active:bg-[#5aa616] text-[#1c1c1c] font-bold text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ececec] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Film className="w-4 h-4 text-[#1c1c1c]" aria-hidden="true" />
            <span>Chọn tệp video từ máy</span>
          </button>
        </div>

        {displayError && (
          <div
            id="upload-dropzone-error"
            role="alert"
            className="mt-6 w-full max-w-lg rounded-xl border border-[#ff5c5c]/50 bg-[#ff5c5c]/10 px-4 py-3 text-xs sm:text-sm text-[#ff5c5c] flex items-center justify-center gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{displayError}</span>
          </div>
        )}
      </div>
    </section>
  );
}
