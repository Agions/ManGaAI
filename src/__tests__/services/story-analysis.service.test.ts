import { aiService } from '@/core/services/ai.service';
import { storyAnalysisService } from '@/core/services/story-analysis.service';

jest.mock('@/core/services/ai.service', () => ({
  aiService: {
    generate: jest.fn(),
  },
}));

describe('storyAnalysisService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should parse structured json from ai response', async () => {
    (aiService.generate as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        title: '测试故事',
        summary: '这是一个测试摘要',
        genre: '都市',
        characters: [{ name: '林雨晴', role: 'main', traits: ['坚强'] }],
        conflictPoints: ['误会升级'],
        chapters: [{ title: '第1章', summary: '开端', keyEvents: ['相遇'] }],
      })
    );

    const result = await storyAnalysisService.analyze('第1章\n故事开始');

    expect(result.title).toBe('测试故事');
    expect(result.characters.length).toBe(1);
    expect(result.chapters.length).toBe(1);
    expect(result.modelInfo).toBeDefined();
  });

  it('should fallback to rule-based analysis when ai fails', async () => {
    (aiService.generate as jest.Mock).mockRejectedValue(new Error('api error'));

    const content = ['第1章 开端', '内容A'.repeat(60), '第2章 转折', '内容B'.repeat(60)].join('\n');
    const result = await storyAnalysisService.analyze(content, { maxRetries: 1 });

    expect(result.title).toContain('第1章');
    expect(result.chapters.length).toBeGreaterThan(0);
  });
});
