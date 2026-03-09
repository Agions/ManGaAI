/**
 * 工具函数测试
 */

import {
  formatDuration,
  formatFileSize,
  formatDate,
  debounce,
  throttle,
  deepClone,
  generateId,
  truncateText,
  capitalize,
  uniqueArray,
  chunkArray,
  delay,
} from '@/core/utils';

describe('工具函数测试', () => {
  describe('formatDuration', () => {
    it('应该正确格式化秒数', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3661)).toBe('1:01:01');
    });

    it('应该处理负数', () => {
      expect(formatDuration(-1)).toBe('0:00');
    });
  });

  describe('formatFileSize', () => {
    it('应该正确格式化文件大小', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('formatDate', () => {
    it('应该正确格式化日期', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
      expect(formatDate(date, 'HH:mm')).toBe('10:30');
    });
  });

  describe('debounce', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });
    afterAll(() => {
      jest.useRealTimers();
    });

    it('应该延迟执行函数', () => {
      const fn = jest.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });
    afterAll(() => {
      jest.useRealTimers();
    });

    it('应该在时间限制内只执行一次', () => {
      const fn = jest.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepClone', () => {
    it('应该深拷贝对象', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('应该深拷贝数组', () => {
      const original = [1, 2, [3, 4]];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned[2]).not.toBe(original[2]);
    });
  });

  describe('generateId', () => {
    it('应该生成唯一 ID', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+_[a-z0-9]+$/);
    });
  });

  describe('truncateText', () => {
    it('应该截断长文本', () => {
      const text = '这是一个很长的文本内容';
      expect(truncateText(text, 5)).toBe('这是...');
      expect(truncateText(text, 10, '...')).toBe('这是一个很长的...');
    });

    it('不应该截断短文本', () => {
      const text = '短';
      expect(truncateText(text, 10)).toBe('短');
    });
  });

  describe('capitalize', () => {
    it('应该首字母大写', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('')).toBe('');
    });
  });

  describe('uniqueArray', () => {
    it('应该去重', () => {
      expect(uniqueArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('chunkArray', () => {
    it('应该分块数组', () => {
      expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('delay', () => {
    it('应该延迟指定时间', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});
