import type { User } from '../domain/entities/user.entity';

export class UserProfileRes {
  displayName: string;
  avatar?: string;
}

export class UserRes {
  userId: string;
  username: string;
  profile: UserProfileRes;
  role: string;
  email: string;

  static of(user: User): UserRes {
    const res = new UserRes();
    res.userId = user.userId;
    res.username = user.username;
    res.email = user.email;
    res.role = user.role;
    res.profile = {
      displayName: user.profile?.displayName,
      avatar: user.profile?.avatar,
    };
    return res;
  }
}
