/**
 * 故事结构化分析服务（A2）
 */

import { aiService } from './ai.service';
import { costService } from './cost.service';
import { scriptImportService } from './script-import.service';
import type { StoryAnalysis } from '@/core/types';

export interface StoryAnalysisOptions {
  provider?: string;
  model?: string;
  maxRetries?: number;
  projectId?: string;
}

class StoryAnalysisService {
  async analyze(content: string, options: StoryAnalysisOptions = {}): Promise<StoryAnalysis> {
    const provider = options.provider || 'alibaba';
    const model = options.model || 'qwen-3.5';
    const maxRetries = options.maxRetries ?? 2;

    const prompt = this.buildPrompt(content);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const raw = await aiService.generate(prompt, { provider, model });
        const parsed = this.parseAnalysis(raw);
        costService.recordLLMCost(
          provider,
          model,
          Math.ceil(prompt.length / 4),
          Math.ceil(raw.length / 4),
          {
            operation: 'story_analysis',
            projectId: options.projectId
          }
        );
        return {
          ...parsed,
          id: parsed.id || `analysis_${Date.now()}`,
          createdAt: parsed.createdAt || new Date().toISOString(),
          modelInfo: { provider, model },
        };
      } catch (error) {
        if (attempt >= maxRetries) {
          break;
        }
      }
    }

    return this.fallbackAnalyze(content, provider, model);
  }

  private buildPrompt(content: string): string {
    return `
请分析以下小说/剧本内容，并输出结构化 JSON。

内容：
${content.slice(0, 12000)}${content.length > 12000 ? '...' : ''}

必须返回 JSON 对象，格式如下：
{
  "id": "analysis_xxx",
  "title": "作品标题",
  "summary": "120字以内故事摘要",
  "genre": "题材类型",
  "characters": [
    {
      "name": "角色名",
      "role": "main/supporting/minor",
      "traits": ["性格1", "性格2"]
    }
  ],
  "conflictPoints": ["冲突点1", "冲突点2"],
  "chapters": [
    {
      "title": "章节标题",
      "summary": "章节摘要",
      "keyEvents": ["事件1", "事件2"]
    }
  ],
  "createdAt": "ISO时间"
}
`;
  }

  private parseAnalysis(raw: string): StoryAnalysis {
    const trimmed = raw.trim();
    const jsonText = trimmed.startsWith('{')
      ? trimmed
      : trimmed.slice(trimmed.indexOf('{'), trimmed.lastIndexOf('}') + 1);

    const parsed = JSON.parse(jsonText);

    return {
      id: parsed.id || '',
      title: parsed.title || '未命名作品',
      summary: parsed.summary || '',
      genre: parsed.genre,
      characters: Array.isArray(parsed.characters)
        ? parsed.characters.map((item: any) => ({
            name: item.name || '未命名角色',
            role: item.role || 'supporting',
            traits: Array.isArray(item.traits) ? item.traits : [],
          }))
        : [],
      conflictPoints: Array.isArray(parsed.conflictPoints) ? parsed.conflictPoints : [],
      chapters: Array.isArray(parsed.chapters)
        ? parsed.chapters.map((item: any) => ({
            title: item.title || '未命名章节',
            summary: item.summary || '',
            keyEvents: Array.isArray(item.keyEvents) ? item.keyEvents : [],
          }))
        : [],
      createdAt: parsed.createdAt || new Date().toISOString(),
      modelInfo: parsed.modelInfo,
    };
  }

  private fallbackAnalyze(content: string, provider: string, model: string): StoryAnalysis {
    const chapters = scriptImportService.splitIntoChapters(content, 20);
    const title = chapters[0]?.title || '未命名作品';

    return {
      id: `analysis_${Date.now()}`,
      title,
      summary: content.slice(0, 150).trim(),
      genre: '未识别',
      characters: [],
      conflictPoints: [],
      chapters: chapters.slice(0, 20).map(item => ({
        title: item.title,
        summary: item.content.slice(0, 120),
        keyEvents: [],
      })),
      createdAt: new Date().toISOString(),
      modelInfo: { provider, model },
    };
  }
}

export const storyAnalysisService = new StoryAnalysisService();
export default StoryAnalysisService;
