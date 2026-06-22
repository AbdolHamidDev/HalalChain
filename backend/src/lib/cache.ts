import { cacheRedis } from "./redis";

export type CacheOptions = {
  ttl?: number; // seconds
};

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await cacheRedis.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    console.error(`[Cache] GET error for key ${key}:`, error);
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttl?: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await cacheRedis.setex(key, ttl, serialized);
    } else {
      await cacheRedis.set(key, serialized);
    }
  } catch (error) {
    console.error(`[Cache] SET error for key ${key}:`, error);
  }
}

export async function delCached(key: string): Promise<void> {
  try {
    await cacheRedis.del(key);
  } catch (error) {
    console.error(`[Cache] DEL error for key ${key}:`, error);
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys: string[] = [];
    let cursor = 0;
    do {
      const result = await cacheRedis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = parseInt(result[0]);
      keys.push(...result[1]);
    } while (cursor !== 0);

    if (keys.length > 0) {
      await cacheRedis.del(...keys);
    }
  } catch (error) {
    console.error(`[Cache] INVALIDATE error for pattern ${pattern}:`, error);
  }
}

export function buildCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
  return `${prefix}:${parts.filter((part): part is string | number => part !== undefined).join(":")}`;
}