import { S3BucketProbeConfig } from '../types/storage-pool.type';

export type { S3BucketProbeConfig };

export interface S3BucketProbe {
  /**
   * Thăm dò kết nối và kiểm tra tính khả dụng, quyền truy cập của S3 bucket thông qua lệnh HeadBucket.
   *
   * @param config - Cấu hình kết nối tới S3/MinIO bucket (endpoint, credentials, region, bucket, ...).
   * @returns `true` nếu bucket tồn tại và có quyền truy cập hợp lệ, ngược lại trả về `false`.
   */
  headBucket(config: S3BucketProbeConfig): Promise<boolean>;
}

export const S3_BUCKET_PROBE = Symbol('S3_BUCKET_PROBE');
