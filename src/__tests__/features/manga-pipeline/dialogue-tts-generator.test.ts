import { Script } from '../../../features/manga-pipeline/steps/step1-script-generation/types/script';
import { VoiceAssignment } from '../../../features/manga-pipeline/steps/step4-voice-synthesis/services/assigner';
import {
  generateDialogueTTS,
  DialogueSegment,
  TTSGenerationResult,
} from '../../../features/manga-pipeline/steps/step4-voice-synthesis/services/tts-generator';

describe('dialogue-tts-generator', () => {
  const createMockVoiceAssignments = (): VoiceAssignment[] => [
    {
      characterId: 'char1',
      characterName: '小明',
      voiceId: 'zh-CN-XiaoxiaoNeural',
      voiceName: '晓晓（年轻女声）',
      pitch: 2,
      speed: 1.1,
      volume: 1.0,
    },
    {
      characterId: 'char2',
      characterName: '老张',
      voiceId: 'zh-CN-YunyangNeural',
      voiceName: '云扬（专业男声）',
      pitch: -1,
      speed: 0.9,
      volume: 1.0,
    },
  ];

  const createMockScript = (): Script => ({
    id: 'script1',
    title: '测试剧本',
    sourceText: '这是一段测试文本',
    estimatedDuration: 5,
    scenes: [
      {
        id: 'scene1',
        sceneNumber: 1,
        location: '室内',
        timeOfDay: '下午',
        characters: ['小明', '老张'],
        type: '对话',
        cameraHint: '中景',
        transition: '切换',
        emotion: 'happy',
        content: '小明：今天天气真好啊！老张：是啊，很适合出去走走。',
        videoNote: '',
        bgmSuggestion: '',
      },
      {
        id: 'scene2',
        sceneNumber: 2,
        location: '室外',
        timeOfDay: '傍晚',
        characters: ['小明'],
        type: '独白',
        cameraHint: '近景',
        transition: '淡入',
        emotion: 'sad',
        content: '小明：想起以前的事情，真是感慨万千。',
        videoNote: '',
        bgmSuggestion: '',
      },
    ],
    characters: [
      {
        id: 'char1',
        name: '小明',
        appearance: '',
        personality: '开朗',
        speakingStyle: '',
        voiceSuggestion: '',
        relationships: [],
        firstAppearance: '',
      },
      {
        id: 'char2',
        name: '老张',
        appearance: '',
        personality: '沉稳',
        speakingStyle: '',
        voiceSuggestion: '',
        relationships: [],
        firstAppearance: '',
      },
    ],
    metadata: { generatedAt: Date.now(), model: 'test', version: '1.0' },
  });

  describe('generateDialogueTTS', () => {
    it('should generate dialogue segments from script', () => {
      const script = createMockScript();
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should extract dialogue lines with character names', () => {
      const script = createMockScript();
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      const firstSegment = result.segments[0];
      expect(firstSegment.character).toBe('小明');
      expect(firstSegment.text).toBe('今天天气真好啊！');
      expect(firstSegment.voiceId).toBe('zh-CN-XiaoxiaoNeural');
    });

    it('should assign correct voice based on character', () => {
      const script = createMockScript();
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      const segments = result.segments.filter((s) => s.character === '老张');
      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].voiceId).toBe('zh-CN-YunyangNeural');
    });

    it('should set correct start and end times', () => {
      const script = createMockScript();
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      result.segments.forEach((segment, index) => {
        if (index > 0) {
          const prevSegment = result.segments[index - 1];
          expect(segment.startTime).toBeGreaterThanOrEqual(prevSegment.endTime);
        }
        expect(segment.endTime).toBeGreaterThan(segment.startTime);
      });
    });

    it('should handle empty scene content', () => {
      const script: Script = {
        ...createMockScript(),
        scenes: [
          {
            id: 'empty_scene',
            sceneNumber: 1,
            location: '室内',
            timeOfDay: '下午',
            characters: [],
            type: '对话',
            cameraHint: '中景',
            transition: '切换',
            emotion: 'neutral',
            content: '',
          },
        ],
      };
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      // 空场景应该增加 3 秒沉默时间
      expect(result.totalDuration).toBeGreaterThanOrEqual(3);
    });

    it('should mark all segments as pending initially', () => {
      const script = createMockScript();
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      result.segments.forEach((segment) => {
        expect(segment.status).toBe('pending');
      });
    });

    it('should include scene information in segments', () => {
      const script = createMockScript();
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      result.segments.forEach((segment) => {
        expect(segment.sceneId).toBeDefined();
        expect(segment.sceneNumber).toBeGreaterThan(0);
      });
    });

    it('should calculate total duration correctly', () => {
      const script = createMockScript();
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      const lastSegment = result.segments[result.segments.length - 1];
      expect(result.totalDuration).toBeGreaterThanOrEqual(lastSegment.endTime);
    });

    it('should return valid TTSGenerationResult structure', () => {
      const script = createMockScript();
      const voiceAssignments = createMockVoiceAssignments();

      const result = generateDialogueTTS(script, voiceAssignments);

      expect(result).toHaveProperty('segments');
      expect(result).toHaveProperty('totalDuration');
      expect(Array.isArray(result.segments)).toBe(true);
      expect(typeof result.totalDuration).toBe('number');
    });
  });

  describe('DialogueSegment interface', () => {
    it('should have all required fields', () => {
      const segment: DialogueSegment = {
        id: 'tts_1',
        sceneId: 'scene1',
        sceneNumber: 1,
        character: '小明',
        characterId: 'char1',
        text: '测试文本',
        emotion: 'happy',
        voiceId: 'zh-CN-XiaoxiaoNeural',
        startTime: 0,
        endTime: 3,
        status: 'pending',
      };

      expect(segment.id).toBe('tts_1');
      expect(segment.sceneId).toBe('scene1');
      expect(segment.character).toBe('小明');
      expect(segment.startTime).toBe(0);
      expect(segment.endTime).toBe(3);
      expect(segment.status).toBe('pending');
    });

    it('should support optional audioUrl field', () => {
      const segmentWithAudio: DialogueSegment = {
        id: 'tts_1',
        sceneId: 'scene1',
        sceneNumber: 1,
        character: '小明',
        characterId: 'char1',
        text: '测试文本',
        emotion: 'happy',
        voiceId: 'zh-CN-XiaoxiaoNeural',
        startTime: 0,
        endTime: 3,
        status: 'done',
        audioUrl: 'blob:https://example.com/audio.mp3',
        duration: 2.5,
      };

      expect(segmentWithAudio.audioUrl).toBeDefined();
      expect(segmentWithAudio.duration).toBe(2.5);
    });
  });
});
