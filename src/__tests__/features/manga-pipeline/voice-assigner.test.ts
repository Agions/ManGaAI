import { CharacterCard } from '../../../features/manga-pipeline/steps/step1-script-generation/types/character';
import {
  assignVoices,
  VOICE_PRESETS,
  VoiceAssignment,
} from '../../../features/manga-pipeline/steps/step4-voice-synthesis/services/assigner';

describe('voice-assigner', () => {
  describe('assignVoices', () => {
    it('should assign default voice to character without voice suggestion', () => {
      const characters: CharacterCard[] = [
        {
          id: 'char1',
          name: '小明',
          appearance: '年轻男性',
          personality: '开朗活泼',
          speakingStyle: '幽默',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: 'scene1',
        },
      ];

      const result = assignVoices(characters);

      expect(result).toHaveLength(1);
      expect(result[0].characterId).toBe('char1');
      expect(result[0].characterName).toBe('小明');
      expect(result[0].voiceId).toBe(VOICE_PRESETS[0].id); // 默认第一个音色
    });

    it('should match voice based on voiceSuggestion for mature male voice', () => {
      const characters: CharacterCard[] = [
        {
          id: 'char2',
          name: '老张',
          appearance: '中年男性',
          personality: '沉稳',
          speakingStyle: '严肃',
          voiceSuggestion: '成熟男声，沙哑低沉',
          relationships: [],
          firstAppearance: 'scene1',
        },
      ];

      const result = assignVoices(characters);

      expect(result).toHaveLength(1);
      // 应该匹配到云扬（专业男声）
      const yunyang = VOICE_PRESETS.find((v) => v.name === '云扬（专业男声）');
      expect(result[0].voiceId).toBe(yunyang?.id);
    });

    it('should match voice based on voiceSuggestion for young female voice', () => {
      const characters: CharacterCard[] = [
        {
          id: 'char3',
          name: '小丽',
          appearance: '年轻女性',
          personality: '活泼开朗',
          speakingStyle: '活泼',
          voiceSuggestion: '年轻女声，活泼明亮',
          relationships: [],
          firstAppearance: 'scene1',
        },
      ];

      const result = assignVoices(characters);

      expect(result).toHaveLength(1);
      // 应该匹配到晓晓或小艺
      expect(['zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoyiNeural']).toContain(result[0].voiceId);
    });

    it('should adjust pitch and speed based on personality (outgoing)', () => {
      const characters: CharacterCard[] = [
        {
          id: 'char5',
          name: '小王',
          appearance: '年轻人',
          personality: '开朗活泼，外向',
          speakingStyle: '健谈',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: 'scene1',
        },
      ];

      const result = assignVoices(characters);

      expect(result[0].pitch).toBe(2); // 偏高
      expect(result[0].speed).toBe(1.1); // 稍快
    });

    it('should adjust pitch and speed based on personality (introverted)', () => {
      const characters: CharacterCard[] = [
        {
          id: 'char6',
          name: '阿明',
          appearance: '年轻人',
          personality: '内向沉默',
          speakingStyle: '少言',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: 'scene1',
        },
      ];

      const result = assignVoices(characters);

      expect(result[0].pitch).toBe(-1); // 偏低
      expect(result[0].speed).toBe(0.9); // 稍慢
    });

    it('should adjust pitch and speed based on personality (irritable)', () => {
      const characters: CharacterCard[] = [
        {
          id: 'char7',
          name: '老李',
          appearance: '中年人',
          personality: '急躁易怒',
          speakingStyle: '粗鲁',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: 'scene1',
        },
      ];

      const result = assignVoices(characters);

      expect(result[0].pitch).toBe(1);
      expect(result[0].speed).toBe(1.2); // 较快
    });

    it('should adjust pitch and speed based on personality (cautious)', () => {
      const characters: CharacterCard[] = [
        {
          id: 'char8',
          name: '阿杰',
          appearance: '年轻人',
          personality: '谨慎冷静',
          speakingStyle: '稳重',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: 'scene1',
        },
      ];

      const result = assignVoices(characters);

      expect(result[0].pitch).toBe(-1);
      expect(result[0].speed).toBe(0.85); // 慢
    });

    it('should support preferredVoices option', () => {
      const characters: CharacterCard[] = [
        {
          id: 'char9',
          name: '阿强',
          appearance: '男性',
          personality: '普通',
          speakingStyle: '一般',
          voiceSuggestion: '年轻女声', // 通常会选女声
          relationships: [],
          firstAppearance: 'scene1',
        },
      ];

      const result = assignVoices(characters, {
        preferredVoices: ['zh-CN-YunxiNeural'], // 强制使用云希（男声）
      });

      expect(result[0].voiceId).toBe('zh-CN-YunxiNeural');
    });

    it('should assign all characters with valid voice assignments', () => {
      const characters: CharacterCard[] = [
        {
          id: 'c1',
          name: '角色1',
          appearance: '',
          personality: '开朗',
          speakingStyle: '',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: '',
        },
        {
          id: 'c2',
          name: '角色2',
          appearance: '',
          personality: '内向',
          speakingStyle: '',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: '',
        },
        {
          id: 'c3',
          name: '角色3',
          appearance: '',
          personality: '急躁',
          speakingStyle: '',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: '',
        },
      ];

      const result = assignVoices(characters);

      expect(result).toHaveLength(3);
      result.forEach((assignment) => {
        expect(assignment.characterId).toBeDefined();
        expect(assignment.voiceId).toBeDefined();
        expect(assignment.pitch).toBeDefined();
        expect(assignment.speed).toBeDefined();
        expect(assignment.volume).toBe(1.0); // 默认音量
      });
    });
  });

  describe('VOICE_PRESETS', () => {
    it('should have at least 5 preset voices', () => {
      expect(VOICE_PRESETS.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid voice profile structure', () => {
      VOICE_PRESETS.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.gender).toBeDefined();
        expect(['male', 'female', 'neutral']).toContain(preset.gender);
        expect(preset.age).toBeDefined();
        expect(['young', 'middle', 'old']).toContain(preset.age);
        expect(preset.language).toBeDefined();
        expect(Array.isArray(preset.emotion)).toBe(true);
      });
    });
  });
});
