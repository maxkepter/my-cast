'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { tokenService } from '@/lib/token';
import { apiClient } from '@/lib/api-client';
import {
  AuthRes,
  LoginReq,
  RegisterPendingRes,
  RegisterReq,
  User,
  VerifyEmailReq,
} from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginReq) => Promise<void>;
  register: (data: RegisterReq) => Promise<RegisterPendingRes>;
  verifyEmail: (data: VerifyEmailReq) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => {
      const savedUser = tokenService.getUser();
      const token = tokenService.getAccessToken();
      if (savedUser && token) {
        setUser(savedUser);
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (credentials: LoginReq) => {
    const response = await apiClient.post<AuthRes>('/auth/login', credentials);
    const { accessToken, refreshToken, user: authUser } = response.data;
    tokenService.setTokens(accessToken, refreshToken, authUser);
    setUser(authUser);
  };

  const register = async (data: RegisterReq): Promise<RegisterPendingRes> => {
    const response = await apiClient.post<RegisterPendingRes>('/auth/register', data);
    return response.data;
  };

  const verifyEmail = async (data: VerifyEmailReq): Promise<User> => {
    const response = await apiClient.post<User>('/auth/verify-email', data);
    return response.data;
  };

  const logout = () => {
    tokenService.clearTokens();
    setUser(null);
    router.push('/login');
  };

  const isAuthenticated = Boolean(user && tokenService.getAccessToken());

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        verifyEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
