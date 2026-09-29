import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ActiveableEntity } from '../../../../common/domain/activeable.entity';
import { Role } from '../enums/role.enum';
import { UserProfile } from '../value-objects/user-profile.vo';

@Entity('users')
export class User extends ActiveableEntity {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column({ unique: true })
  username: string;

  @Column(() => UserProfile, { prefix: false })
  profile: UserProfile;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  updatePassword(newPassword: string): void {
    this.password = newPassword;
  }

  updateRole(newRole: Role): void {
    this.role = newRole;
  }

  updateEmail(newEmail: string): void {
    this.email = newEmail;
  }
}
