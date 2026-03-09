export interface IdleRunOptions {
  timeoutMs?: number;
}

export function runWhenIdle(task: () => void, options: IdleRunOptions = {}): () => void {
  const timeoutMs = options.timeoutMs ?? 120;
  const g = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: () => void) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (typeof g.requestIdleCallback === 'function') {
    const id = g.requestIdleCallback(task);
    return () => {
      if (typeof g.cancelIdleCallback === 'function') {
        g.cancelIdleCallback(id);
      }
    };
  }

  const timer = window.setTimeout(task, timeoutMs);
  return () => window.clearTimeout(timer);
}
