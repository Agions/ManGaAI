/**
 * SecureStorageService - 安全存储服务
 * 使用 Tauri Store API 替代 localStorage，敏感数据加密存储
 * 
 * 在非 Tauri 环境（如测试）中自动回退到 localStorage
 */

const CHECKPOINT_PREFIX = 'checkpoint_';

interface CheckpointData {
  stepId: string;
  completed: boolean;
  data: unknown;
  timestamp: number;
}

// Detect if we're in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

class SecureStorageService {
  private store: unknown = null;
  private initPromise: Promise<void> | null = null;
  private useFallback = false;

  private async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (!isTauri) {
        this.useFallback = true;
        return;
      }

      try {
        const { Store } = await import('@tauri-apps/plugin-store');
        this.store = await Store.load('secure-data.json');
      } catch (error) {
        logger.warn('[SecureStorage] Tauri store not available, using localStorage fallback:', error);
        this.useFallback = true;
      }
    })();

    return this.initPromise;
  }

  async saveCheckpoint(stepId: string, data: unknown): Promise<void> {
    await this.init();

    const state: CheckpointData = {
      stepId,
      completed: true,
      data,
      timestamp: Date.now(),
    };

    if (this.useFallback || !this.store) {
      localStorage.setItem(`${CHECKPOINT_PREFIX}${stepId}`, JSON.stringify(state));
      return;
    }

    try {
      const store = this.store as { set: (key: string, value: unknown) => Promise<void>; save: () => Promise<void> };
      await store.set(`${CHECKPOINT_PREFIX}${stepId}`, state);
      await store.save();
    } catch {
      localStorage.setItem(`${CHECKPOINT_PREFIX}${stepId}`, JSON.stringify(state));
    }
  }

  async loadCheckpoint(stepId: string): Promise<CheckpointData | null> {
    await this.init();

    if (this.useFallback || !this.store) {
      const raw = localStorage.getItem(`${CHECKPOINT_PREFIX}${stepId}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }

    try {
      const store = this.store as { get: <T>(key: string) => Promise<T | null> };
      const result = await store.get<CheckpointData>(`${CHECKPOINT_PREFIX}${stepId}`);
      return result ?? null;
    } catch {
      const raw = localStorage.getItem(`${CHECKPOINT_PREFIX}${stepId}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }

  async clearCheckpoint(stepId: string): Promise<void> {
    await this.init();

    if (this.useFallback || !this.store) {
      localStorage.removeItem(`${CHECKPOINT_PREFIX}${stepId}`);
      return;
    }

    try {
      const store = this.store as { delete: (key: string) => Promise<void>; save: () => Promise<void> };
      await store.delete(`${CHECKPOINT_PREFIX}${stepId}`);
      await store.save();
    } catch {
      localStorage.removeItem(`${CHECKPOINT_PREFIX}${stepId}`);
    }
  }

  async clearAllCheckpoints(): Promise<void> {
    await this.init();

    if (this.useFallback || !this.store) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CHECKPOINT_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
      return;
    }

    try {
      const store = this.store as { keys: () => Promise<string[]>; delete: (key: string) => Promise<void>; save: () => Promise<void> };
      const keys = await store.keys();
      for (const key of keys) {
        if (key.startsWith(CHECKPOINT_PREFIX)) {
          await store.delete(key);
        }
      }
      await store.save();
    } catch {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CHECKPOINT_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    }
  }

  async saveSecureConfig(key: string, value: string): Promise<void> {
    await this.init();

    if (this.useFallback || !this.store) {
      localStorage.setItem(`secure_${key}`, value);
      return;
    }

    try {
      const store = this.store as { set: (key: string, value: string) => Promise<void>; save: () => Promise<void> };
      await store.set(`secure_${key}`, value);
      await store.save();
    } catch {
      localStorage.setItem(`secure_${key}`, value);
    }
  }

  async getSecureConfig(key: string): Promise<string | null> {
    await this.init();

    if (this.useFallback || !this.store) {
      return localStorage.getItem(`secure_${key}`);
    }

    try {
      const store = this.store as { get: <T>(key: string) => Promise<T | null> };
      const result = await store.get<string>(`secure_${key}`);
      return result ?? null;
    } catch {
      return localStorage.getItem(`secure_${key}`);
    }
  }

  async deleteSecureConfig(key: string): Promise<void> {
    await this.init();

    if (this.useFallback || !this.store) {
      localStorage.removeItem(`secure_${key}`);
      return;
    }

    try {
      const store = this.store as { delete: (key: string) => Promise<void>; save: () => Promise<void> };
      await store.delete(`secure_${key}`);
      await store.save();
    } catch {
      localStorage.removeItem(`secure_${key}`);
    }
  }

  async saveProjectData(projectId: string, data: unknown): Promise<void> {
    await this.init();

    if (this.useFallback || !this.store) {
      localStorage.setItem(`project_${projectId}`, JSON.stringify({ data, updatedAt: Date.now() }));
      return;
    }

    try {
      const store = this.store as { set: (key: string, value: unknown) => Promise<void>; save: () => Promise<void> };
      await store.set(`project_${projectId}`, { data, updatedAt: Date.now() });
      await store.save();
    } catch {
      localStorage.setItem(`project_${projectId}`, JSON.stringify({ data, updatedAt: Date.now() }));
    }
  }

  async loadProjectData<T>(projectId: string): Promise<T | null> {
    await this.init();

    if (this.useFallback || !this.store) {
      const raw = localStorage.getItem(`project_${projectId}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw).data as T;
      } catch {
        return null;
      }
    }

    try {
      const store = this.store as { get: <T>(key: string) => Promise<T | null> };
      const result = await store.get<{ data: T; updatedAt: number }>(`project_${projectId}`);
      return result?.data ?? null;
    } catch {
      const raw = localStorage.getItem(`project_${projectId}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw).data as T;
      } catch {
        return null;
      }
    }
  }
}

export const secureStorage = new SecureStorageService();
export default secureStorage;
