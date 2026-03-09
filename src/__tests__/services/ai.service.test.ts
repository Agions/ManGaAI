/**
 * AI 服务测试
 */

import { aiService } from '@/core/services/ai.service';
import type { AIModel, AIModelSettings } from '@/core/types';

// Mock 配置
const mockModel: AIModel = {
  id: 'test-model',
  name: 'Test Model',
  provider: 'iflytek',
  category: ['text'],
  description: 'Test model',
  features: [],
  tokenLimit: 1000,
  contextWindow: 1000,
};

const mockSettings: AIModelSettings = {
  enabled: true,
  apiKey: 'test-key',
};

describe('AI Service', () => {
  beforeEach(() => {
    // 启用 Mock 模式
    aiService.setMockMode(true);
  });

  afterEach(() => {
    // 禁用 Mock 模式
    aiService.setMockMode(false);
  });

  describe('generateScript', () => {
    it('应该生成脚本数据', async () => {
      const params = {
        topic: '测试主题',
        style: 'professional',
        tone: '正式',
        length: 'medium',
        audience: '技术人员',
        language: 'zh',
      };

      const result = await aiService.generateScript(mockModel, mockSettings, params);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title', params.topic);
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('segments');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toMatchObject({
        style: params.style,
        tone: params.tone,
        length: params.length,
        targetAudience: params.audience,
        language: params.language,
        generatedBy: mockModel.id,
      });
    });
  });

  describe('generate', () => {
    it('应该返回生成的文本', async () => {
      const result = await aiService.generate('测试提示词', {
        model: 'spark-v3.5',
        provider: 'openai',
      });

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('optimizeScript', () => {
    it('应该优化脚本', async () => {
      const script = '这是原始脚本内容';
      const result = await aiService.optimizeScript(
        mockModel,
        mockSettings,
        script,
        'professional'
      );

      expect(typeof result).toBe('string');
    });
  });

  describe('translateScript', () => {
    it('应该翻译脚本', async () => {
      const script = '这是原始脚本';
      const result = await aiService.translateScript(
        mockModel,
        mockSettings,
        script,
        'English'
      );

      expect(typeof result).toBe('string');
    });
  });

  describe('analyzeVideo', () => {
    it('应该分析视频', async () => {
      const videoInfo = {
        duration: 120,
        width: 1920,
        height: 1080,
        format: 'mp4',
      };

      const result = await aiService.analyzeVideo(mockModel, mockSettings, videoInfo);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('scenes');
      expect(result).toHaveProperty('keyframes');
      expect(Array.isArray(result.scenes)).toBe(true);
      expect(Array.isArray(result.keyframes)).toBe(true);
    });
  });

  describe('batchGenerate', () => {
    it('应该批量生成', async () => {
      const prompts = ['提示词1', '提示词2', '提示词3'];

      const results = await aiService.batchGenerate(prompts, {
        model: 'spark-v3.5',
        provider: 'openai',
        concurrency: 2,
      });

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Mock 配置', () => {
    it('应该使用自定义延迟', async () => {
      const requestId = 'default';
      aiService.setMockConfig(requestId, { delay: 100 });

      const start = Date.now();
      await aiService.generate('测试', { model: 'spark-v3.5', provider: 'test' });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);

      aiService.clearMockConfig(requestId);
    });

    it('应该模拟失败', async () => {
      const requestId = 'default';
      aiService.setMockConfig(requestId, { shouldFail: true, errorMessage: '测试错误' });

      await expect(
        aiService.generate('测试', { model: 'spark-v3.5', provider: 'test' })
      ).rejects.toThrow('测试错误');

      aiService.clearMockConfig(requestId);
    });
  });
});
