/**
 * 小说拆解服务
 * 将小说内容自动拆分为剧本格式
 */

import { aiService } from './ai.service';
import { costService } from './cost.service';

// 小说章节
export interface NovelChapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

// 剧本场景
export interface ScriptScene {
  id: string;
  chapterId: string;
  sceneNumber: number;
  location: string;
  time: string;
  characters: string[];
  action: string;
  dialogue: Array<{
    character: string;
    text: string;
    emotion?: string;
  }>;
  description: string;
  duration: number; // 预估秒数
}

// 剧本
export interface Script {
  id: string;
  title: string;
  source: 'novel' | 'original';
  novelId?: string;
  totalScenes: number;
  totalDuration: number;
  characters: string[];
  scenes: ScriptScene[];
  createdAt: string;
}

// 小说解析结果
export interface NovelParseResult {
  title: string;
  author?: string;
  summary: string;
  characters: Array<{
    name: string;
    description: string;
    importance: 'main' | 'supporting' | 'minor';
  }>;
  chapters: NovelChapter[];
  totalWords: number;
}

// 分镜
export interface Storyboard {
  id: string;
  sceneId: string;
  panelNumber: number;
  shotType: 'wide' | 'medium' | 'close' | 'extreme_close' | 'over_shoulder';
  angle: 'eye_level' | 'high' | 'low' | 'dutch';
  movement: 'static' | 'pan' | 'tilt' | 'zoom' | 'track';
  description: string;
  characters: string[];
  background: string;
  lighting: string;
  mood: string;
  duration: number;
  prompt: string; // AI 生成提示词
}

class NovelService {
  /**
   * 解析小说
   */
  async parseNovel(
    content: string,
    options: {
      maxChapters?: number;
      provider?: string;
      model?: string;
    } = {}
  ): Promise<NovelParseResult> {
    const { maxChapters = 50, provider = 'alibaba', model = 'qwen-3.5' } = options;

    const prompt = `
请解析以下小说内容，提取关键信息并以 JSON 格式返回：

小说内容：
${content.slice(0, 10000)}${content.length > 10000 ? '...' : ''}

请返回以下格式的 JSON：
{
  "title": "小说标题",
  "author": "作者（如有）",
  "summary": "故事概要（200字以内）",
  "characters": [
    {
      "name": "角色名",
      "description": "角色描述",
      "importance": "main/supporting/minor"
    }
  ],
  "chapters": [
    {
      "title": "章节标题",
      "content": "章节内容摘要",
      "wordCount": 字数,
      "order": 章节序号
    }
  ],
  "totalWords": 总字数
}

注意：
1. 最多提取 ${maxChapters} 个章节
2. 角色按重要性分类：主角(main)、配角(supporting)、龙套(minor)
3. 章节内容只需摘要，不需要全文
4. 确保 JSON 格式正确
`;

    const aiResponse = await aiService.generate(prompt, { provider, model });

    try {
      const result = JSON.parse(aiResponse);
      return result as NovelParseResult;
    } catch (error) {
      throw new Error('小说解析失败：AI 返回格式错误');
    }
  }

  /**
   * 将小说章节转换为剧本场景
   */
  async convertToScenes(
    chapter: NovelChapter,
    characters: string[],
    options: {
      scenesPerChapter?: number;
      provider?: string;
      model?: string;
    } = {}
  ): Promise<ScriptScene[]> {
    const { scenesPerChapter = 3, provider = 'alibaba', model = 'qwen-3.5' } = options;

    const prompt = `
请将以下小说章节转换为 ${scenesPerChapter} 个剧本场景。

章节标题：${chapter.title}
章节内容：
${chapter.content.slice(0, 5000)}${chapter.content.length > 5000 ? '...' : ''}

角色列表：${characters.join('、')}

请返回以下格式的 JSON 数组：
[
  {
    "sceneNumber": 1,
    "location": "场景地点",
    "time": "时间（白天/夜晚/清晨/黄昏）",
    "characters": ["出场角色"],
    "action": "角色动作",
    "dialogue": [
      {
        "character": "说话角色",
        "text": "对话内容",
        "emotion": "情绪（平静/激动/悲伤/开心/愤怒）"
      }
    ],
    "description": "场景描述",
    "duration": 预估秒数
  }
]

注意：
1. 每个场景要有明确的时间地点
2. 对话要符合角色性格
3. 场景之间要有连贯性
4. 总时长控制在 ${scenesPerChapter * 30}-${scenesPerChapter * 60} 秒
5. 确保 JSON 格式正确
`;

    const aiResponse = await aiService.generate(prompt, { provider, model });

    try {
      const scenes = JSON.parse(aiResponse);
      return scenes.map((scene: unknown, index: number) => {
        if (typeof scene === 'object' && scene !== null) {
          return {
            id: `scene_${chapter.id}_${index}`,
            chapterId: chapter.id,
            ...(scene as Record<string, unknown>)
          } as ScriptScene;
        }
        return {
          id: `scene_${chapter.id}_${index}`,
          chapterId: chapter.id,
          sceneNumber: index + 1,
          location: '',
          time: '',
          characters: [],
          action: '',
          dialogue: [],
          description: '',
          duration: 0
        } as ScriptScene;
      });
    } catch (error) {
      throw new Error('场景转换失败：AI 返回格式错误');
    }
  }

  /**
   * 生成完整剧本
   */
  async generateScript(
    novelResult: NovelParseResult,
    options: {
      chaptersToUse?: number;
      scenesPerChapter?: number;
      provider?: string;
      model?: string;
    } = {}
  ): Promise<Script> {
    const {
      chaptersToUse = 5,
      scenesPerChapter = 3,
      provider = 'alibaba',
      model = 'qwen-3.5'
    } = options;

    const characterNames = novelResult.characters.map(c => c.name);
    const selectedChapters = novelResult.chapters.slice(0, chaptersToUse);

    const allScenes: ScriptScene[] = [];

    for (const chapter of selectedChapters) {
      const scenes = await this.convertToScenes(chapter, characterNames, {
        scenesPerChapter,
        provider,
        model
      });
      allScenes.push(...scenes);
    }

    const totalDuration = allScenes.reduce((sum, s) => sum + s.duration, 0);

    const script: Script = {
      id: `script_${Date.now()}`,
      title: `${novelResult.title} (改编)`,
      source: 'novel',
      novelId: novelResult.title,
      totalScenes: allScenes.length,
      totalDuration,
      characters: characterNames,
      scenes: allScenes,
      createdAt: new Date().toISOString()
    };

    // 记录成本
    costService.recordLLMCost(
      provider,
      model,
      2000 * chaptersToUse,
      1000 * chaptersToUse,
      { operation: 'novel_to_script', chapters: chaptersToUse }
    );

    return script;
  }

  /**
   * 生成场景分镜
   */
  async generateStoryboard(
    scene: ScriptScene,
    options: {
      panelsPerScene?: number;
      provider?: string;
      model?: string;
    } = {}
  ): Promise<Storyboard[]> {
    const { panelsPerScene = 3, provider = 'alibaba', model = 'qwen-3.5' } = options;

    const prompt = `
请为以下剧本场景生成 ${panelsPerScene} 个分镜。

场景信息：
- 地点：${scene.location}
- 时间：${scene.time}
- 角色：${scene.characters.join('、')}
- 动作：${scene.action}
- 对话：${scene.dialogue.map(d => `${d.character}: ${d.text}`).join('\n')}
- 描述：${scene.description}

请返回以下格式的 JSON 数组：
[
  {
    "panelNumber": 1,
    "shotType": "镜头类型（wide/medium/close/extreme_close/over_shoulder）",
    "angle": "角度（eye_level/high/low/dutch）",
    "movement": "运动（static/pan/tilt/zoom/track）",
    "description": "画面描述",
    "characters": ["画面中角色"],
    "background": "背景描述",
    "lighting": "光线描述",
    "mood": "氛围情绪",
    "duration": 持续时间秒数
  }
]

注意：
1. 分镜要覆盖场景的关键时刻
2. 镜头类型要多样化
3. 画面要有电影感
4. 确保 JSON 格式正确
`;

    const aiResponse = await aiService.generate(prompt, { provider, model });

    try {
      const panels = JSON.parse(aiResponse);
      return panels.map((panel: unknown, index: number) => {
        const panelObj = typeof panel === 'object' && panel !== null ? panel as Record<string, unknown> : {};
        return {
          id: `storyboard_${scene.id}_${index}`,
          sceneId: scene.id,
          ...panelObj,
          prompt: this.generatePanelPrompt(panel, scene)
        } as Storyboard;
      });
    } catch (error) {
      throw new Error('分镜生成失败：AI 返回格式错误');
    }
  }

  /**
   * 生成分镜提示词
   */
  private generatePanelPrompt(panel: unknown, scene: ScriptScene): string {
    const shotTypeMap: Record<string, string> = {
      wide: '全景',
      medium: '中景',
      close: '近景',
      extreme_close: '特写',
      over_shoulder: '过肩镜头'
    };

    const angleMap: Record<string, string> = {
      eye_level: '平视',
      high: '俯视',
      low: '仰视',
      dutch: '倾斜'
    };

    const panelObj = typeof panel === 'object' && panel !== null ? panel as Record<string, unknown> : {};
    const shotType = String(panelObj.shotType || '');
    const angle = String(panelObj.angle || '');
    const description = String(panelObj.description || '');
    const characters = Array.isArray(panelObj.characters) ? panelObj.characters.join('、') : '';
    const background = String(panelObj.background || '');
    const lighting = String(panelObj.lighting || '');
    const mood = String(panelObj.mood || '');

    return `
${shotTypeMap[shotType] || shotType}，${angleMap[angle] || angle}，
画面：${description}，
角色：${characters}，
背景：${background}，
光线：${lighting}，
氛围：${mood}，
漫画风格，高质量，细节丰富
    `.trim();
  }

  /**
   * 分析小说适合度
   */
  analyzeNovelSuitability(novelResult: NovelParseResult): {
    score: number;
    reasons: string[];
    suggestions: string[];
  } {
    const reasons: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 检查字数
    if (novelResult.totalWords < 5000) {
      score -= 20;
      reasons.push('字数较少，内容可能不够丰富');
      suggestions.push('建议选择 1 万字以上的小说');
    } else if (novelResult.totalWords > 100000) {
      score -= 10;
      reasons.push('字数过多，需要精简处理');
      suggestions.push('建议提取核心章节进行改编');
    }

    // 检查角色数量
    if (novelResult.characters.length < 2) {
      score -= 30;
      reasons.push('角色太少，缺乏互动');
      suggestions.push('建议选择有多角色互动的小说');
    } else if (novelResult.characters.length > 20) {
      score -= 15;
      reasons.push('角色太多，观众难以记忆');
      suggestions.push('建议聚焦主要角色，简化配角');
    }

    // 检查章节数量
    if (novelResult.chapters.length < 3) {
      score -= 20;
      reasons.push('章节太少，故事可能不完整');
    }

    // 检查主角
    const hasMainCharacter = novelResult.characters.some(c => c.importance === 'main');
    if (!hasMainCharacter) {
      score -= 25;
      reasons.push('缺少明确的主角');
      suggestions.push('建议选择有清晰主角的小说');
    }

    return {
      score: Math.max(0, score),
      reasons,
      suggestions
    };
  }

  /**
   * 导出剧本
   */
  exportScript(script: Script, format: 'json' | 'pdf' | 'docx'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(script, null, 2);

      case 'pdf':
      case 'docx':
        // 生成文本格式
        return this.generateScriptText(script);

      default:
        throw new Error('不支持的格式');
    }
  }

  /**
   * 生成剧本文本
   */
  private generateScriptText(script: Script): string {
    const lines: string[] = [
      `《${script.title}》`,
      `改编剧本`,
      `总场景数: ${script.totalScenes}`,
      `预估时长: ${Math.floor(script.totalDuration / 60)}分${script.totalDuration % 60}秒`,
      `角色: ${script.characters.join('、')}`,
      '',
      '=== 场景列表 ===',
      ''
    ];

    for (const scene of script.scenes) {
      lines.push(
        `场景 ${scene.sceneNumber}`,
        `地点: ${scene.location}`,
        `时间: ${scene.time}`,
        `角色: ${scene.characters.join('、')}`,
        '',
        `动作: ${scene.action}`,
        '',
        '对话:'
      );

      for (const dialogue of scene.dialogue) {
        lines.push(`  ${dialogue.character} (${dialogue.emotion}): ${dialogue.text}`);
      }

      lines.push(
        '',
        `描述: ${scene.description}`,
        `预估时长: ${scene.duration}秒`,
        '',
        '---',
        ''
      );
    }

    return lines.join('\n');
  }
}

// 导出单例
export const novelService = new NovelService();
export default NovelService;
