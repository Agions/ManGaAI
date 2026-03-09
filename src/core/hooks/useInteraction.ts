/**
 * 交互反馈 Hook
 * 提供加载状态、错误处理、确认对话框等功能
 */

import { useState, useCallback, useRef } from 'react';
import { message, Modal } from 'antd';
import { ConfirmDialog, useConfirm, ConfirmDialogProps } from '@/components/common/ConfirmDialog';

// ============================================
// 加载状态 Hook
// ============================================

export interface UseLoadingOptions {
  defaultLoading?: boolean;
}

export interface UseLoadingReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

export const useLoading = (options?: UseLoadingOptions): UseLoadingReturn => {
  const [loading, setLoading] = useState(options?.defaultLoading || false);

  const withLoading = useCallback(async <T,>(promise: Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await promise;
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, setLoading, withLoading };
};

// ============================================
// 异步操作 Hook
// ============================================

export interface UseAsyncOptions<T> {
  defaultValue?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseAsyncReturn<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  reset: () => void;
}

export const useAsync = <T,>(
  asyncFn: () => Promise<T>,
  options?: UseAsyncOptions<T>
): UseAsyncReturn<T> => {
  const [data, setData] = useState<T | undefined>(options?.defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (mountedRef.current) {
        setData(result);
        options?.onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFn, options]);

  const reset = useCallback(() => {
    setData(options?.defaultValue);
    setError(null);
    setLoading(false);
  }, [options?.defaultValue]);

  return { data, loading, error, execute, reset };
};

// ============================================
// 轮询 Hook
// ============================================

export interface UsePollingOptions {
  interval?: number;  // 轮询间隔（毫秒）
  immediate?: boolean; // 是否立即执行
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export interface UsePollingReturn {
  start: () => void;
  stop: () => void;
  isPolling: boolean;
}

export const usePolling = (
  fetchFn: () => Promise<unknown>,
  options: UsePollingOptions = {}
): UsePollingReturn => {
  const { interval = 5000, immediate = true, onSuccess, onError } = options;
  const [isPolling, setIsPolling] = useState(immediate);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stop = useCallback(() => {
    setIsPolling(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const poll = useCallback(async () => {
    try {
      const data = await fetchFn();
      onSuccess?.(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      onError?.(error);
    }
  }, [fetchFn, onSuccess, onError]);

  // 设置轮询
  useState(() => {
    if (immediate) {
      poll();
      timerRef.current = setInterval(poll, interval);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  });

  return { start, stop, isPolling };
};

// ============================================
// 消息提示 Hook
// ============================================

export interface UseMessageOptions {
  maxCount?: number;
  duration?: number;
}

export interface UseMessageReturn {
  success: (content: string, duration?: number) => void;
  error: (content: string, duration?: number) => void;
  info: (content: string, duration?: number) => void;
  warning: (content: string, duration?: number) => void;
  loading: (content: string, duration?: number) => void;
}

export const useMessage = (options?: UseMessageOptions): UseMessageReturn => {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const success = useCallback((content: string, duration = 3) => {
    message.success(content, duration);
  }, []);

  const error = useCallback((content: string, duration = 4) => {
    message.error(content, duration);
  }, []);

  const info = useCallback((content: string, duration = 3) => {
    message.info(content, duration);
  }, []);

  const warning = useCallback((content: string, duration = 4) => {
    message.warning(content, duration);
  }, []);

  const loading = useCallback((content: string, duration = 0) => {
    const key = message.loading(content, duration);
    // message.loading returns a function to dismiss the message
    setLoadingKey(String(key));
    return key;
  }, []);

  return { success, error, info, warning, loading };
};

// ============================================
// 确认对话框 Hook
// ============================================

export interface UseModalConfirmOptions extends ConfirmDialogProps {}

export interface UseModalConfirmReturn {
  confirm: (options?: UseModalConfirmOptions) => Promise<boolean>;
  ModalConfirm: React.FC<Omit<ConfirmDialogProps, 'open' | 'onOk' | 'onCancel'>>;
}

export const useModalConfirm = (defaultOptions?: UseModalConfirmOptions): UseModalConfirmReturn => {
  const { confirm, ConfirmDialog } = useConfirm(defaultOptions);

  return {
    confirm: (options) => confirm(options || {}),
    ModalConfirm: ConfirmDialog,
  };
};

// ============================================
// 标签页状态 Hook
// ============================================

export interface UseTabsOptions {
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
}

export interface UseTabsReturn {
  activeKey: string;
  setActiveKey: (key: string) => void;
  changeActiveKey: (key: string) => void;
}

export const useTabs = (options?: UseTabsOptions): UseTabsReturn => {
  const [activeKey, setActiveKey] = useState(options?.defaultActiveKey || '1');

  const changeActiveKey = useCallback((key: string) => {
    setActiveKey(key);
    options?.onChange?.(key);
  }, [options]);

  return {
    activeKey,
    setActiveKey,
    changeActiveKey,
  };
};

// ============================================
// 折叠面板 Hook
// ============================================

export interface UseCollapseOptions {
  defaultExpandedKeys?: string[];
}

export interface UseCollapseReturn {
  expandedKeys: string[];
  toggle: (key: string) => void;
  expand: (key: string) => void;
  collapse: (key: string) => void;
  expandAll: (keys: string[]) => void;
  collapseAll: () => void;
  isExpanded: (key: string) => boolean;
}

export const useCollapse = (options?: UseCollapseOptions): UseCollapseReturn => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(options?.defaultExpandedKeys || []);

  const toggle = useCallback((key: string) => {
    setExpandedKeys(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  }, []);

  const expand = useCallback((key: string) => {
    setExpandedKeys(prev =>
      prev.includes(key) ? prev : [...prev, key]
    );
  }, []);

  const collapse = useCallback((key: string) => {
    setExpandedKeys(prev => prev.filter(k => k !== key));
  }, []);

  const expandAll = useCallback((keys: string[]) => {
    setExpandedKeys(keys);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedKeys([]);
  }, []);

  const isExpanded = useCallback((key: string) => {
    return expandedKeys.includes(key);
  }, [expandedKeys]);

  return {
    expandedKeys,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    isExpanded,
  };
};

// ============================================
// 步进器 Hook
// ============================================

export interface UseStepperOptions {
  initial?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

export interface UseStepperReturn {
  value: number;
  setValue: (value: number) => void;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useStepper = (options: UseStepperOptions = {}): UseStepperReturn => {
  const {
    initial = 0,
    min = 0,
    max = 100,
    step = 1,
    onChange
  } = options;

  const [value, setValue] = useState(initial);

  const increment = useCallback(() => {
    setValue(prev => {
      const next = Math.min(prev + step, max);
      onChange?.(next);
      return next;
    });
  }, [step, max, onChange]);

  const decrement = useCallback(() => {
    setValue(prev => {
      const next = Math.max(prev - step, min);
      onChange?.(next);
      return next;
    });
  }, [step, min, onChange]);

  const reset = useCallback(() => {
    setValue(initial);
    onChange?.(initial);
  }, [initial, onChange]);

  return {
    value,
    setValue,
    increment,
    decrement,
    reset,
  };
};
