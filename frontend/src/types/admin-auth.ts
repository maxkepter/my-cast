import { ReactNode } from 'react';
import { User, LoginReq } from './auth';

export type AdminLoginReq = LoginReq;

export interface AdminAuthStatus {
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
}

export interface AdminGuardProps {
  children: ReactNode;
  fallbackUrl?: string; // Mặc định '/admin/login'
}

export const mockAdminUser: User = {
  userId: 'admin-uuid-1',
  username: 'admin',
  email: 'admin@mycast.vn',
  role: 'ADMIN',
  profile: { displayName: 'System Administrator' },
};

export const mockNormalUser: User = {
  userId: 'user-uuid-2',
  username: 'creator01',
  email: 'creator@mycast.vn',
  role: 'USER',
  profile: { displayName: 'Creator One' },
};
