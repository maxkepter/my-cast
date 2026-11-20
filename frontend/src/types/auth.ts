export interface UserProfile {
  displayName?: string;
  avatar?: string;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
  googleId?: string;
  profile?: UserProfile;
}

export interface AuthRes {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface GoogleLoginReq {
  idToken: string;
}

export interface RefreshTokenReq {
  refreshToken: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
