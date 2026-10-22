import { Type } from 'class-transformer';
import { Readable } from 'node:stream';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import 'multer';

import { StorageUploadPayload } from '../contracts/storage.contract';

export class StorageNodeListQueryReq {
  @IsOptional()
  @IsIn(['healthy', 'unhealthy'])
  status?: 'healthy' | 'unhealthy';
}

export class CreateStorageNodeReq {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsUrl({ require_tld: false })
  endpoint!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  bucket!: string;

  @IsBoolean()
  forcePathStyle!: boolean;

  @IsString()
  @IsNotEmpty()
  accessKeyId!: string;

  @IsString()
  @IsNotEmpty()
  secretAccessKey!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quotaBytes!: number;

  @IsBoolean()
  isActive!: boolean;
}

export class UpdateStorageNodeReq {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quotaBytes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUrl({ require_tld: false })
  endpoint?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  bucket?: string;

  @IsOptional()
  @IsBoolean()
  forcePathStyle?: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  accessKeyId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  secretAccessKey?: string;
}

export class UploadReq implements StorageUploadPayload {
  key!: string;
  body!: Buffer | Uint8Array | Readable;
  originalName?: string;
  contentType?: string;
  contentLength?: number;
  cacheControl?: string;
  metadata?: Record<string, string>;

  static toReq(file: Express.Multer.File, key: string): UploadReq {
    return {
      key,
      body: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
      contentLength: file.size,
    };
  }
}

export class BucketProbeConfigReq {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}
