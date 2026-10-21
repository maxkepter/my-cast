export interface StorageObjectReadRepository {
  countReadyByNodeId(nodeId: string): Promise<number>;

  sumReadyBytesByNodeId(nodeId: string): Promise<number>;
}

export const STORAGE_OBJECT_READ_REPOSITORY = Symbol(
  'STORAGE_OBJECT_READ_REPOSITORY',
);
