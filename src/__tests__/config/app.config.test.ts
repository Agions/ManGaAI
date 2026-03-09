/**
 * 应用配置测试
 */
import {
  APP_CONFIG,
  STORAGE_CONFIG,
  API_CONFIG,
  AI_MODELS,
  VIDEO_CONFIG,
  EXPORT_CONFIG,
  THEME_CONFIG
} from '@/core/config/app.config';

describe('APP_CONFIG', () => {
  it('should have correct app name', () => {
    expect(APP_CONFIG.name).toBe('ManGa AI');
  });

  it('should have correct Chinese name', () => {
    expect(APP_CONFIG.nameZh).toBe('ManGa AI');
  });

  it('should have valid version format', () => {
    expect(APP_CONFIG.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should have description', () => {
    expect(APP_CONFIG.description).toBeTruthy();
    expect(APP_CONFIG.description.length).toBeGreaterThan(0);
  });

  it('should have repository URL', () => {
    expect(APP_CONFIG.repository).toMatch(/^https?:\/\/.+/);
  });

  it('should be frozen object', () => {
    expect(Object.isFrozen(APP_CONFIG)).toBe(true);
  });
});

describe('STORAGE_CONFIG', () => {
  it('should have storage prefix', () => {
    expect(STORAGE_CONFIG.prefix).toBeTruthy();
  });

  it('should have required storage keys', () => {
    expect(STORAGE_CONFIG.keys).toHaveProperty('store');
    expect(STORAGE_CONFIG.keys).toHaveProperty('settings');
    expect(STORAGE_CONFIG.keys).toHaveProperty('projects');
    expect(STORAGE_CONFIG.keys).toHaveProperty('cache');
  });

  it('should use prefix in all keys', () => {
    const keys = Object.values(STORAGE_CONFIG.keys) as unknown[];
    keys.forEach((key: unknown) => {
      expect((key as string).startsWith(STORAGE_CONFIG.prefix)).toBe(true);
    });
  });

  it('should be frozen object', () => {
    expect(Object.isFrozen(STORAGE_CONFIG)).toBe(true);
  });
});

describe('API_CONFIG', () => {
  it('should have timeout greater than 0', () => {
    expect(API_CONFIG.timeout).toBeGreaterThan(0);
  });

  it('should have retry count greater than 0', () => {
    expect(API_CONFIG.retryCount).toBeGreaterThan(0);
  });

  it('should have retry delay greater than 0', () => {
    expect(API_CONFIG.retryDelay).toBeGreaterThan(0);
  });

  it('should be frozen object', () => {
    expect(Object.isFrozen(API_CONFIG)).toBe(true);
  });
});

describe('AI_MODELS', () => {
  it('should have qwen model', () => {
    expect(AI_MODELS.qwen).toBeDefined();
    expect(AI_MODELS.qwen.id).toBe('qwen');
    expect(AI_MODELS.qwen.provider).toBe('阿里云');
  });

  it('should have baidu model', () => {
    expect(AI_MODELS.baidu).toBeDefined();
    expect(AI_MODELS.baidu.id).toBe('baidu');
    expect(AI_MODELS.baidu.provider).toBe('百度');
  });

  it('should have glm5 model', () => {
    expect(AI_MODELS.glm5).toBeDefined();
    expect(AI_MODELS.glm5.id).toBe('glm5');
    expect(AI_MODELS.glm5.provider).toBe('智谱AI');
  });

  it('should have minimax model', () => {
    expect(AI_MODELS.minimax).toBeDefined();
    expect(AI_MODELS.minimax.id).toBe('minimax');
    expect(AI_MODELS.minimax.provider).toBe('MiniMax');
  });

  it('should have baseUrl for all models', () => {
    const models = Object.values(AI_MODELS) as Array<{ baseUrl: string }>;
    models.forEach(model => {
      expect(model.baseUrl).toMatch(/^https?:\/\/.+/);
    });
  });

  it('should have defaultModel for all models', () => {
    const models = Object.values(AI_MODELS) as Array<{ defaultModel: string }>;
    models.forEach(model => {
      expect(model.defaultModel).toBeTruthy();
    });
  });

  it('should be frozen object', () => {
    expect(Object.isFrozen(AI_MODELS)).toBe(true);
  });
});

describe('VIDEO_CONFIG', () => {
  it('should have max file size greater than 0', () => {
    expect(VIDEO_CONFIG.maxFileSize).toBeGreaterThan(0);
  });

  it('should have supported video formats', () => {
    expect(VIDEO_CONFIG.supportedFormats).toContain('mp4');
    expect(VIDEO_CONFIG.supportedFormats).toContain('mov');
  });

  it('should have max duration greater than 0', () => {
    expect(VIDEO_CONFIG.maxDuration).toBeGreaterThan(0);
  });

  it('should have thumbnail size with width and height', () => {
    expect(VIDEO_CONFIG.thumbnailSize).toHaveProperty('width');
    expect(VIDEO_CONFIG.thumbnailSize).toHaveProperty('height');
    expect(VIDEO_CONFIG.thumbnailSize.width).toBeGreaterThan(0);
    expect(VIDEO_CONFIG.thumbnailSize.height).toBeGreaterThan(0);
  });

  it('should be frozen object', () => {
    expect(Object.isFrozen(VIDEO_CONFIG)).toBe(true);
  });
});

describe('EXPORT_CONFIG', () => {
  it('should have export formats', () => {
    expect(EXPORT_CONFIG.formats).toContain('mp4');
    expect(EXPORT_CONFIG.formats).toContain('mov');
    expect(EXPORT_CONFIG.formats).toContain('webm');
  });

  it('should have quality levels', () => {
    expect(EXPORT_CONFIG.qualities).toContain('low');
    expect(EXPORT_CONFIG.qualities).toContain('medium');
    expect(EXPORT_CONFIG.qualities).toContain('high');
    expect(EXPORT_CONFIG.qualities).toContain('ultra');
  });

  it('should have default quality', () => {
    expect(EXPORT_CONFIG.defaultQuality).toBeTruthy();
    expect(EXPORT_CONFIG.qualities).toContain(EXPORT_CONFIG.defaultQuality);
  });

  it('should be frozen object', () => {
    expect(Object.isFrozen(EXPORT_CONFIG)).toBe(true);
  });
});

describe('THEME_CONFIG', () => {
  it('should have primary color', () => {
    expect(THEME_CONFIG.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should have success color', () => {
    expect(THEME_CONFIG.colors.success).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should have warning color', () => {
    expect(THEME_CONFIG.colors.warning).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should have error color', () => {
    expect(THEME_CONFIG.colors.error).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should be frozen object', () => {
    expect(Object.isFrozen(THEME_CONFIG)).toBe(true);
  });
});
