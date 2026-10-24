import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../user/domain/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryColumn()
  token: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ default: false })
  isRevoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  static create(userId: string, expiresAt: Date, token?: string): RefreshToken {
    const rt = new RefreshToken();
    rt.token = token || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substring(2));
    rt.userId = userId;
    rt.expiresAt = expiresAt;
    rt.isRevoked = false;
    return rt;
  }

  revoke(): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
