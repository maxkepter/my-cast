import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(() => {
    authService = {
      login: vi.fn().mockResolvedValue({
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
      }),
      register: vi.fn().mockResolvedValue({
        message: 'Verification code sent to email',
        email: 'new@example.com',
      }),
      verifyEmail: vi.fn().mockResolvedValue({
        userId: 'u-1',
        username: 'newuser',
        email: 'new@example.com',
      }),
      refreshToken: vi.fn().mockResolvedValue({
        accessToken: 'access-new',
        refreshToken: 'refresh-new',
      }),
      updatePassword: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuthService;

    controller = new AuthController(authService);
  });

  it('should handle login', async () => {
    const res = await controller.login({
      username: 'test',
      password: 'password',
    });
    expect(res.accessToken).toBe('access-123');
    expect(authService.login).toHaveBeenCalledWith({
      username: 'test',
      password: 'password',
    });
  });

  it('should handle register', async () => {
    const res = await controller.register({
      username: 'newuser',
      password: 'password',
      email: 'new@example.com',
      displayName: 'New User',
    });
    expect(res.message).toBe('Verification code sent to email');
    expect(res.email).toBe('new@example.com');
    expect(authService.register).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'password',
      email: 'new@example.com',
      displayName: 'New User',
    });
  });

  it('should handle verifyEmail', async () => {
    const res = await controller.verifyEmail({
      email: 'new@example.com',
      code: '123456',
    });
    expect(res.userId).toBe('u-1');
    expect(res.email).toBe('new@example.com');
    expect(authService.verifyEmail).toHaveBeenCalledWith({
      email: 'new@example.com',
      code: '123456',
    });
  });

  it('should handle refresh token', async () => {
    const res = await controller.refreshToken({
      refreshToken: 'refresh-old',
    });
    expect(res.accessToken).toBe('access-new');
    expect(authService.refreshToken).toHaveBeenCalledWith('refresh-old');
  });

  it('should handle update password', async () => {
    const res = await controller.updatePassword('u-1', {
      oldPassword: 'old',
      newPassword: 'new',
    });
    expect(res.message).toBe('Password updated successfully');
    expect(authService.updatePassword).toHaveBeenCalledWith('u-1', {
      oldPassword: 'old',
      newPassword: 'new',
    });
  });
});
