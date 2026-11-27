'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { YtNavbar } from '@/components/youtube/yt-navbar';
import { YtSidebar } from '@/components/youtube/yt-sidebar';
import {
  UploadDropzone,
  resolveVideoMimeType,
} from '@/components/video/upload-dropzone';
import {
  UploadMetadataDraft,
  UploadMetadataForm,
  stripFileExtension,
} from '@/components/video/upload-metadata-form';
import {
  UploadPipelineStep,
  UploadProgressTracker,
} from '@/components/video/upload-progress-tracker';
import {
  getVideoUploadErrorMessage,
  isUploadCancelledError,
  videoUploadService,
} from '@/services/video-upload.service';
import {
  InitiateVideoUploadReq,
  UploadProgressInfo,
  VideoUploadStatus,
} from '@/types/video-upload';

type UploadPageStage = 'dropzone' | 'metadata' | 'progress';

function createInitialDraft(file: File | null): UploadMetadataDraft {
  return {
    title: file ? stripFileExtension(file.name).slice(0, 150) : '',
    description: '',
    visibility: 'PUBLIC',
    allowComments: true,
    scheduleAt: '',
    thumbnailFile: null,
  };
}

export default function UploadPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  const [stage, setStage] = useState<UploadPageStage>('dropzone');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<UploadMetadataDraft>(() =>
    createInitialDraft(null)
  );

  const [dropzoneError, setDropzoneError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cancelNotice, setCancelNotice] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);

  const [pipelineStep, setPipelineStep] =
    useState<UploadPipelineStep>('initiating');
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [videoId, setVideoId] = useState<string | null>(null);
  const [sseStatus, setSseStatus] = useState<VideoUploadStatus | null>(null);
  const [sseMessage, setSseMessage] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [failureErrorCode, setFailureErrorCode] = useState<string | null>(null);
  const [isPreSseFailure, setIsPreSseFailure] = useState(false);

  const uploadAbortRef = useRef<AbortController | null>(null);
  const sseAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/upload');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    return () => {
      uploadAbortRef.current?.abort();
      sseAbortRef.current?.abort();
    };
  }, []);

  const channelHref = user?.username ? `/channel/${user.username}` : '/';

  const abortActiveOperations = () => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;
    sseAbortRef.current?.abort();
    sseAbortRef.current = null;
  };

  const handleFileSelected = (file: File) => {
    abortActiveOperations();
    setSelectedFile(file);
    setDraft(createInitialDraft(file));
    setDropzoneError(null);
    setSubmitError(null);
    setCancelNotice(null);
    setVideoId(null);
    setSseStatus(null);
    setSseMessage(null);
    setFailureReason(null);
    setFailureErrorCode(null);
    setIsPreSseFailure(false);
    setStage('metadata');
  };

  const handleChangeFileOrReset = () => {
    abortActiveOperations();
    setSelectedFile(null);
    setDraft(createInitialDraft(null));
    setDropzoneError(null);
    setSubmitError(null);
    setCancelNotice(null);
    setIsInitiating(false);
    setVideoId(null);
    setSseStatus(null);
    setSseMessage(null);
    setFailureReason(null);
    setFailureErrorCode(null);
    setIsPreSseFailure(false);
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
    setStage('dropzone');
  };

  const handleCancelUpload = () => {
    abortActiveOperations();
    setIsInitiating(false);
    setCancelNotice(
      'Đã hủy tải lên. Bạn có thể chỉnh sửa thông tin hoặc chọn tệp khác.'
    );
    setSubmitError(null);
    setStage('metadata');
  };

  const handleReturnToMetadataEdit = () => {
    abortActiveOperations();
    setSubmitError(null);
    setCancelNotice(null);
    setStage('metadata');
  };

  const handleSubmitMetadata = async (validatedDraft: UploadMetadataDraft) => {
    if (!selectedFile) {
      setStage('dropzone');
      return;
    }

    abortActiveOperations();
    setDraft(validatedDraft);
    setSubmitError(null);
    setCancelNotice(null);
    setDropzoneError(null);
    setIsInitiating(true);
    setIsPreSseFailure(false);
    setVideoId(null);
    setSseStatus('UPLOADING');
    setSseMessage(null);
    setFailureReason(null);
    setFailureErrorCode(null);
    setUploadProgress({
      loaded: 0,
      total: selectedFile.size,
      percentage: 0,
    });

    const uploadController = new AbortController();
    uploadAbortRef.current = uploadController;

    const resolvedMime = resolveVideoMimeType(selectedFile);
    const reqPayload: InitiateVideoUploadReq = {
      title: validatedDraft.title,
      ...(validatedDraft.description
        ? { description: validatedDraft.description }
        : {}),
      fileName: selectedFile.name,
      contentType: resolvedMime,
      fileSize: selectedFile.size,
      ...(validatedDraft.thumbnailFile
        ? {
            thumbnailFileName: validatedDraft.thumbnailFile.name,
            thumbnailContentType: validatedDraft.thumbnailFile.type,
            thumbnailSize: validatedDraft.thumbnailFile.size,
          }
        : {}),
      videoConfig: {
        visibility: validatedDraft.visibility,
        allowComments: validatedDraft.allowComments,
        scheduleAt:
          validatedDraft.visibility === 'SCHEDULED' && validatedDraft.scheduleAt
            ? new Date(validatedDraft.scheduleAt).toISOString()
            : null,
      },
    };

    let enteredProgressStage = false;

    try {
      setPipelineStep('initiating');
      const initRes = await videoUploadService.initiateUpload(reqPayload);
      if (uploadController.signal.aborted) {
        return;
      }

      setIsInitiating(false);
      setVideoId(initRes.videoId);
      setSseStatus(initRes.status);
      enteredProgressStage = true;
      setStage('progress');
      setPipelineStep('uploading');

      await videoUploadService.uploadFileToS3(
        initRes.uploadUrl,
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
        },
        uploadController.signal
      );

      if (initRes.thumbnailUploadUrl && validatedDraft.thumbnailFile) {
        await videoUploadService.uploadFileToS3(
          initRes.thumbnailUploadUrl,
          validatedDraft.thumbnailFile,
          undefined,
          uploadController.signal
        );
      }

      if (uploadController.signal.aborted) {
        return;
      }

      setPipelineStep('completing');
      const completeRes = await videoUploadService.completeUpload({
        videoId: initRes.videoId,
      });

      if (uploadController.signal.aborted) {
        return;
      }

      setPipelineStep('sse');
      setSseStatus(completeRes.status);
      setSseMessage(
        completeRes.message ||
          'Đã tải tệp lên thành công. Hệ thống đang xử lý video (SSE trực tiếp).'
      );

      const sseController = new AbortController();
      sseAbortRef.current = sseController;

      let reachedTerminalState = false;

      await videoUploadService.subscribeStatusEvents(
        initRes.videoId,
        {
          onEvent: (payload) => {
            setSseStatus(payload.status);
            if (payload.message) {
              setSseMessage(payload.message);
            }

            if (payload.status === 'FAILED' || payload.event === 'failed') {
              reachedTerminalState = true;
              setPipelineStep('failed');
              setFailureReason(
                payload.reason ||
                  payload.message ||
                  'Quá trình xử lý video thất bại.'
              );
              setFailureErrorCode(payload.errorCode ?? null);
              return;
            }

            if (
              payload.status === 'PROCESSED' ||
              payload.event === 'completed'
            ) {
              reachedTerminalState = true;
              setPipelineStep('completed');
              return;
            }

            setPipelineStep('sse');
          },
          onError: (err) => {
            if (reachedTerminalState || sseController.signal.aborted) {
              return;
            }
            setIsPreSseFailure(false);
            setPipelineStep('failed');
            setSseStatus('FAILED');
            setFailureReason(err.message);
          },
          onComplete: () => {
            if (sseAbortRef.current === sseController) {
              sseAbortRef.current = null;
            }
          },
        },
        sseController.signal
      );
    } catch (error: unknown) {
      setIsInitiating(false);

      if (isUploadCancelledError(error) || uploadController.signal.aborted) {
        setCancelNotice(
          'Đã hủy tải lên. Bạn có thể chỉnh sửa thông tin hoặc chọn tệp khác.'
        );
        setStage('metadata');
        return;
      }

      const message = getVideoUploadErrorMessage(error);

      if (!enteredProgressStage) {
        setSubmitError(message);
        setStage('metadata');
        return;
      }

      setIsPreSseFailure(true);
      setPipelineStep('failed');
      setSseStatus('FAILED');
      setFailureReason(message);
    } finally {
      if (uploadAbortRef.current === uploadController) {
        uploadAbortRef.current = null;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1c1c1c] text-[#ececec] selection:bg-[#9bf73c] selection:text-[#1c1c1c]">
      <YtNavbar
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        <YtSidebar collapsed={sidebarCollapsed} />

        <main className="flex-1 overflow-y-auto py-8">
          <div
            className={`max-w-6xl mx-auto px-4 sm:px-6 space-y-6 transition-all duration-300 motion-reduce:transition-none ${
              hasEntered
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            {isLoading ? (
              <div className="bg-[#2d2d2d] border border-[#525252] rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2
                  className="w-7 h-7 text-[#9bf73c] animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                <p className="text-sm text-[#d4d4d4]">
                  Đang kiểm tra phiên đăng nhập MyCast Studio...
                </p>
              </div>
            ) : !isAuthenticated ? (
              <div className="bg-[#2d2d2d] border border-[#525252] rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4">
                <h1 className="text-xl font-bold text-[#ececec]">
                  Yêu cầu đăng nhập để tải video lên
                </h1>
                <p className="text-sm text-[#8a8a8a]">
                  Đang chuyển hướng đến trang đăng nhập MyCast...
                </p>
                <Link
                  href="/login?redirect=/upload"
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#9bf73c] hover:bg-[#7ad81f] active:bg-[#5aa616] text-[#1c1c1c] font-bold text-sm transition-all motion-reduce:transition-none"
                >
                  <LogIn className="w-4 h-4 text-[#1c1c1c]" aria-hidden="true" />
                  <span>Đăng nhập ngay</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Top Navigation & Studio Header */}
                <header className="space-y-3">
                  <Link
                    href={channelHref}
                    className="min-h-[44px] inline-flex items-center gap-2 text-sm font-medium text-[#d4d4d4] hover:text-[#9bf73c] transition-colors motion-reduce:transition-none"
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Quay lại Kênh của tôi</span>
                  </Link>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#ececec] tracking-tight">
                        Tải video lên
                      </h1>
                      <p className="mt-1 text-sm text-[#8a8a8a]">
                        Chọn tệp video nguồn (tối đa 100 MB), thiết lập hiển thị
                        và theo dõi tiến trình xử lý.
                      </p>
                    </div>

                    {stage === 'metadata' && selectedFile && (
                      <button
                        type="button"
                        disabled={isInitiating}
                        onClick={handleChangeFileOrReset}
                        className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2d2d2d] border border-[#525252] hover:bg-[#3d3d3d] text-sm font-semibold text-[#ececec] transition-colors motion-reduce:transition-none disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" aria-hidden="true" />
                        <span>Đổi tệp khác</span>
                      </button>
                    )}
                  </div>
                </header>

                {/* Stage Views */}
                {stage === 'dropzone' && (
                  <UploadDropzone
                    onFileSelected={handleFileSelected}
                    externalError={dropzoneError}
                  />
                )}

                {stage === 'metadata' && selectedFile && (
                  <UploadMetadataForm
                    videoFile={selectedFile}
                    draft={draft}
                    onDraftChange={setDraft}
                    onSubmit={handleSubmitMetadata}
                    onCancel={handleChangeFileOrReset}
                    isSubmitting={isInitiating}
                    submitError={submitError}
                    cancelNotice={cancelNotice}
                  />
                )}

                {stage === 'progress' && selectedFile && (
                  <UploadProgressTracker
                    videoTitle={draft.title || selectedFile.name}
                    videoId={videoId}
                    pipelineStep={pipelineStep}
                    progress={uploadProgress}
                    sseStatus={sseStatus}
                    sseMessage={sseMessage}
                    failureReason={failureReason}
                    failureErrorCode={failureErrorCode}
                    channelHref={channelHref}
                    onCancelUpload={handleCancelUpload}
                    onResetNewUpload={handleChangeFileOrReset}
                    onRetryMetadata={
                      isPreSseFailure ? handleReturnToMetadataEdit : undefined
                    }
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
