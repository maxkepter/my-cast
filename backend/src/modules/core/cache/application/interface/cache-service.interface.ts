export const CACHE_SERVICE = Symbol('CACHE_SERVICE');

export interface CacheService {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  delByPattern(pattern: string): Promise<void>;
}

export const MockCacheService: CacheService = {
  get: async <T = string>(_key: string): Promise<T | null> => null,
  set: async (_key: string, _value: unknown, _ttl?: number): Promise<void> => {},
  del: async (_key: string): Promise<void> => {},
  exists: async (_key: string): Promise<boolean> => false,
  ttl: async (_key: string): Promise<number> => -1,
  keys: async (_pattern: string): Promise<string[]> => [],
  delByPattern: async (_pattern: string): Promise<void> => {},
};
