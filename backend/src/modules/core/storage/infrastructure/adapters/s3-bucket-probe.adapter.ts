import { Injectable } from '@nestjs/common';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { BucketProbeConfigReq } from '../../dtos/req.dto';
import { S3BucketProbe } from '../../application/ports/s3-bucket-probe.interface';

@Injectable()
export class S3BucketProbeAdapter implements S3BucketProbe {
  async headBucket(config: BucketProbeConfigReq): Promise<boolean> {
    const client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    try {
      await client.send(new HeadBucketCommand({ Bucket: config.bucket }), {
        abortSignal: AbortSignal.timeout(10_000),
      });
      return true;
    } catch {
      return false;
    } finally {
      client.destroy();
    }
  }
}
