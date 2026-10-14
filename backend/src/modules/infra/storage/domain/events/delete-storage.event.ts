import { DomainEvent } from '../../../../../common/domain/domain-event';

export class DeleteStorageEvent extends DomainEvent {
  static readonly EVENT_NAME = 'storage.delete';

  constructor(public readonly storageIds: string[]) {
    super();
  }

  get keys(): string[] {
    return this.storageIds;
  }

  getEventName(): string {
    return DeleteStorageEvent.EVENT_NAME;
  }
}
