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

  revoke(): void {
    this.isRevoked = true;
    this.revokedAt = new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
