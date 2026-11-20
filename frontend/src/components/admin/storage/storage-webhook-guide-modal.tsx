'use client';

import React, { useState } from 'react';
import { StorageNode } from '@/types/storage-admin';
import { getStorageNodeWebhookUrl } from '@/services/storage-admin.service';

interface StorageWebhookGuideModalProps {
  isOpen: boolean;
  node: StorageNode | null;
  onClose: () => void;
}

type ProviderTab = 'minio' | 's3' | 'r2';

export function StorageWebhookGuideModal({
  isOpen,
  node,
  onClose,
}: StorageWebhookGuideModalProps) {
  const [activeTab, setActiveTab] = useState<ProviderTab>('minio');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !node) return null;

  const webhookUrl = getStorageNodeWebhookUrl(node.nodeId);
  const bucket = node.bucket || '<bucket-name>';
  const nodeId = node.nodeId;

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback if clipboard access is denied
    }
  };

  const minioCommands = [
    `# 1. Cấu hình Webhook Target trên MinIO Server`,
    `mc admin config set myminio notify_webhook:mycast_hook endpoint="${webhookUrl}"`,
    ``,
    `# 2. Khởi động lại dịch vụ MinIO để áp dụng cấu hình`,
    `mc admin service restart myminio`,
    ``,
    `# 3. Gán sự kiện ObjectCreated (Put) của bucket "${bucket}" tới webhook`,
    `mc event add myminio/${bucket} arn:minio:sqs::mycast_hook:webhook --event put`,
  ].join('\n');

  const awsSnsPolicy = `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "s3.amazonaws.com" },
      "Action": "SNS:Publish",
      "Resource": "arn:aws:sns:${node.region}:<account-id>:mycast-s3-uploads-topic",
      "Condition": {
        "ArnLike": {
          "aws:SourceArn": "arn:aws:s3:::${bucket}"
        }
      }
    }
  ]
}`;

  const cfWorkerCode = `// Cloudflare Worker: Forward R2 Event Notification to MyCast Webhook
export default {
  async queue(batch: MessageBatch<R2EventNotification>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      if (msg.body.action === 'PutObject' || msg.body.action === 'CompleteMultipartUpload') {
        const payload = {
          Records: [
            {
              eventName: 's3:ObjectCreated:Put',
              s3: {
                bucket: { name: '${bucket}' },
                object: { key: msg.body.object.key, size: msg.body.object.size },
              },
            },
          ],
        };

        await fetch('${webhookUrl}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      msg.ack();
    }
  },
};`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-[#2d2d2d] border border-[#525252]/60 rounded-2xl shadow-2xl flex flex-col text-[#ececec] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#525252]/60 bg-[#1c1c1c]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#9bf73c]/10 text-[#9bf73c] border border-[#9bf73c]/30">
                Webhook Integration
              </span>
              <span className="text-xs text-[#8a8a8a]">Node: {node.name}</span>
            </div>
            <h3 className="text-lg font-bold text-[#ececec]">
              Hướng Dẫn Cấu Hình Event Webhook
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8a8a8a] hover:text-[#ececec] p-2 rounded-lg hover:bg-[#3d3d3d] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Webhook URL Banner */}
        <div className="p-4 bg-[#141414] border-b border-[#525252]/40">
          <div className="flex items-center justify-between text-xs text-[#8a8a8a] mb-1.5">
            <span className="font-medium text-[#ececec]">Callback Webhook URL của Node:</span>
            <span className="font-mono text-[#9bf73c]">nodeId: {nodeId}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 bg-[#1c1c1c] text-[#ececec] font-mono text-xs px-3 py-2 rounded-lg border border-[#525252]/60 focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={() => handleCopy('main_url', webhookUrl)}
              className="px-3.5 py-2 bg-[#9bf73c] hover:bg-[#b6fa6b] text-[#1c1c1c] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedKey === 'main_url' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Đã chép!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Provider Tabs */}
        <div className="flex border-b border-[#525252]/60 bg-[#1c1c1c] px-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('minio')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'minio'
                ? 'border-[#9bf73c] text-[#9bf73c] bg-[#2d2d2d]'
                : 'border-transparent text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            MinIO (mc CLI / Console)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('s3')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 's3'
                ? 'border-[#9bf73c] text-[#9bf73c] bg-[#2d2d2d]'
                : 'border-transparent text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            AWS S3 (qua SNS Topic)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('r2')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              activeTab === 'r2'
                ? 'border-[#9bf73c] text-[#9bf73c] bg-[#2d2d2d]'
                : 'border-transparent text-[#8a8a8a] hover:text-[#ececec]'
            }`}
          >
            Cloudflare R2 (Worker Bridge)
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {/* TAB 1: MinIO */}
          {activeTab === 'minio' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-[#ececec] text-sm mb-1">
                  Cách 1: Cấu hình nhanh qua MinIO Client (`mc`)
                </h4>
                <p className="text-xs text-[#8a8a8a] mb-2.5">
                  Thực thi các lệnh sau trên terminal đã kết nối alias `myminio`:
                </p>
                <div className="relative group">
                  <pre className="bg-[#141414] border border-[#525252]/40 p-3.5 rounded-xl text-xs font-mono text-[#d4d4d4] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {minioCommands}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy('minio_mc', minioCommands)}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-[#3d3d3d] hover:bg-[#525252] text-[#ececec] hover:text-[#9bf73c] rounded text-xs flex items-center gap-1 border border-[#525252] cursor-pointer"
                  >
                    {copiedKey === 'minio_mc' ? 'Đã copy!' : 'Copy commands'}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#525252]/40">
                <h4 className="font-semibold text-[#ececec] text-sm mb-1">
                  Cách 2: Cấu hình qua MinIO Console UI
                </h4>
                <ol className="list-decimal list-inside text-xs text-[#8a8a8a] space-y-1.5 leading-relaxed pl-1">
                  <li>Truy cập MinIO Console → vào mục <strong className="text-[#ececec]">Administrator → Event Destinations</strong>.</li>
                  <li>Bấm <strong className="text-[#ececec]">Add Destination</strong>, chọn <strong className="text-[#ececec]">Webhook</strong>.</li>
                  <li>Nhập Identifier <code className="text-[#9bf73c]">mycast_hook</code> và dán URL: <code className="text-[#d4d4d4] break-all">{webhookUrl}</code>.</li>
                  <li>Vào <strong className="text-[#ececec]">Buckets → {bucket} → Events</strong>, bấm <strong className="text-[#ececec]">Subscribe to Event</strong>.</li>
                  <li>Chọn Destination là <code className="text-[#9bf73c]">mycast_hook</code> và tích chọn event <strong className="text-[#ececec]">Put / ObjectCreated</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: AWS S3 */}
          {activeTab === 's3' && (
            <div className="space-y-4">
              <div className="bg-[#1c1c1c] p-3 rounded-lg border border-[#525252]/40 text-xs text-[#8a8a8a] space-y-1">
                <span className="font-semibold text-[#ececec] block">Sơ đồ luồng:</span>
                <span className="font-mono text-[#9bf73c]">
                  S3 Bucket ({bucket}) → Amazon SNS Topic → HTTPS Subscription → MyCast Webhook
                </span>
                <p className="mt-1">
                  MyCast backend tự động xử lý handshake <code className="text-[#9bf73c]">SubscriptionConfirmation</code> từ AWS SNS khi tạo Subscription.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[#ececec] text-sm mb-1">
                  Bước 1: Tạo SNS Topic & HTTPS Subscription
                </h4>
                <ol className="list-decimal list-inside text-xs text-[#8a8a8a] space-y-1.5 leading-relaxed pl-1">
                  <li>Mở AWS SNS Console → <strong className="text-[#ececec]">Create topic</strong> (Standard Topic, ví dụ: <code className="text-[#ececec]">mycast-s3-uploads-topic</code>).</li>
                  <li>Vào Topic vừa tạo → <strong className="text-[#ececec]">Create subscription</strong>:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5">
                      <li>Protocol: <strong className="text-[#ececec]">HTTPS</strong></li>
                      <li>Endpoint: <code className="text-[#9bf73c] break-all">{webhookUrl}</code></li>
                    </ul>
                  </li>
                  <li>Trạng thái Subscription sẽ tự chuyển sang <strong className="text-[#9bf73c]">Confirmed</strong> ngay lập tức.</li>
                </ol>
              </div>

              <div className="pt-3 border-t border-[#525252]/40">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-[#ececec] text-sm">
                    Bước 2: Cấp quyền SNS Access Policy cho S3
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy('sns_policy', awsSnsPolicy)}
                    className="px-2 py-0.5 bg-[#3d3d3d] hover:bg-[#525252] text-[#ececec] hover:text-[#9bf73c] rounded text-xs border border-[#525252] cursor-pointer"
                  >
                    {copiedKey === 'sns_policy' ? 'Đã copy!' : 'Copy policy'}
                  </button>
                </div>
                <pre className="bg-[#141414] border border-[#525252]/40 p-3 rounded-xl text-xs font-mono text-[#d4d4d4] overflow-x-auto leading-relaxed">
                  {awsSnsPolicy}
                </pre>
              </div>

              <div className="pt-3 border-t border-[#525252]/40">
                <h4 className="font-semibold text-[#ececec] text-sm mb-1">
                  Bước 3: Cấu hình Event Notification trên S3 Bucket
                </h4>
                <p className="text-xs text-[#8a8a8a] leading-relaxed">
                  Vào S3 Bucket <strong className="text-[#ececec]">{bucket}</strong> → tab <strong className="text-[#ececec]">Properties</strong> → mục <strong className="text-[#ececec]">Event notifications</strong> → <strong className="text-[#ececec]">Create event notification</strong>:
                  chọn <strong className="text-[#ececec]">All object create events (s3:ObjectCreated:*)</strong> và Destination chọn <strong className="text-[#ececec]">SNS Topic</strong> vừa tạo.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Cloudflare R2 */}
          {activeTab === 'r2' && (
            <div className="space-y-4">
              <div className="bg-[#1c1c1c] p-3 rounded-lg border border-[#525252]/40 text-xs text-[#8a8a8a]">
                <p>
                  Cloudflare R2 hỗ trợ đẩy Event Notification vào <strong className="text-[#ececec]">Cloudflare Queue</strong>. Bạn sử dụng Cloudflare Worker consumer để nhận queue message và forward HTTP POST tới Webhook URL của MyCast.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-[#ececec] text-sm">
                    Mã nguồn mẫu Cloudflare Worker Bridge
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleCopy('cf_worker', cfWorkerCode)}
                    className="px-2 py-0.5 bg-[#3d3d3d] hover:bg-[#525252] text-[#ececec] hover:text-[#9bf73c] rounded text-xs border border-[#525252] cursor-pointer"
                  >
                    {copiedKey === 'cf_worker' ? 'Đã copy!' : 'Copy Worker code'}
                  </button>
                </div>
                <pre className="bg-[#141414] border border-[#525252]/40 p-3.5 rounded-xl text-xs font-mono text-[#d4d4d4] overflow-x-auto leading-relaxed">
                  {cfWorkerCode}
                </pre>
              </div>

              <div className="pt-3 border-t border-[#525252]/40">
                <h4 className="font-semibold text-[#ececec] text-sm mb-1">
                  Cấu hình Wrangler & R2 Event Notification
                </h4>
                <ol className="list-decimal list-inside text-xs text-[#8a8a8a] space-y-1 pl-1 leading-relaxed">
                  <li>Tạo Queue: <code className="text-[#9bf73c]">npx wrangler queues create r2-upload-events</code></li>
                  <li>Bật R2 Event Notification: <code className="text-[#d4d4d4]">npx wrangler r2 bucket notification create {bucket} --event-types object-create --queue r2-upload-events</code></li>
                  <li>Deploy Worker với cấu hình queue consumer lắng nghe <code className="text-[#ececec]">r2-upload-events</code>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#525252]/60 bg-[#1c1c1c] flex items-center justify-between">
          <span className="text-xs text-[#8a8a8a]">
            Backend tự động lọc transcoder artifact (.m3u8, .ts, thumbnails) và chỉ nhận file video gốc.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#3d3d3d] hover:bg-[#525252] text-[#ececec] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
