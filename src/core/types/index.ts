/**
 * 核心类型定义
 */

export type {
  ScriptChapter,
  ScriptFileFormat,
  ScriptSource,
  ScriptValidationResult,
  StoryAnalysis,
} from './novel.types';

// AI 模型类型
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'baidu' | 'alibaba' | 'zhipu' | 'iflytek' | 'tencent' | 'minimax' | 'moonshot' | 'bytedance' | 'kling';
export type ModelCategory = 'text' | 'code' | 'image' | 'video' | 'audio' | 'all';

// TTS 提供商类型
export type TTSProvider = 'edge' | 'azure' | 'aliyun' | 'baidu' | 'iflytek' | 'cosyvoice';

// TTS 音色类型
export interface TTSVoice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  provider: TTSProvider;
  style?: string;
  description?: string;
}

// TTS 配置
export interface TTSConfig {
  provider: TTSProvider;
  voice: string;
  speed: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
  volume: number; // 0 - 100
  format: 'audio-16khz-32kbitrate-mono-mp3' | 'audio-16khz-64kbitrate-mono-mp3' | 'audio-24khz-48kbitrate-mono-mp3' | 'audio-24khz-96kbitrate-mono-mp3';
}

// TTS 请求
export interface TTSRequest {
  text: string;
  config: TTSConfig;
  signal?: AbortSignal;
}

// TTS 响应
export interface TTSResponse {
  audio: ArrayBuffer;
  duration: number;
  size: number;
  format: string;
}

// TTS 流式响应片段
export interface TTSStreamChunk {
  audio: ArrayBuffer;
  isFinal: boolean;
}

// 流式输出回调
export interface StreamCallback<T> {
  (chunk: T): void;
  (error: Error): void;
}

// 流式生成选项
export interface StreamOptions {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  onChunk: (content: string, isFinal: boolean) => void;
  signal?: AbortSignal;
}

// AI 模型
export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  category: ModelCategory[];
  description: string;
  features: string[];
  tokenLimit: number;
  contextWindow: number;
  isPro?: boolean;
  isAvailable?: boolean;
  apiConfigured?: boolean;
  pricing?: {
    input: number;
    output: number;
    unit: string;
  };
}

// AI 模型设置
export interface AIModelSettings {
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  apiUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// 模型配置状态
export interface ModelConfigState {
  selectedModel: string;
  models: Record<string, AIModelSettings>;
  isLoading: boolean;
  error: string | null;
}

// 视频信息
export interface VideoInfo {
  id: string;
  path: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  size: number;
  thumbnail?: string;
  createdAt: string;
}

// 场景
export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  thumbnail: string;
  description?: string;
  tags: string[];
  type?: string;
  confidence?: number;
  features?: any;
  objectCount?: number;
  dominantEmotion?: string;
}

// 关键帧
export interface Keyframe {
  id: string;
  timestamp: number;
  thumbnail: string;
  description?: string;
}

// 物体检测
export interface ObjectDetection {
  id: string;
  sceneId: string;
  category: string;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: number;
}

// 情感分析
export interface EmotionAnalysis {
  id: string;
  sceneId: string;
  timestamp: number;
  emotions: Array<{
    id: string;
    name: string;
    score: number;
  }>;
  dominant: string;
  intensity: number;
}

// 视频分析结果
export interface VideoAnalysis {
  id: string;
  videoId: string;
  scenes: Scene[];
  keyframes: Keyframe[];
  objects: ObjectDetection[];
  emotions: EmotionAnalysis[];
  summary: string;
  stats?: {
    sceneCount: number;
    objectCount: number;
    avgSceneDuration: number;
    sceneTypes: Record<string, number>;
    objectCategories: Record<string, number>;
    dominantEmotions: Record<string, number>;
  };
  createdAt: string;
}

// 脚本片段
export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  type: 'narration' | 'dialogue' | 'action' | 'transition';
  notes?: string;
}

// 脚本元数据
export interface ScriptMetadata {
  style: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  targetAudience: string;
  language: string;
  wordCount: number;
  estimatedDuration: number;
  generatedBy: string;
  generatedAt: string;
  template?: string;
  templateName?: string;
}

// 脚本数据
export interface ScriptData {
  id: string;
  title: string;
  content: string;
  segments: ScriptSegment[];
  metadata: ScriptMetadata;
  createdAt: string;
  updatedAt: string;
}

// 项目数据
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'completed' | 'archived';
  videos: VideoInfo[];
  scripts: ScriptData[];
  analysis?: VideoAnalysis;
  characters?: Character[]; // 角色库
  composition?: CompositionProject; // 动态合成配置
  settings?: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

// 项目设置
export interface ProjectSettings {
  videoQuality: 'low' | 'medium' | 'high' | 'ultra';
  outputFormat: 'mp4' | 'mov' | 'webm' | 'mkv';
  resolution: '720p' | '1080p' | '2k' | '4k';
  frameRate: 24 | 30 | 60;
  audioCodec: 'aac' | 'mp3' | 'flac';
  videoCodec: 'h264' | 'h265' | 'vp9';
  subtitleEnabled: boolean;
  subtitleStyle: SubtitleStyle;
}

// 字幕样式
export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  outlineColor: string;
  position: 'top' | 'middle' | 'bottom';
  alignment: 'left' | 'center' | 'right';
}

// 导出设置
export interface ExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'mkv';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: '720p' | '1080p' | '2k' | '4k';
  frameRate: 24 | 30 | 60;
  includeSubtitles: boolean;
  burnSubtitles: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
}

// 导出记录
export interface ExportRecord {
  id: string;
  projectId: string;
  format: string;
  quality: string;
  filePath: string;
  fileSize: number;
  createdAt: string;
}

// 脚本模板
export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  structure: Array<{
    type: 'intro' | 'hook' | 'body' | 'transition' | 'conclusion' | 'cta';
    name: string;
    duration: number;
    description: string;
  }>;
  style: {
    tone: string;
    pace: 'slow' | 'medium' | 'fast';
    formality: 'casual' | 'neutral' | 'formal';
  };
  examples: string[];
  recommended?: boolean;
  isCustom?: boolean;
  popularity?: number;
}

// 用户偏好
export interface UserPreferences {
  autoSave: boolean;
  autoSaveInterval: number;
  defaultVideoQuality: 'low' | 'medium' | 'high' | 'ultra';
  defaultOutputFormat: 'mp4' | 'mov' | 'webm';
  enablePreview: boolean;
  previewQuality: 'low' | 'medium' | 'high';
  notifications: boolean;
  soundEffects: boolean;
}

// API 响应
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    timestamp: string;
  };
}

// 任务状态
export interface TaskStatus {
  id: string;
  type: 'analysis' | 'script' | 'render' | 'export';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type DramaWorkflowStep =
  | 'upload'
  | 'analyze'
  | 'template-select'
  | 'script-generate'
  | 'script-dedup'
  | 'script-edit'
  | 'timeline-edit'
  | 'preview'
  | 'export';

// 视频剪辑
export interface VideoClip {
  id: string;
  startTime: number;
  endTime: number;
  sourceVideoId: string;
  sourceVideoPath: string;
  thumbnail?: string;
  transitions?: {
    in?: string;
    out?: string;
  };
  effects?: string[];
}

// ========== 漫剧工作流基础类型 ==========

// 分镜帧
export interface StoryboardFrame {
  id: string;
  title: string;
  sceneDescription: string;
  composition: string;
  cameraType: string;
  dialogue: string;
  duration: number;
  imageUrl?: string;
}

// ========== 角色设计相关类型 ==========

// 角色外观配置
export interface CharacterAppearance {
  gender: 'male' | 'female' | 'other';
  age: number;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  skinTone: string;
  bodyType: 'slim' | 'average' | 'athletic' | 'heavy';
  height?: number; // cm
  weight?: number; // kg
  features?: string[]; // 特殊特征，如疤痕、纹身等
}

// 服装装备
export interface ClothingItem {
  type: 'head' | 'top' | 'bottom' | 'shoes' | 'accessory';
  name: string;
  style: string;
  color: string;
  pattern?: string;
  material?: string;
}

// 角色表情
export interface CharacterExpression {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  intensity?: 'subtle' | 'neutral' | 'strong' | 'exaggerated';
}

// 角色一致性设置
export interface CharacterConsistency {
  seed?: number; // 随机种子，保证生成一致
  weights?: {
    appearance: number; // 0-1
    voice: number;
    behavior: number;
  };
  referenceImages?: string[]; // 参考图片 URL
}

// 角色完整定义
export interface Character {
  id: string;
  name: string;
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  appearance: CharacterAppearance;
  clothing: ClothingItem[];
  expressions: CharacterExpression[];
  consistency: CharacterConsistency;
  voice?: {
    provider: TTSProvider;
    voiceId: string;
    pitch?: number;
    speed?: number;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ========== 动态合成相关类型 ==========

// 镜头运动类型
export type CameraMotion = 
  | 'static'
  | 'pan-left' | 'pan-right'
  | 'tilt-up' | 'tilt-down'
  | 'dolly-in' | 'dolly-out'
  | 'zoom-in' | 'zoom-out'
  | 'shake' | 'sway'
  | 'follow';

// 转场效果
export type TransitionEffect = 
  | 'none'
  | 'fade' | 'crossfade'
  | 'dissolve'
  | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down'
  | 'slide-left' | 'slide-right'
  | 'zoom'
  | 'blur';

// 动画关键帧属性
export type AnimationProperty = 
  | 'position-x' 
  | 'position-y' 
  | 'scale' 
  | 'rotation' 
  | 'opacity' 
  | 'zoom' 
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'pan-x'
  | 'pan-y';

// 动画关键帧
export interface AnimationKeyframe {
  time: number; // 秒
  property: AnimationProperty;
  value: number; // 0-1 或角度等
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// 动画轨道
export interface AnimationTrack {
  property: 'position-x' | 'position-y' | 'scale' | 'rotation' | 'opacity';
  keyframes: AnimationKeyframe[];
}

// 镜头运动配置
export interface CameraMotionConfig {
  type: CameraMotion;
  duration: number;
  intensity: number; // 0-1
  easing?: string;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
}

// 转场配置
export interface TransitionConfig {
  effect: TransitionEffect;
  duration: number;
  easing?: string;
  color?: string; // 某些转场需要颜色
}

// 分镜动画配置
export interface FrameAnimation {
  frameId: string;
  cameraMotion: CameraMotionConfig | null;
  keyframes?: AnimationKeyframe[];
  zoom?: number; // 缩放倍数
  pan?: { x: number; y: number }; // 平移偏移
  rotation?: number; // 旋转角度
  opacity?: number; // 透明度
  filters?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
}

// 动态合成项目配置
export interface CompositionProject {
  id: string;
  projectId: string;
  frames: FrameAnimation[]; // 每个分镜的动画配置
  transitions: TransitionConfig[]; // 分镜间的转场
  masterSettings: {
    frameDuration: number; // 每帧默认时长
    defaultTransition: TransitionConfig;
    globalEffects?: string[];
  };
  previewState?: {
    currentFrameIndex: number;
    isPlaying: boolean;
    playbackSpeed: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ========== 导出最终类型到 ProjectData ==========

// 扩展 ProjectData 接口（通过声明合并）
// 新增字段：
// - characters?: Character[]
// - composition?: CompositionProject
