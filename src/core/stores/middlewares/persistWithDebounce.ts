/**
 * 防抖存储中间件
 * 用于减少 localStorage 写入频率，提高性能
 */

import { StateStorage } from 'zustand/middleware';

/**
 * 创建防抖存储
 * @param storage 原始存储对象
 * @param delay 防抖延迟（毫秒）
 * @returns 防抖存储对象
 */
export const createDebouncedStorage = (
  storage: Storage,
  delay: number = 1000
): StateStorage => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingWrites: Map<string, string> = new Map();

  const flushWrites = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    pendingWrites.forEach((value, key) => {
      try {
        storage.setItem(key, value);
      } catch (error) {
        console.error(`[DebouncedStorage] Failed to save "${key}":`, error);
      }
    });
    pendingWrites.clear();
  };

  return {
    getItem: (name: string): string | null => {
      // 先刷新待写入的数据
      flushWrites();
      const value = storage.getItem(name);
      return value;
    },

    setItem: (name: string, value: string): void => {
      // 合并待写入的数据
      pendingWrites.set(name, value);

      // 清除之前的定时器，设置新的定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        flushWrites();
      }, delay);
    },

    removeItem: (name: string): void => {
      // 清除待写入的数据
      pendingWrites.delete(name);

      // 立即删除
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      storage.removeItem(name);
    }
  };
};

/**
 * 创建带增量更新的存储
 * 适用于大型数据的部分更新场景
 */
export const createIncrementalStorage = (
  storage: Storage,
  delay: number = 500
): StateStorage => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingUpdates: Map<string, Record<string, unknown>> = new Map();

  const flushUpdates = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    pendingUpdates.forEach((updates, key) => {
      try {
        const current = storage.getItem(key);
        const merged = current
          ? { ...JSON.parse(current), ...updates }
          : updates;
        storage.setItem(key, JSON.stringify(merged));
      } catch (error) {
        console.error(`[IncrementalStorage] Failed to merge "${key}":`, error);
      }
    });
    pendingUpdates.clear();
  };

  return {
    getItem: (name: string): string | null => {
      flushUpdates();
      return storage.getItem(name);
    },

    setItem: (name: string, value: string): void => {
      // 全量更新：直接存储
      try {
        const data = JSON.parse(value);
        // 如果是全量替换，直接存储
        if (data._isFullReplace) {
          storage.setItem(name, value);
          return;
        }
        // 否则加入增量更新
        pendingUpdates.set(name, data);
      } catch {
        // 非 JSON 数据直接存储
        storage.setItem(name, value);
        return;
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        flushUpdates();
      }, delay);
    },

    removeItem: (name: string): void => {
      pendingUpdates.delete(name);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      storage.removeItem(name);
    }
  };
};

/**
 * 创建带压缩的存储
 * 使用 JSON.stringify 之前压缩数据，减少存储空间
 */
export const createCompressedStorage = (
  storage: Storage,
  compressionThreshold: number = 10000
): StateStorage => {
  return {
    getItem: (name: string): string | null => {
      const value = storage.getItem(name);
      if (!value) return null;

      try {
        // 检查是否是压缩数据
        if (value.startsWith('__compressed__')) {
          const compressed = value.slice('__compressed__'.length);
          return decodeURIComponent(atob(compressed));
        }
        return value;
      } catch {
        return value;
      }
    },

    setItem: (name: string, value: string): void => {
      try {
        // 如果数据超过阈值，进行压缩
        if (value.length > compressionThreshold) {
          const compressed = '__compressed__' + btoa(encodeURIComponent(value));
          storage.setItem(name, compressed);
        } else {
          storage.setItem(name, value);
        }
      } catch (error) {
        // 压缩失败，直接存储原数据
        console.warn('[CompressedStorage] Compression failed, storing raw data:', error);
        storage.setItem(name, value);
      }
    },

    removeItem: (name: string): void => {
      storage.removeItem(name);
    }
  };
};

export default {
  createDebouncedStorage,
  createIncrementalStorage,
  createCompressedStorage
};
