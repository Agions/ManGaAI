import { runWhenIdle } from '@/core/utils/idle';

describe('runWhenIdle', () => {
  afterEach(() => {
    jest.useRealTimers();
    delete (globalThis as any).requestIdleCallback;
    delete (globalThis as any).cancelIdleCallback;
  });

  it('uses requestIdleCallback when available', () => {
    const task = jest.fn();
    const cancelIdle = jest.fn();
    const requestIdle = jest.fn((cb: IdleRequestCallback) => {
      cb({
        didTimeout: false,
        timeRemaining: () => 50,
      } as IdleDeadline);
      return 42;
    });

    (globalThis as any).requestIdleCallback = requestIdle;
    (globalThis as any).cancelIdleCallback = cancelIdle;

    const cancel = runWhenIdle(task, { timeoutMs: 10 });

    expect(requestIdle).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledTimes(1);

    cancel();
    expect(cancelIdle).toHaveBeenCalledWith(42);
  });

  it('falls back to setTimeout when requestIdleCallback is unavailable', () => {
    jest.useFakeTimers();
    const task = jest.fn();

    const cancel = runWhenIdle(task, { timeoutMs: 50 });

    expect(task).not.toHaveBeenCalled();
    jest.advanceTimersByTime(49);
    expect(task).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(task).toHaveBeenCalledTimes(1);

    // Calling cancel after execution should not throw.
    expect(() => cancel()).not.toThrow();
  });

  it('clears timeout on cancel in fallback mode', () => {
    jest.useFakeTimers();
    const task = jest.fn();

    const cancel = runWhenIdle(task, { timeoutMs: 80 });
    cancel();
    jest.advanceTimersByTime(100);

    expect(task).not.toHaveBeenCalled();
  });
});
