/**
 * 增强版一致性服务
 * 确保角色形象、表情、风格、声音全剧一致
 */

import { storageService } from './storage.service';
import { v4 as uuidv4 } from 'uuid';

// ========== 类型定义 ==========

// 角色定义
export interface Character {
  id: string;
  name: string;
  description: string;
  appearance: CharacterAppearance;
  personality: string[];
  expressions: CharacterExpressions;
  voice?: CharacterVoice;
  referenceImages: string[];
  createdAt: string;
  updatedAt: string;
}

// 外观特征
export interface CharacterAppearance {
  gender: 'male' | 'female' | 'unknown';
  age: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  eyeShape: string;
  clothing: string;
  features: string[]; // 面部特征：疤痕、眼镜等
  bodyType: string;
  height: string;
}

// 表情系统
export interface CharacterExpressions {
  happy: string;    // 开心表情描述
  sad: string;      // 悲伤表情描述
  angry: string;    // 生气表情描述
  surprised: string; // 惊讶表情描述
  neutral: string;  // 中性表情描述
  custom: Record<string, string>; // 自定义表情
}

// 声音配置
export interface CharacterVoice {
  type: string;      // 声音类型
  pitch: string;     // 音高
  speed: string;     // 语速
  emotion: string;   // 情感
  tone: string;      // 语调
  referenceAudio?: string; // 参考音频
}

// 漫剧风格
export interface DramaStyle {
  id: string;
  name: string;
  genre: 'romance' | 'action' | 'comedy' | 'drama' | 'mystery' | 'fantasy';
  tone: 'light' | 'dark' | 'neutral';
  pacing: 'slow' | 'normal' | 'fast';
  artStyle: 'anime' | 'manga' | 'realistic' | 'chibi';
  colorPalette: string[];
  lightingStyle: string;
  characteristics: string[];
  basePrompt: string;
}

// ========== 一致性检查结果
export interface ConsistencyIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
  autoFixable: boolean;
}

// 一致性检查点
export interface ConsistencyCheckpoint {
  id: string;
  episodeId: string;
  sceneId: string;
  type: 'character' | 'appearance' | 'scene' | 'style';
  status: 'passed' | 'warning' | 'failed';
  issues: ConsistencyIssue[];
  checkedAt: string;
}

// 角色库
export interface CharacterLibrary {
  projectId: string;
  characters: Character[];
  mainCharacter?: string;
  dramaStyle?: DramaStyle;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
  }>;
}

// ========== 表情映射 ==========

// 表情到 AI 绘图提示词的映射
const EXPRESSION_PROMPTS: Record<string, string> = {
  happy: '笑容灿烂，眼睛眯成月牙状，嘴角上扬，露出牙齿，整体欢乐愉悦',
  sad: '眉头微皱，眼神忧郁，嘴角下垂，面色苍白，整体悲伤低沉',
  angry: '眉头紧锁，眼睛瞪大，嘴角紧抿，面色阴沉，整体愤怒不满',
  surprised: '眼睛瞪大，嘴巴微张，眉毛上扬，整体惊讶震撼',
  neutral: '表情自然放松，眼神平和，嘴唇自然闭合，整体平静温和',
  thinking: '眼睛微眯，手指轻抚下巴，眉头微皱，整体陷入思考',
  afraid: '眼睛瞪大，嘴巴张大，面色苍白，身体微微颤抖，整体惊恐害怕',
  embarrassed: '脸颊微红，眼神躲闪，挠头摸脸，整体尴尬不好意思',
  confused: '眼睛迷茫，眉头扭曲，嘴巴歪斜，整体困惑不解',
  laughing: '开怀大笑，眼睛眯成缝，嘴巴大张，整体大笑不止'
};

// ========== 服务类 ==========

class EnhancedConsistencyService {
  private characterCache: Map<string, Character> = new Map();
  private styleCache: Map<string, DramaStyle> = new Map();
  private libraryCache: Map<string, CharacterLibrary> = new Map();

  // ========== 角色管理 ==========

  /**
   * 创建角色 - 增强版
   */
  createCharacter(characterData: Partial<Character>): Character {
    const character: Character = {
      id: characterData.id || `char_${uuidv4().slice(0, 8)}`,
      name: characterData.name || '未命名角色',
      description: characterData.description || '',
      appearance: characterData.appearance || this.getDefaultAppearance(),
      personality: characterData.personality || [],
      expressions: characterData.expressions || this.getDefaultExpressions(),
      voice: characterData.voice,
      referenceImages: characterData.referenceImages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.characterCache.set(character.id, character);
    return character;
  }

  /**
   * 获取默认外观
   */
  private getDefaultAppearance(): CharacterAppearance {
    return {
      gender: 'unknown',
      age: '未知',
      hairStyle: '',
      hairColor: '',
      eyeColor: '',
      eyeShape: '',
      clothing: '',
      features: [],
      bodyType: '中等',
      height: '中等'
    };
  }

  /**
   * 获取默认表情
   */
  private getDefaultExpressions(): CharacterExpressions {
    return {
      happy: EXPRESSION_PROMPTS.happy,
      sad: EXPRESSION_PROMPTS.sad,
      angry: EXPRESSION_PROMPTS.angry,
      surprised: EXPRESSION_PROMPTS.surprised,
      neutral: EXPRESSION_PROMPTS.neutral,
      custom: {}
    };
  }

  /**
   * 更新角色
   */
  updateCharacter(id: string, updates: Partial<Character>): Character | null {
    const character = this.characterCache.get(id);
    if (!character) return null;

    const updated: Character = {
      ...character,
      ...updates,
      appearance: { ...character.appearance, ...updates.appearance },
      expressions: { ...character.expressions, ...updates.expressions },
      voice: { ...character.voice, ...updates.voice },
      updatedAt: new Date().toISOString()
    };

    this.characterCache.set(id, updated);
    return updated;
  }

  /**
   * 获取角色
   */
  getCharacter(id: string): Character | undefined {
    return this.characterCache.get(id);
  }

  /**
   * 获取所有角色
   */
  getAllCharacters(): Character[] {
    return Array.from(this.characterCache.values());
  }

  // ========== 提示词生成 ==========

  /**
   * 生成角色完整提示词 - 用于 AI 图像生成
   */
  generateCharacterPrompt(character: Character, options?: {
    includeExpression?: string;
    includeAction?: string;
    includeStyle?: string;
  }): string {
    const { appearance, expressions } = character;
    
    let prompt = `角色名称: ${character.name}\n`;
    
    // 外观特征
    prompt += `【外观】\n`;
    prompt += `性别: ${appearance.gender === 'male' ? '男性' : appearance.gender === 'female' ? '女性' : '未知'}\n`;
    prompt += `年龄: ${appearance.age}\n`;
    prompt += `身高: ${appearance.height}, 体型: ${appearance.bodyType}\n`;
    prompt += `发型: ${appearance.hairStyle}, 发色: ${appearance.hairColor}\n`;
    prompt += `眼睛: ${appearance.eyeColor}色, 眼型: ${appearance.eyeShape}\n`;
    prompt += `服装: ${appearance.clothing}\n`;
    if (appearance.features.length > 0) {
      prompt += `面部特征: ${appearance.features.join('、')}\n`;
    }
    
    // 表情特征
    if (options?.includeExpression) {
      const expression = expressions.custom[options.includeExpression] || 
                        expressions[options.includeExpression as keyof CharacterExpressions] ||
                        expressions.neutral;
      prompt += `\n【表情】${expression}\n`;
    }
    
    // 动作
    if (options?.includeAction) {
      prompt += `\n【动作】${options.includeAction}\n`;
    }
    
    // 风格要求
    prompt += `\n【一致性要求】\n`;
    prompt += `重要: 必须严格保持以上外观特征不变！\n`;
    prompt += `保持发型、发色、眼睛、服装等特征完全一致！\n`;
    
    if (options?.includeStyle) {
      prompt += `风格: ${options.includeStyle}\n`;
    }
    
    return prompt.trim();
  }

  /**
   * 生成表情提示词
   */
  generateExpressionPrompt(character: Character, emotion: string): string {
    const { expressions, name, appearance } = character;
    
    // 查找对应表情
    let expressionText: string;
    if (expressions.custom[emotion] !== undefined) {
      expressionText = expressions.custom[emotion];
    } else if (emotion in expressions && typeof expressions[emotion as keyof typeof expressions] === 'string') {
      expressionText = expressions[emotion as keyof typeof expressions] as string;
    } else {
      expressionText = expressions.neutral;
    }
    
    return `${name}的${emotion}表情: ${expressionText}
    
基础外观特征（必须保持）:
- 发型: ${appearance.hairStyle}, ${appearance.hairColor}
- 眼睛: ${appearance.eyeColor}色
- 服装: ${appearance.clothing}

重要: 在保持以上外观特征完全一致的前提下，展现${emotion}的表情。`;
  }

  /**
   * 生成批量角色提示词
   */
  generateBatchCharacterPrompt(characters: Character[], scene?: string): string {
    if (characters.length === 0) return '';
    
    const prompts = characters.map(char => 
      this.generateCharacterPrompt(char, { includeStyle: '统一漫画风格' })
    );
    
    let prompt = '【多角色场景】\n\n';
    prompt += `场景描述: ${scene || '多人互动场景'}\n\n`;
    prompt += '【角色列表】\n\n';
    prompt += prompts.join('\n\n---\n\n');
    
    prompt += '\n\n【场景要求】\n';
    prompt += '以上所有角色必须同时出现在场景中，保持各自的外观特征一致。\n';
    prompt += '确保每个人物的发型、发色、服装与各自的角色设定完全匹配。';
    
    return prompt;
  }

  // ========== 漫剧风格 ==========

  /**
   * 创建漫剧风格
   */
  createDramaStyle(styleData: Partial<DramaStyle>): DramaStyle {
    const style: DramaStyle = {
      id: styleData.id || `style_${uuidv4().slice(0, 8)}`,
      name: styleData.name || '默认风格',
      genre: styleData.genre || 'drama',
      tone: styleData.tone || 'neutral',
      pacing: styleData.pacing || 'normal',
      artStyle: styleData.artStyle || 'anime',
      colorPalette: styleData.colorPalette || ['#FFFFFF', '#000000', '#FF6B6B'],
      lightingStyle: styleData.lightingStyle || '自然光',
      characteristics: styleData.characteristics || [],
      basePrompt: styleData.basePrompt || ''
    };

    this.styleCache.set(style.id, style);
    return style;
  }

  /**
   * 获取漫剧风格
   */
  getDramaStyle(id: string): DramaStyle | undefined {
    return this.styleCache.get(id);
  }

  /**
   * 生成漫剧风格提示词
   */
  generateDramaStylePrompt(style: DramaStyle): string {
    const genreMap: Record<string, string> = {
      romance: '浪漫爱情',
      action: '动作冒险',
      comedy: '喜剧搞笑',
      drama: '剧情正剧',
      mystery: '悬疑推理',
      fantasy: '奇幻玄幻'
    };

    const toneMap: Record<string, string> = {
      light: '轻松明快',
      dark: '沉重黑暗',
      neutral: '中性平衡'
    };

    const pacingMap: Record<string, string> = {
      slow: '缓慢细腻',
      normal: '适中流畅',
      fast: '快速紧凑'
    };

    const artStyleMap: Record<string, string> = {
      anime: '日式动漫风格',
      manga: '漫画风格',
      realistic: '写实风格',
      chibi: 'Q版可爱风格'
    };

    let prompt = `【漫剧风格】${style.name}\n`;
    prompt += `类型: ${genreMap[style.genre]}\n`;
    prompt += `基调: ${toneMap[style.tone]}\n`;
    prompt += `节奏: ${pacingMap[style.pacing]}\n`;
    prompt += `画风: ${artStyleMap[style.artStyle]}\n`;
    
    if (style.colorPalette.length > 0) {
      prompt += `色调: ${style.colorPalette.join(', ')}\n`;
    }
    
    prompt += `光照: ${style.lightingStyle}\n`;
    
    if (style.characteristics.length > 0) {
      prompt += `特点: ${style.characteristics.join('、')}\n`;
    }
    
    if (style.basePrompt) {
      prompt += `\n基础描述: ${style.basePrompt}\n`;
    }
    
    prompt += '\n【重要】全剧必须保持以上风格完全统一！';
    
    return prompt.trim();
  }

  // ========== 一致性检查 ==========

  /**
   * 检查角色外观一致性
   */
  checkAppearanceConsistency(
    characterId: string,
    newDescription: string
  ): ConsistencyIssue[] {
    const character = this.getCharacter(characterId);
    if (!character) {
      return [{
        type: 'character_not_found',
        severity: 'error',
        message: '角色不存在',
        suggestion: '请先创建角色',
        autoFixable: false
      }];
    }

    const issues: ConsistencyIssue[] = [];
    const { appearance } = character;

    // 检查发型
    if (appearance.hairStyle && !newDescription.includes(appearance.hairStyle)) {
      issues.push({
        type: 'hair_style_mismatch',
        severity: 'warning',
        message: `发型可能不一致: ${appearance.hairStyle}`,
        suggestion: `描述中应包含发型: ${appearance.hairStyle}`,
        autoFixable: true
      });
    }

    // 检查发色
    if (appearance.hairColor && !newDescription.includes(appearance.hairColor)) {
      issues.push({
        type: 'hair_color_mismatch',
        severity: 'warning',
        message: `发色可能不一致: ${appearance.hairColor}`,
        suggestion: `描述中应包含发色: ${appearance.hairColor}`,
        autoFixable: true
      });
    }

    // 检查眼睛
    if (appearance.eyeColor && !newDescription.includes(appearance.eyeColor)) {
      issues.push({
        type: 'eye_color_mismatch',
        severity: 'warning',
        message: `眼睛颜色可能不一致: ${appearance.eyeColor}`,
        suggestion: `描述中应包含眼睛颜色: ${appearance.eyeColor}`,
        autoFixable: true
      });
    }

    // 检查服装
    if (appearance.clothing && !newDescription.includes(appearance.clothing)) {
      issues.push({
        type: 'clothing_mismatch',
        severity: 'warning',
        message: `服装可能不一致: ${appearance.clothing}`,
        suggestion: `描述中应包含服装: ${appearance.clothing}`,
        autoFixable: true
      });
    }

    return issues;
  }

  /**
   * 检查表情一致性
   */
  checkExpressionConsistency(
    characterId: string,
    expectedEmotion: string,
    actualDescription: string
  ): ConsistencyIssue[] {
    const character = this.getCharacter(characterId);
    if (!character) return [];

    const issues: ConsistencyIssue[] = [];
    const expectedPrompt = this.generateExpressionPrompt(character, expectedEmotion);
    
    // 简单检查: 描述中是否包含表情关键词
    const emotionKeywords: Record<string, string[]> = {
      happy: ['笑', '开心', '高兴', '快乐'],
      sad: ['哭', '悲伤', '难过', '伤心'],
      angry: ['生气', '愤怒', '发火'],
      surprised: ['惊讶', '震惊', '意外'],
      neutral: ['平静', '正常', '面无表情']
    };

    const keywords = emotionKeywords[expectedEmotion] || [];
    const hasEmotion = keywords.some(kw => actualDescription.includes(kw));

    if (!hasEmotion) {
      issues.push({
        type: 'expression_mismatch',
        severity: 'warning',
        message: `表情可能不符合 ${expectedEmotion}`,
        suggestion: `预期表情: ${expectedEmotion}，建议: ${expectedPrompt.slice(0, 100)}...`,
        autoFixable: false
      });
    }

    return issues;
  }

  // ========== 角色库管理 ==========

  /**
   * 保存角色库
   */
  saveCharacterLibrary(projectId: string, library: CharacterLibrary): void {
    storageService.set(`consistency_characters_${projectId}`, library);
    this.libraryCache.set(projectId, library);
  }

  /**
   * 加载角色库
   */
  loadCharacterLibrary(projectId: string): CharacterLibrary | null {
    if (this.libraryCache.has(projectId)) {
      return this.libraryCache.get(projectId)!;
    }
    
    const library = storageService.get<CharacterLibrary>(`consistency_characters_${projectId}`);
    if (library) {
      this.libraryCache.set(projectId, library);
      // 恢复缓存
      library.characters.forEach(char => this.characterCache.set(char.id, char));
      if (library.dramaStyle) {
        this.styleCache.set(library.dramaStyle.id, library.dramaStyle);
      }
    }
    return library;
  }

  /**
   * 导出角色参考手册
   */
  exportCharacterHandbook(projectId: string): string {
    const library = this.loadCharacterLibrary(projectId);
    if (!library) return '# 角色库为空\n\n请先创建角色。';

    let handbook = `# ${library.dramaStyle?.name || '漫剧'} 角色参考手册\n\n`;
    handbook += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    handbook += `---\n\n`;

    // 漫剧风格
    if (library.dramaStyle) {
      handbook += `## 漫剧风格\n\n`;
      handbook += this.generateDramaStylePrompt(library.dramaStyle);
      handbook += `\n\n---\n\n`;
    }

    // 角色列表
    library.characters.forEach(char => {
      handbook += `## ${char.name}\n\n`;
      handbook += `**ID**: ${char.id}\n\n`;
      handbook += `**描述**: ${char.description || '无'}\n\n`;
      
      // 外观
      handbook += `### 外观特征\n\n`;
      const { appearance } = char;
      handbook += `- 性别: ${appearance.gender === 'male' ? '男' : appearance.gender === 'female' ? '女' : '未知'}\n`;
      handbook += `- 年龄: ${appearance.age}\n`;
      handbook += `- 身高: ${appearance.height}, 体型: ${appearance.bodyType}\n`;
      handbook += `- 发型: ${appearance.hairStyle}\n`;
      handbook += `- 发色: ${appearance.hairColor}\n`;
      handbook += `- 眼睛: ${appearance.eyeColor}色, ${appearance.eyeShape}\n`;
      handbook += `- 服装: ${appearance.clothing}\n`;
      if (appearance.features.length > 0) {
        handbook += `- 特征: ${appearance.features.join('、')}\n`;
      }
      
      // 表情
      handbook += `\n### 表情参考\n\n`;
      const expr = char.expressions;
      handbook += `- 开心: ${expr.happy.slice(0, 50)}...\n`;
      handbook += `- 悲伤: ${expr.sad.slice(0, 50)}...\n`;
      handbook += `- 生气: ${expr.angry.slice(0, 50)}...\n`;
      handbook += `- 惊讶: ${expr.surprised.slice(0, 50)}...\n`;
      handbook += `- 中性: ${expr.neutral.slice(0, 50)}...\n`;
      
      // 提示词
      handbook += `\n### AI 绘图提示词\n\n`;
      handbook += '```\n';
      handbook += this.generateCharacterPrompt(char);
      handbook += '\n```\n\n';
      
      handbook += `---\n\n`;
    });

    handbook += `\n---\n*手册由 ManGa AI 一致性服务生成*\n`;
    
    return handbook;
  }

  /**
   * 导出风格指南
   */
  exportStyleGuide(projectId: string): string {
    const library = this.loadCharacterLibrary(projectId);
    if (!library || !library.dramaStyle) return '# 风格未定义';

    const style = library.dramaStyle;

    return `# ${style.name} 风格指南

## 基础信息
- 类型: ${style.genre}
- 基调: ${style.tone}
- 节奏: ${style.pacing}
- 画风: ${style.artStyle}
- 光照: ${style.lightingStyle}

## 色调
${style.colorPalette.join(', ')}

## 特点
${style.characteristics.map(c => `- ${c}`).join('\n')}

## AI 提示词
\`\`\`
${this.generateDramaStylePrompt(style)}
\`\`\`

---
*生成时间: ${new Date().toLocaleString('zh-CN')}*`;
  }

  /**
   * 拆分长句子 - 从基础版迁移
   */
  splitLongSentences(text: string): string {
    const sentences = text.split(/([。！？.!?])/);
    const result: string[] = [];

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || '';

      if (sentence.length > 30) {
        // 在逗号处拆分
        const parts = sentence.split(/，/);
        result.push(...parts.map((p, idx) =>
          idx === parts.length - 1 ? p + punctuation : p + '。'
        ));
      } else {
        result.push(sentence + punctuation);
      }
    }

    return result.join('');
  }

  /**
   * 生成一致性报告 - 从基础版迁移
   */
  generateConsistencyReport(
    episodeId: string,
    checkpoints: ConsistencyCheckpoint[]
  ): string {
    const failed = checkpoints.filter(c => c.status === 'failed');
    const warnings = checkpoints.filter(c => c.status === 'warning');
    const passed = checkpoints.filter(c => c.status === 'passed');

    return `
# 一致性检查报告

## 概览
- 剧集: ${episodeId}
- 检查时间: ${new Date().toLocaleString('zh-CN')}
- 总检查点: ${checkpoints.length}
- ✅ 通过: ${passed.length}
- ⚠️ 警告: ${warnings.length}
- ❌ 失败: ${failed.length}

## 详细结果

${checkpoints.map(cp => `
### ${cp.sceneId}
- 类型: ${cp.type}
- 状态: ${cp.status === 'passed' ? '✅ 通过' : cp.status === 'warning' ? '⚠️ 警告' : '❌ 失败'}
${cp.issues.map(issue => `
- ${issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️'} ${issue.message}
  - 建议: ${issue.suggestion}
  - 可自动修复: ${issue.autoFixable ? '是' : '否'}
`).join('')}
`).join('\n')}

## 建议
${failed.length > 0 ? '- 优先处理失败项\n' : ''}${warnings.length > 0 ? '- 关注警告项\n' : ''}- 定期检查一致性

---
*报告由 ManGaAI 一致性服务生成*
    `.trim();
  }
}

// 导出单例
export const enhancedConsistencyService = new EnhancedConsistencyService();
export default EnhancedConsistencyService;
