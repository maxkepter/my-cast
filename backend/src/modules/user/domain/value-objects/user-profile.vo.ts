import { Column } from 'typeorm';

export class UserProfile {
  @Column()
  displayName: string;

  @Column({ nullable: true })
  avatar?: string;

  updateDisplayName(newDisplayName: string): void {
    this.displayName = newDisplayName;
  }

  updateAvatar(newAvatar: string): void {
    this.avatar = newAvatar;
  }

  static create(displayName: string, avatar?: string): UserProfile {
    const profile = new UserProfile();
    profile.displayName = displayName;
    profile.avatar = avatar;
    return profile;
  }
}
