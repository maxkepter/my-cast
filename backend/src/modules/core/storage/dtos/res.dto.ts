import {
  StoragePresignedDownloadResult,
  StoragePresignedUploadResult,
  StoragePresignedUrlOptions,
  StorageUploadResult,
} from '../contracts/storage.contract';

export class UploadRes implements StorageUploadResult {
  storageId!: string;
  etag!: string;
  originalName?: string;
  key!: string;

  static of(
    storageId: string,
    etag: string,
    originalName?: string,
    key?: string,
  ): UploadRes {
    const res = new UploadRes();
    res.storageId = storageId;
    res.etag = etag;
    res.originalName = originalName;
    res.key = key || originalName || '';
    return res;
  }
}

export class PresignedUrlOptionsRes implements StoragePresignedUrlOptions {
  expiresIn?: number;
  contentType?: string;

  static of(expiresIn?: number, contentType?: string): PresignedUrlOptionsRes {
    const res = new PresignedUrlOptionsRes();
    res.expiresIn = expiresIn;
    res.contentType = contentType;
    return res;
  }
}

export class PresignedDowloadRes implements StoragePresignedDownloadResult {
  storageId!: string;
  url!: string;
  expiresIn?: number;
  key!: string;

  static of(
    storageId: string,
    url: string,
    expiresIn?: number,
    key?: string,
  ): PresignedDowloadRes {
    const res = new PresignedDowloadRes();
    res.storageId = storageId;
    res.url = url;
    res.expiresIn = expiresIn;
    res.key = key || '';
    return res;
  }
}

export class PresignedUploadRes implements StoragePresignedUploadResult {
  storageId!: string;
  url!: string;
  options?: StoragePresignedUrlOptions;
  key!: string;

  static of(
    storageId: string,
    url: string,
    options?: StoragePresignedUrlOptions,
    key?: string,
  ): PresignedUploadRes {
    const res = new PresignedUploadRes();
    res.storageId = storageId;
    res.url = url;
    res.options = options;
    res.key = key || '';
    return res;
  }
}

export class StorageNodeRes {
  nodeId!: string;
  name!: string;
  endpoint!: string;
  region!: string;
  bucket!: string;
  quotaBytes!: number;
  usedBytes!: number;
  isActive!: boolean;
  isHealthy!: boolean;
  createdAt!: Date;

  static of(
    nodeId: string,
    name: string,
    endpoint: string,
    region: string,
    bucket: string,
    quotaBytes: number,
    usedBytes: number,
    isActive: boolean,
    isHealthy: boolean,
    createdAt: Date,
  ): StorageNodeRes {
    const res = new StorageNodeRes();
    res.nodeId = nodeId;
    res.name = name;
    res.endpoint = endpoint;
    res.region = region;
    res.bucket = bucket;
    res.quotaBytes = quotaBytes;
    res.usedBytes = usedBytes;
    res.isActive = isActive;
    res.isHealthy = isHealthy;
    res.createdAt = createdAt;
    return res;
  }
}

export class StorageNodeListRes {
  totalNodes!: number;
  nodes!: StorageNodeRes[];

  static of(totalNodes: number, nodes: StorageNodeRes[]): StorageNodeListRes {
    const res = new StorageNodeListRes();
    res.totalNodes = totalNodes;
    res.nodes = nodes;
    return res;
  }
}

export class StorageNodeHealthRes {
  nodeId!: string;
  isHealthy!: boolean;
  checkedAt!: Date;

  static of(
    nodeId: string,
    isHealthy: boolean,
    checkedAt: Date,
  ): StorageNodeHealthRes {
    const res = new StorageNodeHealthRes();
    res.nodeId = nodeId;
    res.isHealthy = isHealthy;
    res.checkedAt = checkedAt;
    return res;
  }
}
