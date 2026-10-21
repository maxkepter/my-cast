export class StorageDomainException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StorageNodeHasDataException extends StorageDomainException {
  constructor(
    message = 'Migrate data from this storage node before deleting it.',
  ) {
    super('STORAGE_NODE_HAS_DATA', message);
  }
}

export class StorageNodeIdExistsException extends StorageDomainException {
  constructor(
    message = 'A storage node with this ID already exists.',
  ) {
    super('STORAGE_NODE_ID_EXISTS', message);
  }
}

export class StorageNodeNotFoundException extends StorageDomainException {
  constructor(id: string) {
    super('STORAGE_NODE_NOT_FOUND', `Storage node '${id}' was not found.`);
  }
}

export class StorageNodeUnreachableException extends StorageDomainException {
  constructor(message = 'Storage node bucket is unreachable.') {
    super('STORAGE_NODE_UNREACHABLE', message);
  }
}

export class InvalidStorageInputException extends StorageDomainException {
  constructor(message: string, code = 'INVALID_STORAGE_INPUT') {
    super(code, message);
  }
}
