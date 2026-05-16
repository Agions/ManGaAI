import { CharacterCard } from '../../step1-script-generation/types/character';

export interface VoiceAssignment {
  characterId: string;
  characterName: string;
  voiceId: string; // TTS 音色 ID
  voiceName: string; // 音色名称
  pitch: number; // 音调调整 (-10 ~ +10)
  speed: number; // 语速调整 (0.5 ~ 2.0)
  volume: number; // 音量 (0 ~ 1)
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'middle' | 'old';
  language: string;
  emotion: string[]; // 支持的情感类型
}

// 预设音色库（可扩展）
export const VOICE_PRESETS: VoiceProfile[] = [
  {
    id: 'zh-CN-XiaoxiaoNeural',
    name: '晓晓（年轻女声）',
    gender: 'female',
    age: 'young',
    language: 'zh-CN',
    emotion: ['happy', 'sad', 'neutral'],
  },
  {
    id: 'zh-CN-XiaoyiNeural',
    name: '小艺（年轻女声）',
    gender: 'female',
    age: 'young',
    language: 'zh-CN',
    emotion: ['happy', 'neutral'],
  },
  {
    id: 'zh-CN-YunxiNeural',
    name: '云希（年轻男声）',
    gender: 'male',
    age: 'young',
    language: 'zh-CN',
    emotion: ['happy', 'sad', 'tense', 'angry', 'neutral'],
  },
  {
    id: 'zh-CN-YunyangNeural',
    name: '云扬（专业男声）',
    gender: 'male',
    age: 'middle',
    language: 'zh-CN',
    emotion: ['neutral', 'formal'],
  },
  {
    id: 'zh-CN-XiaochenNeural',
    name: '晓晨（知性女声）',
    gender: 'female',
    age: 'middle',
    language: 'zh-CN',
    emotion: ['sad', 'neutral'],
  },
];

/**
 * 为角色分配音色
 */
export function assignVoices(
  characters: CharacterCard[],
  options: { preferredVoices?: string[] } = {}
): VoiceAssignment[] {
  const { preferredVoices = [] } = options;

  return characters.map((character) => {
    // 1. 根据音色建议匹配
    const voiceSuggestion = character.voiceSuggestion;
    let selectedPreset = matchVoicePreset(voiceSuggestion);

    // 2. 如果有指定偏好音色，使用偏好
    if (preferredVoices.length > 0) {
      const preferred = VOICE_PRESETS.find((v) => preferredVoices.includes(v.id));
      if (preferred) selectedPreset = preferred;
    }

    // 3. 根据性格调整参数
    const { pitch, speed, volume } = adjustVoiceParams(character.personality);

    return {
      characterId: character.id,
      characterName: character.name,
      voiceId: selectedPreset.id,
      voiceName: selectedPreset.name,
      pitch,
      speed,
      volume,
    };
  });
}

function matchVoicePreset(voiceSuggestion: string): VoiceProfile {
  // 根据音色建议匹配预设音色
  const suggestion = voiceSuggestion.toLowerCase();

  if (
    suggestion.includes('成熟男声') ||
    suggestion.includes('沙哑') ||
    suggestion.includes('低沉')
  ) {
    const male = VOICE_PRESETS.find((v) => v.gender === 'male' && v.age === 'middle');
    if (male) return male;
  }

  if (
    suggestion.includes('年轻女声') ||
    suggestion.includes('活泼') ||
    suggestion.includes('明亮')
  ) {
    const youngFemale = VOICE_PRESETS.find((v) => v.gender === 'female' && v.age === 'young');
    if (youngFemale) return youngFemale;
  }

  if (suggestion.includes('温柔女声') || suggestion.includes('轻柔')) {
    const softFemale = VOICE_PRESETS.find(
      (v) => v.gender === 'female' && v.emotion.includes('sad')
    );
    if (softFemale) return softFemale;
  }

  // 默认返回第一个
  return VOICE_PRESETS[0];
}

function adjustVoiceParams(personality: string): { pitch: number; speed: number; volume: number } {
  const params = { pitch: 0, speed: 1.0, volume: 1.0 };

  if (personality.includes('开朗') || personality.includes('活泼')) {
    params.pitch = 2; // 偏高
    params.speed = 1.1; // 稍快
  } else if (personality.includes('内向') || personality.includes('沉默')) {
    params.pitch = -1; // 偏低
    params.speed = 0.9; // 稍慢
  } else if (personality.includes('急躁') || personality.includes('暴躁')) {
    params.pitch = 1;
    params.speed = 1.2; // 较快
  } else if (personality.includes('谨慎') || personality.includes('冷静')) {
    params.pitch = -1;
    params.speed = 0.85; // 慢
  }

  return params;
}
