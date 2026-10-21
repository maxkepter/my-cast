import {
  CreateStorageNodeReq,
  StorageNodeListQueryReq,
  UpdateStorageNodeReq,
} from '../../dtos/req.dto';
import {
  StorageNodeHealthRes,
  StorageNodeListRes,
  StorageNodeRes,
} from '../../dtos/res.dto';

export const STORAGE_NODE_ADMIN_SERVICE = Symbol('STORAGE_NODE_ADMIN_SERVICE');

export interface StorageNodeAdminService {
  list(query?: StorageNodeListQueryReq): Promise<StorageNodeListRes>;
  create(input: CreateStorageNodeReq): Promise<StorageNodeRes>;
  update(id: string, input: UpdateStorageNodeReq): Promise<StorageNodeRes>;
  remove(id: string): Promise<void>;
  healthCheck(id: string): Promise<StorageNodeHealthRes>;
}
