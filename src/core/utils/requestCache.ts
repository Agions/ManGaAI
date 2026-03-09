/**
 * 请求缓存工具
 * 用于缓存 API 响应，减少重复请求
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // 毫秒
}

interface CacheOptions {
  ttl?: number; // 默认过期时间（毫秒）
  maxSize?: number; // 最大缓存条目数
}

/**
 * 请求缓存类
 */
class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 5 * 60 * 1000; // 默认 5 分钟
    this.maxSize = options.maxSize ?? 100; // 默认 100 条
  }

  /**
   * 生成缓存键
   */
  private generateKey(...args: unknown[]): string {
    return JSON.stringify(args);
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // 如果超过最大限制，删除最早的条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.ttl
    });
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 批量删除匹配键
   */
  deleteByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 检查键是否存在（不检查过期）
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// 导出单例
export const requestCache = new RequestCache();

// 导出类供自定义使用
export { RequestCache };

/**
 * 创建带缓存的请求函数
 */
export const withCache = async <T>(
  cache: RequestCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // 尝试从缓存获取
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // 执行请求
  const data = await fetcher();

  // 存入缓存
  cache.set(key, data, ttl);

  return data;
};
