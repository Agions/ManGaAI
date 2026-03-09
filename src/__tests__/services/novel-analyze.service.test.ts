/**
 * 小说分析服务测试
 */

import { aiService } from '@/core/services/ai.service';
import { novelAnalyzer } from '@/core/services/novel-analyze.service';

// Mock AI 服务
jest.mock('@/core/services/ai.service', () => ({
  aiService: {
    generate: jest.fn(),
    setMockMode: jest.fn(),
    isMockMode: jest.fn(),
  },
}));

describe('NovelAnalyzer', () => {
  beforeEach(() => {
    // 启用 Mock 模式
    (aiService.setMockMode as jest.Mock).mockImplementation(() => {});
    (aiService.isMockMode as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // 测试用的小说内容
  const sampleNovelContent = `
第一章：初遇

清晨的阳光透过窗帘，洒在林雨晴的脸上。她缓缓睁开眼睛，感受着温暖的触感。

"早安。"一个温柔的声音从身旁传来。

林雨晴转头，看到王思远正微笑着看着她。这是他们的第一次相遇，在大学的图书馆里。

"你也在这个图书馆学习吗？"林雨晴问道。

"是的，我经常来这里。"王思远回答道，"我叫王思远，计算机系的学生。"

"你好，我是林雨晴，中文系的。"

两人相视一笑，阳光洒在他们的脸上，温暖而美好。

第二章：相知

随着时间的推移，林雨晴和王思远的关系越来越亲密。他们一起学习，一起吃饭，一起散步。

"今天的夕阳真美啊。"林雨晴感叹道。

"就像你一样美。"王思远轻声说道。

林雨晴的脸红了，她低下头，心中充满了甜蜜。

第三章：危机

然而，幸福的时光总是短暂的。王思远的家庭突然发生了变故，他不得不离开学校。

"我必须走了。"王思远说道，眼中满是无奈。

"我会等你的。"林雨晴坚定地说道。

两人在雨中告别，泪水模糊了视线。
`;

  describe('parseNovelContent', () => {
    it('应该解析小说内容并返回结构化数据', async () => {
      // Mock AI 响应
      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          title: '校园恋曲',
          author: '测试作者',
          genre: '青春校园',
          summary: '一个关于青春和爱情的故事',
          wordCount: 2000,
          chapterCount: 3,
          tags: ['校园', '青春', '爱情'],
          language: 'zh',
        })
      );

      const result = await novelAnalyzer.parseNovelContent(sampleNovelContent);

      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('chapters');
      expect(result).toHaveProperty('scenes');
      expect(result).toHaveProperty('characters');
      expect(result).toHaveProperty('statistics');
    });

    it('应该正确计算统计信息', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          title: '测试小说',
          wordCount: 1500,
          chapterCount: 2,
        })
      );

      const result = await novelAnalyzer.parseNovelContent(sampleNovelContent);

      expect(result.statistics).toHaveProperty('totalWords');
      expect(result.statistics).toHaveProperty('totalChapters');
      expect(result.statistics).toHaveProperty('totalScenes');
      expect(result.statistics).toHaveProperty('totalCharacters');
    });
  });

  describe('extractCharacters', () => {
    it('应该能够提取对话中的角色', async () => {
      const testContent = '林雨晴说道："我喜欢这本书。"王思远回答："我也喜欢。"';

      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([
          {
            name: '林雨晴',
            role: 'main',
            importance: 9,
            description: '女主角',
          },
          {
            name: '王思远',
            role: 'main',
            importance: 9,
            description: '男主角',
          },
        ])
      );

      // 由于方法是私有的，我们只能测试公开接口
      const result = await novelAnalyzer.parseNovelContent(testContent);

      expect(result.characters).toBeDefined();
    });
  });

  describe('exportToScript', () => {
    it('应该能够导出为剧本格式', async () => {
      (aiService.generate as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({
          title: '测试小说',
          wordCount: 1000,
          chapterCount: 1,
        })
      );

      const result = await novelAnalyzer.parseNovelContent('第一章：开始\n\n内容...');

      const script = novelAnalyzer.exportToScript(result, 'manga');

      expect(typeof script).toBe('string');
      expect(script).toContain('# 测试小说');
      expect(script).toContain('=== 角色列表 ===');
      expect(script).toContain('=== 场景列表 ===');
    });
  });

  describe('config', () => {
    it('应该使用默认配置', () => {
      // 验证 novelAnalyzer 已正确初始化
      expect(novelAnalyzer).toBeDefined();
      expect(novelAnalyzer.parseNovelContent).toBeDefined();
      expect(novelAnalyzer.exportToScript).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该在 AI 解析失败时使用默认元数据', async () => {
      (aiService.generate as jest.Mock).mockRejectedValueOnce(
        new Error('API Error')
      );

      const result = await novelAnalyzer.parseNovelContent(sampleNovelContent);

      // 应该仍然返回基本结构
      expect(result.metadata).toHaveProperty('title');
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });
  });
});

describe('EmotionType', () => {
  it('应该包含所有预期的情感类型', () => {
    const { EmotionType } = require('@/core/types/novel.types');

    expect(EmotionType.HAPPY).toBe('happy');
    expect(EmotionType.SAD).toBe('sad');
    expect(EmotionType.ANGRY).toBe('angry');
    expect(EmotionType.NEUTRAL).toBe('neutral');
    expect(EmotionType.EXCITED).toBe('excited');
    expect(EmotionType.ROMANTIC).toBe('romantic');
    expect(EmotionType.ACTION).toBe('action');
  });
});

describe('Novel types', () => {
  it('应该正确导出所有类型', () => {
    // 导入类型确保编译通过
    const types: import('@/core/types/novel.types').NovelMetadata = {
      id: 'test',
      title: 'test',
      wordCount: 100,
      chapterCount: 1,
      createdAt: '2024-01-01',
    };

    expect(types).toBeDefined();
    expect(types.title).toBe('test');
  });
});
