/**
 * 请求重试工具
 * 用于处理请求失败时自动重试
 */

export interface RetryOptions {
  maxRetries: number;       // 最大重试次数
  delay: number;            // 基础延迟（毫秒）
  backoff?: 'linear' | 'exponential' | 'none'; // 退避策略
  retryCondition?: (error: unknown) => boolean; // 判断是否重试
  onRetry?: (attempt: number, error: unknown) => void; // 重试回调
}

/**
 * 默认重试条件 - 只对网络错误重试
 */
const defaultRetryCondition = (error: unknown): boolean => {
  if (error instanceof TypeError) {
    // 网络错误
    return true;
  }
  if (error instanceof Response) {
    // HTTP 错误
    return error.status >= 500 || error.status === 429;
  }
  // 对于 Error 对象，检查错误消息
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('fetch') ||
           message.includes('timeout') ||
           message.includes('econnrefused');
  }
  return false;
};

/**
 * 带重试的请求函数
 */
export const retryRequest = async <T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 'exponential',
    retryCondition = defaultRetryCondition,
    onRetry
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 判断是否应该重试
      if (attempt < maxRetries && retryCondition(error)) {
        // 计算延迟时间
        let actualDelay = delay;
        if (backoff === 'exponential') {
          actualDelay = delay * Math.pow(2, attempt);
        } else if (backoff === 'linear') {
          actualDelay = delay * (attempt + 1);
        }

        // 调用重试回调
        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, actualDelay));
      } else {
        // 不重试，直接抛出错误
        throw error;
      }
    }
  }

  throw lastError;
};

/**
 * 带超时控制的请求
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(timeoutError ?? new Error(`请求超时: ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

/**
 * 组合重试和超时
 */
export const retryWithTimeout = async <T>(
  fn: () => Promise<T>,
  retryOptions: Partial<RetryOptions> = {},
  timeoutMs?: number
): Promise<T> => {
  const execute = () => timeoutMs ? withTimeout(fn(), timeoutMs) : fn();
  return retryRequest(execute, retryOptions);
};

/**
 * 创建可取消的请求
 */
export const createCancellableRequest = <T>(
  fn: () => Promise<T>
): { request: Promise<T>; cancel: () => void } => {
  let cancelled = false;

  const request = (async () => {
    const result = await fn();
    if (cancelled) {
      throw new Error('请求已取消');
    }
    return result;
  })();

  const cancel = () => {
    cancelled = true;
  };

  return { request, cancel };
};

/**
 * 批量请求处理
 */
export const batchRequests = async <T>(
  items: unknown[],
  processor: (item: unknown) => Promise<T>,
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<T[]> => {
  const { concurrency = 3, onProgress } = options;
  const results: T[] = new Array(items.length);
  let completed = 0;

  const processItem = async (item: unknown, index: number) => {
    const result = await processor(item);
    results[index] = result;
    completed++;
    if (onProgress) {
      onProgress(completed, items.length);
    }
    return result;
  };

  // 分批处理
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map((item, batchIndex) =>
      processItem(item, i + batchIndex)
    );
    await Promise.all(batchPromises);
  }

  return results;
};

export default {
  retryRequest,
  withTimeout,
  retryWithTimeout,
  createCancellableRequest,
  batchRequests
};
