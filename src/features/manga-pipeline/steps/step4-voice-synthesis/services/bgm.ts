import { ScriptScene } from '../../step1-script-generation/types/script';

export interface BGMSelection {
  sceneId: string;
  sceneNumber: number;
  emotion: string;
  bgmType: string; // 音乐类型/风格
  intensity: number; // 强度 0-1
  fadeIn: number; // 淡入时长（秒）
  fadeOut: number; // 淡出时长（秒）
  volume: number; // 音量 0-1
  cueIn: number; // 开始时间点（秒）
  cueOut: number; // 结束时间点（秒）
}

export interface BGMTrack {
  id: string;
  name: string;
  type: string; // 类型：tension, happy, sad, neutral, romantic, action
  duration: number; // 总时长（秒）
  url?: string;
  tags: string[];
}

// 预设 BGM 风格库（可扩展）
export const BGM_STYLES: Record<string, BGMTrack> = {
  tension: {
    id: 'bgm_tension',
    name: '悬疑紧张',
    type: 'tension',
    duration: 180,
    tags: ['suspense', 'dramatic', 'strings'],
  },
  happy: {
    id: 'bgm_happy',
    name: '轻快明亮',
    type: 'happy',
    duration: 180,
    tags: ['upbeat', 'positive', 'acoustic'],
  },
  sad: {
    id: 'bgm_sad',
    name: '忧伤钢琴',
    type: 'sad',
    duration: 180,
    tags: ['piano', 'melancholic', 'slow'],
  },
  neutral: {
    id: 'bgm_neutral',
    name: '背景轻音乐',
    type: 'neutral',
    duration: 180,
    tags: ['ambient', 'soft', 'background'],
  },
  romantic: {
    id: 'bgm_romantic',
    name: '浪漫温馨',
    type: 'romantic',
    duration: 180,
    tags: ['soft', 'warm', 'strings'],
  },
  action: {
    id: 'bgm_action',
    name: '动感节奏',
    type: 'action',
    duration: 180,
    tags: ['upbeat', 'drums', 'energetic'],
  },
};

/**
 * 为每个场景选择合适的 BGM
 */
export function selectBGM(scenes: ScriptScene[]): BGMSelection[] {
  return scenes.map((scene) => {
    const emotion = scene.emotion;
    const bgmType = mapEmotionToBGMType(emotion);
    const bgm = BGM_STYLES[bgmType];

    // 估算 BGM 时长（与场景时长匹配）
    const duration = estimateSceneDuration(scene);

    return {
      sceneId: scene.id,
      sceneNumber: scene.sceneNumber,
      emotion,
      bgmType,
      intensity: getBGMIntensity(emotion),
      fadeIn: 1.5, // 默认 1.5 秒淡入
      fadeOut: 1.5, // 默认 1.5 秒淡出
      volume: getBGMVolume(emotion),
      cueIn: 0,
      cueOut: Math.min(duration, bgm.duration),
    };
  });
}

function mapEmotionToBGMType(emotion: string): string {
  const emotionMap: Record<string, string> = {
    tense: 'tension',
    angry: 'action',
    surprising: 'tension',
    sad: 'sad',
    happy: 'happy',
    neutral: 'neutral',
  };
  return emotionMap[emotion] || 'neutral';
}

function getBGMIntensity(emotion: string): number {
  const intensityMap: Record<string, number> = {
    tense: 0.8,
    angry: 0.9,
    surprising: 0.7,
    sad: 0.4,
    happy: 0.6,
    neutral: 0.3,
  };
  return intensityMap[emotion] ?? 0.3;
}

function getBGMVolume(emotion: string): number {
  const volumeMap: Record<string, number> = {
    tense: 0.4,
    angry: 0.5,
    surprising: 0.4,
    sad: 0.35,
    happy: 0.5,
    neutral: 0.3,
  };
  return volumeMap[emotion] ?? 0.3;
}

function estimateSceneDuration(scene: ScriptScene): number {
  // 基于场景类型估算
  const baseDuration: Record<string, number> = {
    对话: 8,
    动作: 12,
    追逐: 15,
    对峙: 10,
    情感: 10,
    独白: 6,
  };
  return baseDuration[scene.type] || 8;
}
