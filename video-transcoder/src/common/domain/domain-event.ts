import { randomUUID } from 'node:crypto';

export abstract class DomainEvent {
  readonly id?: string;
  readonly occuredOn: Date;

  static readonly EVENT_NAME: string;

  constructor() {
    this.occuredOn = new Date();
  }

  abstract getEventName(): string;

  serialize(): string {
    return JSON.stringify(this);
  }

  deserialize(json: string): this {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return Object.assign(this, data, {
      id: data?.id ?? this.id,
      occuredOn: data?.occuredOn ? new Date(data.occuredOn) : new Date(),
    });
  }

  static deserialize<T extends DomainEvent>(
    this: new (...args: any[]) => T,
    json: string,
  ): T {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const instance = Object.create(this.prototype);
    return Object.assign(instance, data, {
      id: data?.id ?? randomUUID(),
      occuredOn: data?.occuredOn ? new Date(data.occuredOn) : new Date(),
    });
  }
}
