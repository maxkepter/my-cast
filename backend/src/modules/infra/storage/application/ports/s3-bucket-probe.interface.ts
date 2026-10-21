import { S3BucketProbeConfig } from '../types/storage-pool.type';

export type { S3BucketProbeConfig };

export interface S3BucketProbe {
  // Returns true if the bucket exists and is accessible with the provided credentials, false otherwise.
  headBucket(config: S3BucketProbeConfig): Promise<boolean>;
}

export const S3_BUCKET_PROBE = Symbol('S3_BUCKET_PROBE');
