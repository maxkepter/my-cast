export class StorageClientException extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = StorageClientException.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StorageNotFoundException extends StorageClientException {
  constructor(
    public readonly storageId: string,
    cause?: unknown,
  ) {
    super(`Storage object not found: ${storageId}`, 404, cause);
    this.name = StorageNotFoundException.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class StorageConnectionException extends StorageClientException {
  constructor(message: string, cause?: unknown) {
    super(`Storage connection error: ${message}`, 500, cause);
    this.name = StorageConnectionException.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
