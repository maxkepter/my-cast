import { Column } from 'typeorm';
import { ValueObject } from '../../../../../common/domain/value-object';

export class CommentContent implements ValueObject<CommentContent> {
  @Column({ name: 'content', type: 'varchar', length: 2000 })
  private readonly value!: string;

  constructor(value?: string) {
    if (value !== undefined) {
      this.validate(value);
      this.value = this.sanitize(value);
    }
  }

  getValue(): string {
    return this.value;
  }

  private validate(raw: string): void {
    if (raw === undefined || raw === null) {
      throw new Error('Comment content cannot be null or undefined');
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new Error('Comment content cannot be empty');
    }
    if (trimmed.length > 2000) {
      throw new Error('Comment content cannot exceed 2000 characters');
    }
  }

  private sanitize(raw: string): string {
    // Strip script tags and dangerous HTML constructs
    return raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();
  }

  equals(vo?: ValueObject<CommentContent>): boolean {
    if (!vo) return false;
    if (!(vo instanceof CommentContent)) return false;
    return this.value === vo.value;
  }

  static create(raw: string): CommentContent {
    return new CommentContent(raw);
  }
}
