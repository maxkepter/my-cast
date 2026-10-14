export interface UserProfile {
  displayName?: string;
  avatar?: string;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
  profile?: UserProfile;
}

export interface AuthRes {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterPendingRes {
  message: string;
  email: string;
}

export interface LoginReq {
  username: string;
  password: string;
}

export interface RegisterReq {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface VerifyEmailReq {
  email: string;
  code: string;
}

export interface RefreshTokenReq {
  refreshToken: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}