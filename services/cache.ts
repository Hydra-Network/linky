import NodeCache from "node-cache";

export class CacheService {
  private cache: NodeCache;

  constructor(stdTTL = 300, checkPeriod = 60) {
    this.cache = new NodeCache({ stdTTL, checkperiod: checkPeriod });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set(key: string, value: unknown, ttl?: number): boolean {
    return this.cache.set(key, value, ttl);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  invalidateByPrefix(prefix: string): number {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter((key) => key.startsWith(prefix));
    if (matchingKeys.length === 0) return 0;
    return this.cache.del(matchingKeys);
  }

  flushAll(): void {
    this.cache.flushAll();
  }

  keys(): string[] {
    return this.cache.keys();
  }

  getStats(): NodeCache.Stats {
    return this.cache.getStats();
  }
}

export const cache = new CacheService();
