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
}
