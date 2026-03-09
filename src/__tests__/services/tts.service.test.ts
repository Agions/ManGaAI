/**
 * TTS 服务测试
 */

import { ttsService, DEFAULT_TTS_CONFIG, TTS_VOICES } from '@/core/services';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000)),
  })
) as jest.Mock;

describe('TTS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVoices', () => {
    it('应该返回指定提供商的所有音色', () => {
      const voices = ttsService.getVoices('edge');
      expect(voices.length).toBeGreaterThan(0);
      expect(voices[0].provider).toBe('edge');
    });

    it('应该返回空数组当提供商不存在', () => {
      const voices = ttsService.getVoices('unknown' as any);
      expect(voices).toEqual([]);
    });
  });

  describe('getAllVoices', () => {
    it('应该返回所有提供商的音色', () => {
      const allVoices = ttsService.getAllVoices();
      expect(allVoices.length).toBeGreaterThan(0);
    });
  });

  describe('getVoiceById', () => {
    it('应该根据 ID 找到音色', () => {
      const voice = ttsService.getVoiceById('zh-CN-XiaoxiaoNeural');
      expect(voice).toBeDefined();
      expect(voice?.name).toBe('晓晓');
    });

    it('应该返回 undefined 当 ID 不存在', () => {
      const voice = ttsService.getVoiceById('nonexistent');
      expect(voice).toBeUndefined();
    });
  });

  describe('synthesize', () => {
    it('应该合成语音', async () => {
      const request = {
        text: '你好世界',
        config: DEFAULT_TTS_CONFIG,
      };

      const response = await ttsService.synthesize(request);

      expect(response).toHaveProperty('audio');
      expect(response).toHaveProperty('duration');
      expect(response).toHaveProperty('size');
      expect(response).toHaveProperty('format');
    });

    it('应该在文本为空时抛出错误', async () => {
      const request = {
        text: '',
        config: DEFAULT_TTS_CONFIG,
      };

      await expect(ttsService.synthesize(request)).rejects.toThrow('文本内容不能为空');
    });

    it('应该在文本只有空格时抛出错误', async () => {
      const request = {
        text: '   ',
        config: DEFAULT_TTS_CONFIG,
      };

      await expect(ttsService.synthesize(request)).rejects.toThrow('文本内容不能为空');
    });

    it('应该调用 fetch', async () => {
      const request = {
        text: '测试',
        config: DEFAULT_TTS_CONFIG,
      };

      await ttsService.synthesize(request);

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('streamSynthesize', () => {
    it('应该流式合成语音', async () => {
      const request = {
        text: '你好世界',
        config: DEFAULT_TTS_CONFIG,
      };

      const chunks: unknown[] = [];
      for await (const chunk of ttsService.streamSynthesize(request)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty('audio');
      expect(chunks[0]).toHaveProperty('isFinal');
    });
  });

  describe('cancelRequest', () => {
    it('应该能取消请求', () => {
      const requestId = 'test-request';
      ttsService.cancelRequest(requestId); // 不应该抛出错误
    });
  });
});

describe('TTS_VOICES', () => {
  it('应该包含 edge 音色', () => {
    expect(TTS_VOICES.edge.length).toBeGreaterThan(0);
  });

  it('edge 音色应该有正确属性', () => {
    const voice = TTS_VOICES.edge[0];
    expect(voice).toHaveProperty('id');
    expect(voice).toHaveProperty('name');
    expect(voice).toHaveProperty('gender');
    expect(voice).toHaveProperty('language');
    expect(voice).toHaveProperty('provider');
  });
});
