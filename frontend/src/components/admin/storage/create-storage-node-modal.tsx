'use client';

import React, { useState } from 'react';
import { CreateStorageNodeInput, StorageNode, StorageQuotaUnit } from '@/types/storage-admin';
import { getStorageErrorMessage, storageAdminService, toQuotaBytes } from '@/services/storage-admin.service';

interface CreateStorageNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (node: StorageNode) => void;
}

export function CreateStorageNodeModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateStorageNodeModalProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [quotaValue, setQuotaValue] = useState<number>(100);
  const [quotaUnit, setQuotaUnit] = useState<StorageQuotaUnit>('GB');
  const [isActive, setIsActive] = useState(true);

  // Group 2: S3 Config
  const [endpoint, setEndpoint] = useState('http://localhost:9000');
  const [region, setRegion] = useState('us-east-1');
  const [bucket, setBucket] = useState('mycast-media');
  const [forcePathStyle, setForcePathStyle] = useState(true);
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setId('');
    setName('');
    setQuotaValue(100);
    setQuotaUnit('GB');
    setIsActive(true);
    setEndpoint('http://localhost:9000');
    setRegion('us-east-1');
    setBucket('mycast-media');
    setForcePathStyle(true);
    setAccessKeyId('');
    setSecretAccessKey('');
    setShowSecret(false);
    setError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    const cleanId = id.trim();
    if (!cleanId) {
      setError('Mã Node lưu trữ (ID) là bắt buộc.');
      return;
    }
    if (!/^[a-z0-9-_]+$/.test(cleanId)) {
      setError('Mã Node chỉ được chứa chữ thường, số, dấu gạch ngang (-) hoặc gạch dưới (_).');
      return;
    }
    if (!name.trim()) {
      setError('Tên mô tả cụm lưu trữ là bắt buộc.');
      return;
    }
    if (quotaValue <= 0) {
      setError('Hạn mức dung lượng (Quota) phải lớn hơn 0.');
      return;
    }
    if (!endpoint.trim()) {
      setError('S3 Endpoint URL là bắt buộc.');
      return;
    }
    if (!bucket.trim()) {
      setError('Tên Bucket là bắt buộc.');
      return;
    }
    if (!accessKeyId.trim() || !secretAccessKey.trim()) {
      setError('Access Key ID và Secret Access Key là bắt buộc.');
      return;
    }

    try {
      setIsSubmitting(true);
      const quotaBytes = toQuotaBytes(quotaValue, quotaUnit);

      const payload: CreateStorageNodeInput = {
        id: cleanId,
        name: name.trim(),
        endpoint: endpoint.trim(),
        region: region.trim() || 'us-east-1',
        bucket: bucket.trim(),
        forcePathStyle,
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        quotaBytes,
        isActive,
      };

      const newNode = await storageAdminService.create(payload);
      resetForm();
      onSuccess(newNode);
    } catch (err: unknown) {
      setError(getStorageErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-2xl bg-[#2d2d2d] border border-[#525252] rounded-2xl shadow-2xl overflow-hidden transition-all text-[#ececec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#525252]/60 bg-[#1c1c1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9bf73c]/10 text-[#9bf73c] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#ececec]">Thêm Storage Node Mới</h3>
              <p className="text-xs text-[#8a8a8a]">Đăng ký cụm S3/MinIO lưu trữ đa phương tiện</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-[#8a8a8a] hover:text-[#ececec] p-1.5 rounded-lg hover:bg-[#3d3d3d] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-[#ff5c5c]/10 border border-[#ff5c5c]/30 rounded-xl text-xs text-[#ff5c5c] flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="flex-1 font-medium">{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nhóm 1: Định danh & Quota */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9bf73c] mb-3 flex items-center gap-1.5">
              <span>1. Định danh & Hạn mức</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ID */}
              <div>
                <label className="block text-xs font-medium text-[#d4d4d4] mb-1">
                  Mã Node ID <span className="text-[#ff5c5c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. minio-primary-01"
                  className="w-full px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm font-mono text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c]"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-[#d4d4d4] mb-1">
                  Tên Mô Tả <span className="text-[#ff5c5c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cụm MinIO Chính Local"
                  className="w-full px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c]"
                />
              </div>

              {/* Quota Value & Unit */}
              <div>
                <label className="block text-xs font-medium text-[#d4d4d4] mb-1">
                  Hạn mức Quota <span className="text-[#ff5c5c]">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quotaValue}
                    onChange={(e) => setQuotaValue(Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm text-[#ececec] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c]"
                  />
                  <select
                    value={quotaUnit}
                    onChange={(e) => setQuotaUnit(e.target.value as StorageQuotaUnit)}
                    className="w-24 px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm text-[#ececec] focus:outline-none focus:border-[#9bf73c]"
                  >
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                  </select>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 cursor-pointer py-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      isActive ? 'bg-[#9bf73c]' : 'bg-[#525252]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-[#1c1c1c] absolute top-0.5 transition-transform ${
                        isActive ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#ececec]">
                    Kích hoạt ngay khi tạo
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Nhóm 2: Cấu hình S3 */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9bf73c] mb-3 flex items-center gap-1.5">
              <span>2. Cấu hình Kết nối S3 & Bucket</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Endpoint */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#d4d4d4] mb-1">
                  S3 Endpoint URL <span className="text-[#ff5c5c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="http://localhost:9000 hoặc https://s3.ap-southeast-1.amazonaws.com"
                  className="w-full px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm font-mono text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c]"
                />
              </div>

              {/* Bucket */}
              <div>
                <label className="block text-xs font-medium text-[#d4d4d4] mb-1">
                  Tên Bucket <span className="text-[#ff5c5c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value)}
                  placeholder="mycast-media"
                  className="w-full px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c]"
                />
              </div>

              {/* Region */}
              <div>
                <label className="block text-xs font-medium text-[#d4d4d4] mb-1">
                  Region Mã Vùng
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="us-east-1"
                  className="w-full px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c]"
                />
              </div>

              {/* Access Key ID */}
              <div>
                <label className="block text-xs font-medium text-[#d4d4d4] mb-1">
                  Access Key ID <span className="text-[#ff5c5c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder="minioadmin hoặc AWS Access Key"
                  className="w-full px-3 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm font-mono text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c]"
                />
              </div>

              {/* Secret Access Key */}
              <div>
                <label className="block text-xs font-medium text-[#d4d4d4] mb-1">
                  Secret Access Key <span className="text-[#ff5c5c]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    required
                    value={secretAccessKey}
                    onChange={(e) => setSecretAccessKey(e.target.value)}
                    placeholder="Khóa bí mật S3"
                    className="w-full pl-3 pr-10 py-2 bg-[#3d3d3d] border border-[#525252] rounded-lg text-sm font-mono text-[#ececec] placeholder-[#8a8a8a] focus:outline-none focus:border-[#9bf73c] focus:ring-1 focus:ring-[#9bf73c]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8a8a8a] hover:text-[#ececec]"
                  >
                    {showSecret ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Force Path Style Toggle */}
              <div className="sm:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={forcePathStyle}
                    onChange={(e) => setForcePathStyle(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      forcePathStyle ? 'bg-[#9bf73c]' : 'bg-[#525252]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-[#1c1c1c] absolute top-0.5 transition-transform ${
                        forcePathStyle ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-[#ececec]">Force Path Style</span>
                    <span className="text-[#8a8a8a] ml-1.5">
                      (Bật cho MinIO / Local S3, Tắt cho AWS S3 tiêu chuẩn)
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#525252]/60">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#3d3d3d] hover:bg-[#525252] text-[#ececec] text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#9bf73c] hover:bg-[#b6fa6b] text-[#1c1c1c] text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-[#1c1c1c] border-t-transparent rounded-full animate-spin" />
              )}
              <span>{isSubmitting ? 'Đang kiểm tra & Lưu...' : 'Xác nhận tạo Node'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
