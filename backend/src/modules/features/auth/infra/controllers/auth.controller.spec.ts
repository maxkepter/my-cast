import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(() => {
    authService = {
      refreshToken: vi.fn().mockResolvedValue({
        accessToken: 'access-new',
        refreshToken: 'refresh-new',
      }),
      googleLogin: vi.fn().mockResolvedValue({
        accessToken: 'access-google',
        refreshToken: 'refresh-google',
      }),
    } as unknown as AuthService;

    controller = new AuthController(authService);
  });

  it('should handle google login', async () => {
    const res = await controller.googleLogin({
      idToken: 'google-token-xyz',
    });
    expect(res.accessToken).toBe('access-google');
    expect(authService.googleLogin).toHaveBeenCalledWith({
      idToken: 'google-token-xyz',
    });
  });

  it('should handle refresh token', async () => {
    const res = await controller.refreshToken({
      refreshToken: 'refresh-old',
    });
    expect(res.accessToken).toBe('access-new');
    expect(authService.refreshToken).toHaveBeenCalledWith('refresh-old');
  });
});
