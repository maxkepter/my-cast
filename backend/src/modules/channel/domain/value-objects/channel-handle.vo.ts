import { ValueObject } from '../../../../common/domain/value-object';

export class ChannelHandle implements ValueObject<ChannelHandle> {
  private readonly value: string;

  private constructor(rawHandle: string) {
    this.value = ChannelHandle.format(rawHandle);
  }

  static create(rawHandle: string): ChannelHandle {
    const formatted = ChannelHandle.format(rawHandle);
    if (!ChannelHandle.isValid(formatted)) {
      throw new Error(
        'Invalid channel handle format. Must start with @, be 3-30 characters of lowercase letters, numbers, underscores, or hyphens.',
      );
    }
    return new ChannelHandle(formatted);
  }

  static format(rawHandle: string): string {
    if (!rawHandle) return '';
    const trimmed = rawHandle.trim().toLowerCase();
    return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
  }

  static isValid(handle: string): boolean {
    if (!handle) return false;
    // @ followed by 3-30 alphanumeric, underscore, or hyphen chars
    const regex = /^@[a-z0-9_-]{3,30}$/;
    return regex.test(handle);
  }

  getValue(): string {
    return this.value;
  }

  equals(vo?: ValueObject<ChannelHandle>): boolean {
    if (!vo) return false;
    if (!(vo instanceof ChannelHandle)) return false;
    return this.value === vo.value;
  }
}
