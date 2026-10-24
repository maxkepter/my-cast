import { describe, it, expect, vi, beforeEach } from 'vitest';
import Redis from 'ioredis';
import { RedisCacheService } from './redis-cache.service';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let redisMock: any;

  beforeEach(() => {
    redisMock = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      exists: vi.fn(),
      ttl: vi.fn(),
      keys: vi.fn(),
      quit: vi.fn().mockResolvedValue('OK'),
    };
    service = new RedisCacheService(redisMock as unknown as Redis);
  });

  describe('get', () => {
    it('should return null when key not found', async () => {
      redisMock.get.mockResolvedValue(null);
      const res = await service.get('missing');
      expect(res).toBeNull();
      expect(redisMock.get).toHaveBeenCalledWith('missing');
    });

    it('should return parsed json value', async () => {
      redisMock.get.mockResolvedValue(JSON.stringify({ hello: 'world' }));
      const res = await service.get<{ hello: string }>('key');
      expect(res).toEqual({ hello: 'world' });
    });

    it('should return raw string when JSON parse fails', async () => {
      redisMock.get.mockResolvedValue('plain-string');
      const res = await service.get('key');
      expect(res).toBe('plain-string');
    });
  });

  describe('set', () => {
    it('should set with ttlSeconds', async () => {
      redisMock.set.mockResolvedValue('OK');
      await service.set('key', { a: 1 }, 60);
      expect(redisMock.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify({ a: 1 }),
        'EX',
        60,
      );
    });

    it('should set without ttlSeconds', async () => {
      redisMock.set.mockResolvedValue('OK');
      await service.set('key', 'plain');
      expect(redisMock.set).toHaveBeenCalledWith('key', 'plain');
    });
  });

  describe('del', () => {
    it('should delete key', async () => {
      redisMock.del.mockResolvedValue(1);
      await service.del('key');
      expect(redisMock.del).toHaveBeenCalledWith('key');
    });
  });

  describe('exists', () => {
    it('should return true when exists', async () => {
      redisMock.exists.mockResolvedValue(1);
      expect(await service.exists('key')).toBe(true);
    });

    it('should return false when not exists', async () => {
      redisMock.exists.mockResolvedValue(0);
      expect(await service.exists('key')).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return ttl number', async () => {
      redisMock.ttl.mockResolvedValue(120);
      expect(await service.ttl('key')).toBe(120);
    });
  });

  describe('keys', () => {
    it('should return matched keys', async () => {
      redisMock.keys.mockResolvedValue(['k1', 'k2']);
      expect(await service.keys('k*')).toEqual(['k1', 'k2']);
    });
  });

  describe('delByPattern', () => {
    it('should del matched keys', async () => {
      redisMock.keys.mockResolvedValue(['k1', 'k2']);
      redisMock.del.mockResolvedValue(2);
      await service.delByPattern('k*');
      expect(redisMock.del).toHaveBeenCalledWith('k1', 'k2');
    });

    it('should do nothing when no keys match', async () => {
      redisMock.keys.mockResolvedValue([]);
      await service.delByPattern('k*');
      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call quit', async () => {
      await service.onModuleDestroy();
      expect(redisMock.quit).toHaveBeenCalled();
    });
  });
});
