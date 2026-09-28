export class DeleteStorageEvent {
  static readonly EVENT_NAME = 'storage.delete';

  constructor(public readonly storageIds: string[]) {}

  get keys(): string[] {
    return this.storageIds;
  }

  getEventName(): string {
    return DeleteStorageEvent.EVENT_NAME;
  }
}
