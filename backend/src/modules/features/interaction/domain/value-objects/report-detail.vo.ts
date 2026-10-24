import { Column } from 'typeorm';
import { ValueObject } from '../../../../../common/domain/value-object';

export class ReportDetail implements ValueObject<ReportDetail> {
  @Column({ name: 'description', type: 'varchar', length: 1000, default: '' })
  private readonly description!: string;

  constructor(description?: string) {
    if (description !== undefined) {
      this.validate(description);
      this.description = description.trim();
    } else {
      this.description = '';
    }
  }

  getValue(): string {
    return this.description;
  }

  private validate(raw: string): void {
    if (raw && raw.length > 1000) {
      throw new Error('Report description cannot exceed 1000 characters');
    }
  }

  equals(vo?: ValueObject<ReportDetail>): boolean {
    if (!vo) return false;
    if (!(vo instanceof ReportDetail)) return false;
    return this.description === vo.description;
  }

  static create(description?: string): ReportDetail {
    return new ReportDetail(description);
  }
}
