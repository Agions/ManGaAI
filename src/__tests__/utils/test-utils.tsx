/**
 * 测试工具函数
 * 提供常用的测试辅助函数
 */

import type { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { act } from 'react-dom/test-utils';

/**
 * 包装测试组件的 HOC
 */
interface WrapperProps {
  children: ReactNode;
}

/**
 * 创建带 providers 的包装器
 */
export const createWrapper = (providers?: React.FC<WrapperProps>[]) => {
  const defaultWrapper: React.FC<WrapperProps> = ({ children }) => (
    <BrowserRouter>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );

  if (!providers || providers.length === 0) {
    return defaultWrapper;
  }

  return ({ children }: WrapperProps) => {
    return providers.reduce(
      (acc, Provider) => <Provider>{acc}</Provider>,
      defaultWrapper({ children })
    );
  };
};

/**
 * 渲染带 providers 的组件
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return render(ui, { wrapper: createWrapper(), ...options });
};

/**
 * 模拟 API 响应
 */
export const mockApiResponse = <T,>(data: T, delay = 300): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * 模拟 API 错误
 */
export const mockApiError = (message: string, status = 500): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message) as Error & { status: number };
      error.status = status;
      reject(error);
    }, 300);
  });
};

/**
 * 创建模拟函数
 */
export const createMockFn = <T extends (...args: never[]) => unknown>(
  returnValue?: ReturnType<typeof jest.fn>
): jest.Mock => {
  return jest.fn(() => returnValue);
};

/**
 * 等待指定时间
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 模拟 DOM 事件
 */
export const simulateEvent = (
  element: HTMLElement,
  eventType: string,
  eventData?: Record<string, unknown>
): void => {
  const event = new Event(eventType, { bubbles: true, cancelable: true });
  Object.assign(event, eventData);
  element.dispatchEvent(event);
};

/**
 * 模拟文件上传
 */
export const createMockFile = (
  name: string,
  type: string,
  size: number
): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

/**
 * 模拟 localStorage
 */
export const createLocalStorageMock = (): Storage => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null) as (key: string) => string | null,
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }) as (key: string, value: string) => void,
    removeItem: jest.fn((key: string) => { delete store[key]; }) as (key: string) => void,
    clear: jest.fn(() => { Object.keys(store).forEach(key => delete store[key]); }) as () => void,
    get length() { return Object.keys(store).length; },
    key: jest.fn((i: number) => Object.keys(store)[i] || null) as (index: number) => string | null,
  } as unknown as Storage;
};

/**
 * 模拟 sessionStorage
 */
export const createSessionStorageMock = createLocalStorageMock;

/**
 * 模拟 IntersectionObserver
 */
export const mockIntersectionObserver = (): void => {
  global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

/**
 * 模拟 ResizeObserver
 */
export const mockResizeObserver = (): void => {
  global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

/**
 * 创建测试 ID 生成器
 */
export const createIdGenerator = () => {
  let counter = 0;
  return {
    next: () => `test-${++counter}`,
    reset: () => { counter = 0; },
  };
};

/**
 * 模拟 Tauri API
 */
export const mockTauriApi = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__TAURI__ = {
    invoke: jest.fn(),
    event: {
      listen: jest.fn(),
      emit: jest.fn(),
    },
    dialog: {
      open: jest.fn(),
      save: jest.fn(),
    },
    fs: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    },
  };
};

/**
 * 清理所有 mocks
 */
export const clearAllMocks = (): void => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};

/**
 * 异步渲染组件
 */
export const renderAsync = async (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): Promise<RenderResult> => {
  // 先同步渲染
  const result = renderWithProviders(ui, options);

  // 等待所有异步操作完成
  await act(async () => {
    await Promise.resolve();
  });

  return result;
};

// 重新导出 testing-library 的辅助函数
export * from '@testing-library/react';
export { act };
