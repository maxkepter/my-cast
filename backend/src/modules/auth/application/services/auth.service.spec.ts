import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepo: any;
  let refreshTokenService: any;
  let jwtService: any;
  let configService: any;
  let internalEventBus: any;
  let cacheService: any;

  beforeEach(() => {
    userRepo = {
      findOne: vi.fn(),
      create: vi.fn((data) => ({
        ...data,
        userId: 'u-1',
        isActived: () => true,
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
        if (key === 'EMAIL_VERIFICATION_TTL') return 900;
        return defaultValue;
      }),
    };

    internalEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    cacheService = {
      get: vi.fn(),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn(),
      ttl: vi.fn(),
      keys: vi.fn(),
      delByPattern: vi.fn(),
    };

    authService = new AuthService(
      userRepo,
      refreshTokenService,
      jwtService,
      configService,
      internalEventBus,
      cacheService,
    );
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = {
        userId: 'u-1',
        username: 'testuser',
        password: hashedPassword,
        role: 'USER',
        email: 'test@example.com',
        profile: { displayName: 'Test User' },
        isActive: true,
        isActived: () => true,
      };

      userRepo.findOne.mockResolvedValue(user);

      const result = await authService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result.accessToken).toBe('jwt-access-token');
      expect(result.refreshToken).toBe('rt-123');
      expect(result.user.userId).toBe('u-1');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      userRepo.findOne.mockResolvedValue({
        userId: 'u-1',
        username: 'testuser',
        password: hashedPassword,
        isActived: () => true,
      });

      await expect(
        authService.login({ username: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        authService.login({ username: 'nonexistent', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should save pending registration to cache and publish event', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await authService.register({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
      });

      expect(result.email).toBe('new@example.com');
      expect(result.message).toBe('Verification code sent to email');
      expect(cacheService.set).toHaveBeenCalledWith(
        'auth:verify:new@example.com',
        expect.objectContaining({
          email: 'new@example.com',
          username: 'newuser',
          displayName: 'New User',
          code: expect.any(String),
        }),
        900,
      );
      expect(internalEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          displayName: 'New User',
          code: expect.any(String),
          expiresInSeconds: 900,
        }),
      );
    });

    it('should throw ConflictException if username or email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ userId: 'u-exists' });

      await expect(
        authService.register({
          username: 'existing',
          email: 'existing@example.com',
          password: 'password123',
          displayName: 'Existing User',
        }),
      ).rejects.toThrow(ConflictException);

      expect(cacheService.set).not.toHaveBeenCalled();
      expect(internalEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify code, create user in DB, del cache, and publish user.created event', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      cacheService.get.mockResolvedValue({
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        displayName: 'Test User',
        code: '123456',
      });
      userRepo.findOne.mockResolvedValue(null);

      const result = await authService.verifyEmail({
        email: 'test@example.com',
        code: '123456',
      });

      expect(result.userId).toBe('u-1');
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(cacheService.del).toHaveBeenCalledWith('auth:verify:test@example.com');
      expect(internalEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u-1',
          email: 'test@example.com',
          displayName: 'Test User',
          userName: 'testuser',
        }),
      );
    });

    it('should throw BadRequestException if cache is expired or not found', async () => {
      cacheService.get.mockResolvedValue(null);

      await expect(
        authService.verifyEmail({
          email: 'notfound@example.com',
          code: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if code does not match', async () => {
      cacheService.get.mockResolvedValue({
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        displayName: 'Test User',
        code: '123456',
      });

      await expect(
        authService.verifyEmail({
          email: 'test@example.com',
          code: '654321',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user already exists when verifying', async () => {
      cacheService.get.mockResolvedValue({
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        displayName: 'Test User',
        code: '123456',
      });
      userRepo.findOne.mockResolvedValue({ userId: 'u-exists' });

      await expect(
        authService.verifyEmail({
          email: 'test@example.com',
          code: '123456',
        }),
      ).rejects.toThrow(ConflictException);

      expect(cacheService.del).toHaveBeenCalledWith('auth:verify:test@example.com');
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
      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith('old-rt');
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      await expect(authService.refreshToken('')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password when old password matches', async () => {
      const hashedPassword = await bcrypt.hash('oldPassword', 10);
      const user = {
        userId: 'u-1',
        password: hashedPassword,
        updatePassword: vi.fn(),
      };

      userRepo.findOne.mockResolvedValue(user);

      await authService.updatePassword('u-1', {
        oldPassword: 'oldPassword',
        newPassword: 'newPassword123',
      });

      expect(user.updatePassword).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalledWith(user);
      expect(refreshTokenService.revokeRefreshTokenByUserId).toHaveBeenCalledWith('u-1');
    });

    it('should throw BadRequestException if old password does not match', async () => {
      const hashedPassword = await bcrypt.hash('realOldPassword', 10);
      userRepo.findOne.mockResolvedValue({
        userId: 'u-1',
        password: hashedPassword,
      });

      await expect(
        authService.updatePassword('u-1', {
          oldPassword: 'wrongOldPassword',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        authService.updatePassword('u-999', {
          oldPassword: 'any',
          newPassword: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
