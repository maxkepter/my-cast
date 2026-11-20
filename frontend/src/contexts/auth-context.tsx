'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { tokenService } from '@/lib/token';
import { apiClient } from '@/lib/api-client';
import { AuthRes, User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (idToken: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedUser = tokenService.getUser();
      const token = tokenService.getAccessToken();
      if (savedUser && token) {
        setUser(savedUser);
      }
    } catch (err) {
      console.error('Failed to restore auth state', err);
    } finally {
      setIsLoading(false);
    }

    const handleStorageChange = () => {
      const savedUser = tokenService.getUser();
      const token = tokenService.getAccessToken();
      if (savedUser && token) {
        setUser(savedUser);
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loginWithGoogle = async (idToken: string): Promise<User> => {
    const response = await apiClient.post<AuthRes>('/auth/google', { idToken });
    const { accessToken, refreshToken, user: authUser } = response.data;
    tokenService.setTokens(accessToken, refreshToken, authUser);
    setUser(authUser);
    return authUser;
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
        loginWithGoogle,
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
