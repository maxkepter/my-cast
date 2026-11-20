import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

const mockVerifyIdToken = vi.fn();
vi.mock('google-auth-library', () => {
  return {
    OAuth2Client: class {
      verifyIdToken = mockVerifyIdToken;
    },
  };
});

describe('AuthService', () => {
  let authService: AuthService;
  let userRepo: any;
  let refreshTokenService: any;
  let jwtService: any;
  let configService: any;
  let internalEventBus: any;

  beforeEach(() => {
    vi.clearAllMocks();

    userRepo = {
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn((data) => ({
        ...data,
        userId: 'u-1',
        isActived: () => true,
        updateGoogleId: vi.fn(),
      })),
      save: vi.fn((data) =>
        Promise.resolve({
          ...data,
          userId: data.userId || 'u-1',
          isActived: () => true,
        }),
      ),
    };

    refreshTokenService = {
      createRefreshToken: vi.fn().mockResolvedValue({
        token: 'rt-123',
        userId: 'u-1',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      }),
      validateRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn().mockResolvedValue(undefined),
      revokeRefreshTokenByUserId: vi.fn().mockResolvedValue(undefined),
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('jwt-access-token'),
    };

    configService = {
      get: vi.fn((key: string, defaultValue?: any) => {
        if (key === 'REFRESH_TOKEN_DAYS') return 7;
        if (key === 'GOOGLE_CLIENT_ID') return 'mock-client-id';
        return defaultValue;
      }),
    };

    internalEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    authService = new AuthService(
      userRepo,
      refreshTokenService,
      jwtService,
      configService,
      internalEventBus,
    );
  });

  describe('googleLogin', () => {
    it('should login successfully for existing user with googleId', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'test@example.com',
          sub: 'google-sub-123',
          name: 'Google User',
          picture: 'https://example.com/avatar.png',
        }),
      });

      const existingUser = {
        userId: 'u-1',
        username: 'existing_user',
        email: 'test@example.com',
        googleId: 'google-sub-123',
        role: 'USER',
        profile: {
          displayName: 'Existing User',
          avatar: 'https://example.com/avatar.png',
        },
        isActived: () => true,
      };

      userRepo.findOne.mockResolvedValue(existingUser);

      const result = await authService.googleLogin({ idToken: 'valid-token' });

      expect(result.accessToken).toBe('jwt-access-token');
      expect(result.refreshToken).toBe('rt-123');
      expect(result.user.userId).toBe('u-1');
    });

    it('should link googleId to existing user if not present', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'test@example.com',
          sub: 'google-sub-456',
          name: 'Google User',
          picture: 'https://example.com/avatar.png',
        }),
      });

      const existingUser = {
        userId: 'u-1',
        username: 'existing_user',
        email: 'test@example.com',
        googleId: undefined,
        role: 'USER',
        profile: {
          displayName: 'Existing User',
          avatar: undefined,
          updateAvatar: vi.fn(),
        },
        updateGoogleId: vi.fn(),
        isActived: () => true,
      };

      userRepo.findOne.mockResolvedValue(existingUser);

      const result = await authService.googleLogin({ idToken: 'valid-token' });

      expect(existingUser.updateGoogleId).toHaveBeenCalledWith('google-sub-456');
      expect(existingUser.profile.updateAvatar).toHaveBeenCalledWith(
        'https://example.com/avatar.png',
      );
      expect(userRepo.save).toHaveBeenCalledWith(existingUser);
      expect(result.accessToken).toBe('jwt-access-token');
    });

    it('should create a new user if user does not exist and publish UserCreatedEvent', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'newuser@example.com',
          sub: 'google-new-789',
          name: 'New Google User',
          picture: 'https://example.com/new.png',
        }),
      });

      userRepo.findOne.mockResolvedValue(null);

      const result = await authService.googleLogin({
        idToken: 'new-valid-token',
      });

      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(internalEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          email: 'newuser@example.com',
          displayName: 'New Google User',
        }),
      );
      expect(result.accessToken).toBe('jwt-access-token');
      expect(result.refreshToken).toBe('rt-123');
    });

    it('should throw UnauthorizedException if verifyIdToken fails', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(
        authService.googleLogin({ idToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if payload lacks email', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-no-email',
        }),
      });

      await expect(
        authService.googleLogin({ idToken: 'no-email-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'inactive@example.com',
          sub: 'google-sub-inactive',
        }),
      });

      const inactiveUser = {
        userId: 'u-inactive',
        username: 'inactive_user',
        email: 'inactive@example.com',
        googleId: 'google-sub-inactive',
        role: 'USER',
        profile: { displayName: 'Inactive' },
        isActived: () => false,
      };

      userRepo.findOne.mockResolvedValue(inactiveUser);

      await expect(
        authService.googleLogin({ idToken: 'inactive-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully and rotate token', async () => {
      refreshTokenService.validateRefreshToken.mockResolvedValue({
        token: 'old-rt',
        userId: 'u-1',
      });

      userRepo.findOne.mockResolvedValue({
        userId: 'u-1',
        username: 'testuser',
        role: 'USER',
        email: 'test@example.com',
        profile: { displayName: 'Test User' },
        isActived: () => true,
      });

      const result = await authService.refreshToken('old-rt');

      expect(result.accessToken).toBe('jwt-access-token');
      expect(result.refreshToken).toBe('rt-123');
      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'old-rt',
      );
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      await expect(authService.refreshToken('')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
