import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ActiveableEntity } from '../../../../../common/domain/activeable.entity';
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

  @Column({ unique: true, nullable: true })
  googleId?: string;

  updateGoogleId(googleId: string): void {
    this.googleId = googleId;
  }

  updateRole(newRole: Role): void {
    this.role = newRole;
  }

  updateEmail(newEmail: string): void {
    this.email = newEmail;
  }

  static create(
    username: string,
    email: string,
    role: Role = Role.USER,
    profile: UserProfile,
    googleId?: string,
  ): User {
    const user = new User();
    user.username = username;
    user.email = email;
    user.role = role;
    user.profile = profile;
    user.googleId = googleId;
    user.isActive = true;
    return user;
  }
}
