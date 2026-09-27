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
}
