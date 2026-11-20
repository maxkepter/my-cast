import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard';
import { Role } from '../../../user/domain/enums/role.enum';
import { ROLES_KEY } from '../decorators/role.decorator';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;

  const createMockExecutionContext = (user?: any): ExecutionContext => {
    const handler = () => {};
    const controllerClass = class TestController {};

    return {
      getHandler: vi.fn().mockReturnValue(handler),
      getClass: vi.fn().mockReturnValue(controllerClass),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({ user }),
        getResponse: vi.fn(),
        getNext: vi.fn(),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RoleGuard>(RoleGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined and successfully inject Reflector via NestJS IoC container', () => {
    expect(guard).toBeDefined();
    expect(reflector).toBeDefined();
    expect(guard['reflector']).toBe(reflector);
  });

  describe('canActivate', () => {
    it('should return true when no roles are required (metadata is undefined)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: Role.USER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when required roles array is empty', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const context = createMockExecutionContext({ role: Role.USER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should call reflector.getAllAndOverride with ROLES_KEY and [context.getHandler(), context.getClass()]', () => {
      const spy = vi
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([Role.ADMIN]);
      const context = createMockExecutionContext({ role: Role.ADMIN });

      const result = guard.canActivate(context);

      expect(spy).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should return true when user role matches one of the required roles', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        Role.ADMIN,
        Role.USER,
      ]);
      const context = createMockExecutionContext({
        id: 'user-1',
        role: Role.ADMIN,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return false when user role does not match required roles', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const context = createMockExecutionContext({
        id: 'user-2',
        role: Role.USER,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when request has no user object (undefined user)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const context = createMockExecutionContext(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return false when user object has no role property', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
      const context = createMockExecutionContext({ id: 'user-3' });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
