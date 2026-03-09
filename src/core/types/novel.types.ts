/**
 * 小说解析类型定义
 * 用于小说内容解析、AI分析和剧本生成
 */

// 情感类型枚举
export enum EmotionType {
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  FEARFUL = 'fearful',
  SURPRISED = 'surprised',
  DISGUSTED = 'disgusted',
  NEUTRAL = 'neutral',
  EXCITED = 'excited',
  TENSE = 'tense',
  RELAXED = 'relaxed',
  ROMANTIC = 'romantic',
  MYSTERIOUS = 'mysterious',
  COMEDIC = 'comedic',
  DRAMATIC = 'dramatic',
  ACTION = 'action',
  CALM = 'calm',
}

// 剧本格式类型
export type ScriptFormat = 'screenplay' | 'comic' | 'manga' | 'animation' | 'novel';

// 小说元数据
export interface NovelMetadata {
  id: string;
  title: string;
  author?: string;
  genre?: string;
  summary?: string;
  wordCount: number;
  chapterCount: number;
  tags?: string[];
  language?: string;
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

// 章节
export interface Chapter {
  id: string;
  novelId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  summary?: string;
  characters?: string[];
  locations?: string[];
  timePeriod?: string;
}

// 场景
export interface NovelScene {
  id: string;
  chapterId: string;
  sceneNumber: number;
  title?: string;
  content: string;
  location?: string;
  time?: string;
  startPosition: number;
  endPosition: number;
  characters: string[];
  dialogues: Dialogue[];
  narrator?: string;
  emotions: SceneEmotion[];
  tags?: string[];
  imagePrompts?: string[];
}

// 对话
export interface Dialogue {
  id: string;
  sceneId: string;
  character: string;
  content: string;
  emotion?: EmotionType;
  emotionIntensity?: number;
  position: number;
  isNarration?: boolean;
}

// 角色
export interface Character {
  id: string;
  name: string;
  aliases?: string[];
  description?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  role: 'main' | 'supporting' | 'minor';
  importance: number;
  firstAppearance?: {
    chapterId: string;
    chapterTitle: string;
    position: number;
  };
  dialogues: string[];
  relationships?: CharacterRelationship[];
}

// 角色关系
export interface CharacterRelationship {
  targetCharacterId: string;
  type: 'family' | 'friend' | 'enemy' | 'romantic' | 'mentor' | 'rival' | 'colleague';
  description?: string;
}

// 场景情感
export interface SceneEmotion {
  type: EmotionType;
  intensity: number;
  dominant: boolean;
  characters?: string[];
}

// 解析配置
export interface AnalyzeConfig {
  maxChapters?: number;
  minChapterLength?: number;
  sceneMinLength?: number;
  detectCharacters?: boolean;
  detectEmotions?: boolean;
  generatePrompts?: boolean;
  provider?: string;
  model?: string;
}

// 解析结果
export interface AnalyzeResult {
  metadata: NovelMetadata;
  chapters: Chapter[];
  scenes: NovelScene[];
  characters: Character[];
  statistics: NovelStatistics;
}

// 小说统计信息
export interface NovelStatistics {
  totalWords: number;
  totalChapters: number;
  totalScenes: number;
  totalCharacters: number;
  mainCharacters: number;
  supportingCharacters: number;
  minorCharacters: number;
  dialogueCount: number;
  avgChapterLength: number;
  avgSceneLength: number;
  locationCount: number;
  timePeriods: string[];
  dominantEmotions: Record<EmotionType, number>;
  genre?: string;
}

// 场景描述生成结果
export interface SceneDescription {
  sceneId: string;
  description: string;
  visualElements: VisualElement[];
  mood: string;
  colorPalette?: string[];
  lighting?: string;
  cameraAngle?: string;
  imagePrompt: string;
  negativePrompt?: string;
}

// 视觉元素
export interface VisualElement {
  type: 'character' | 'object' | 'background' | 'effect';
  name: string;
  description: string;
  position?: { x: number; y: number; z?: number };
  attributes?: Record<string, string>;
}

// 导出格式选项
export interface ExportOptions {
  format: ScriptFormat;
  includeCharacters: boolean;
  includeDialogues: boolean;
  includeSceneDescriptions: boolean;
  includeImagePrompts: boolean;
  outputLanguage?: string;
}

// ========== A1: 导入与章节切分 ==========

export type ScriptSourceType = 'file' | 'manual';
export type ScriptFileFormat = 'txt' | 'md' | 'docx' | 'unknown';

export interface ScriptSource {
  sourceType: ScriptSourceType;
  filename: string;
  filePath?: string;
  fileFormat: ScriptFileFormat;
  fileSize: number;
  charCount: number;
  importedAt: string;
}

export interface ScriptChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  startIndex: number;
  endIndex: number;
  isAutoSplit: boolean;
}

export interface ScriptValidationIssue {
  level: 'error' | 'warning';
  code: string;
  message: string;
}

export interface ScriptValidationResult {
  valid: boolean;
  issues: ScriptValidationIssue[];
}

export interface StoryAnalysisCharacter {
  name: string;
  role: 'main' | 'supporting' | 'minor';
  traits: string[];
}

export interface StoryAnalysisChapter {
  title: string;
  summary: string;
  keyEvents: string[];
}

export interface StoryAnalysis {
  id: string;
  title: string;
  summary: string;
  genre?: string;
  characters: StoryAnalysisCharacter[];
  conflictPoints: string[];
  chapters: StoryAnalysisChapter[];
  createdAt: string;
  modelInfo?: {
    provider: string;
    model: string;
  };
}
