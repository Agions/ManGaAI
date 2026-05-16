import { ScriptScene } from '../../../features/manga-pipeline/steps/step1-script-generation/types/script';
import {
  selectBGM,
  BGM_STYLES,
  BGMSelection,
  BGMTrack,
} from '../../../features/manga-pipeline/steps/step4-voice-synthesis/services/bgm';

describe('bgm-selector', () => {
  const createMockScenes = (): ScriptScene[] => [
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
      content: '对话场景',
      videoNote: '',
      bgmSuggestion: '',
    },
    {
      id: 'scene2',
      sceneNumber: 2,
      location: '室外',
      timeOfDay: '夜晚',
      characters: ['小明'],
      type: '追逐',
      cameraHint: '远景',
      transition: '切换',
      emotion: 'tense',
      content: '追逐场景',
      videoNote: '',
      bgmSuggestion: '',
    },
    {
      id: 'scene3',
      sceneNumber: 3,
      location: '室内',
      timeOfDay: '夜晚',
      characters: ['小明'],
      type: '情感',
      cameraHint: '特写',
      transition: '淡入',
      emotion: 'sad',
      content: '情感场景',
      videoNote: '',
      bgmSuggestion: '',
    },
    {
      id: 'scene4',
      sceneNumber: 4,
      location: '室外',
      timeOfDay: '傍晚',
      characters: ['小明', '小丽'],
      type: '动作',
      cameraHint: '中景',
      transition: '切换',
      emotion: 'angry',
      content: '动作场景',
      videoNote: '',
      bgmSuggestion: '',
    },
    {
      id: 'scene5',
      sceneNumber: 5,
      location: '室内',
      timeOfDay: '下午',
      characters: ['小明'],
      type: '独白',
      cameraHint: '近景',
      transition: '淡出',
      emotion: 'neutral',
      content: '独白场景',
      videoNote: '',
      bgmSuggestion: '',
    },
  ];

  describe('selectBGM', () => {
    it('should return BGM selection for each scene', () => {
      const scenes = createMockScenes();

      const result = selectBGM(scenes);

      expect(result).toHaveLength(scenes.length);
    });

    it('should map happy emotion to happy BGM', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene1',
          sceneNumber: 1,
          location: '室内',
          timeOfDay: '下午',
          characters: [],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'happy',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].bgmType).toBe('happy');
    });

    it('should map tense emotion to tension BGM', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene2',
          sceneNumber: 1,
          location: '室外',
          timeOfDay: '夜晚',
          characters: [],
          type: '追逐',
          cameraHint: '远景',
          transition: '切换',
          emotion: 'tense',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].bgmType).toBe('tension');
    });

    it('should map sad emotion to sad BGM', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene3',
          sceneNumber: 1,
          location: '室内',
          timeOfDay: '夜晚',
          characters: [],
          type: '情感',
          cameraHint: '特写',
          transition: '淡入',
          emotion: 'sad',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].bgmType).toBe('sad');
    });

    it('should map angry emotion to action BGM', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene4',
          sceneNumber: 1,
          location: '室外',
          timeOfDay: '傍晚',
          characters: [],
          type: '动作',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'angry',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].bgmType).toBe('action');
    });

    it('should map neutral emotion to neutral BGM', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene5',
          sceneNumber: 1,
          location: '室内',
          timeOfDay: '下午',
          characters: [],
          type: '独白',
          cameraHint: '近景',
          transition: '淡出',
          emotion: 'neutral',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].bgmType).toBe('neutral');
    });

    it('should return correct selection structure with all fields', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene1',
          sceneNumber: 1,
          location: '室内',
          timeOfDay: '下午',
          characters: [],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'happy',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      const selection = result[0];
      expect(selection.sceneId).toBe('scene1');
      expect(selection.sceneNumber).toBe(1);
      expect(selection.emotion).toBe('happy');
      expect(selection.bgmType).toBeDefined();
      expect(typeof selection.intensity).toBe('number');
      expect(typeof selection.fadeIn).toBe('number');
      expect(typeof selection.fadeOut).toBe('number');
      expect(typeof selection.volume).toBe('number');
      expect(typeof selection.cueIn).toBe('number');
      expect(typeof selection.cueOut).toBe('number');
    });

    it('should set correct fade values', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene1',
          sceneNumber: 1,
          location: '室内',
          timeOfDay: '下午',
          characters: [],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'happy',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].fadeIn).toBe(1.5);
      expect(result[0].fadeOut).toBe(1.5);
    });

    it('should set correct intensity based on emotion', () => {
      const tenseScene: ScriptScene = {
        id: 'scene1',
        sceneNumber: 1,
        location: '室外',
        timeOfDay: '夜晚',
        characters: [],
        type: '追逐',
        cameraHint: '远景',
        transition: '切换',
        emotion: 'tense',
        content: '',
        videoNote: '',
        bgmSuggestion: '',
      };

      const result = selectBGM([tenseScene]);

      expect(result[0].intensity).toBe(0.8);
    });

    it('should set cueOut based on estimated scene duration', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene1',
          sceneNumber: 1,
          location: '室内',
          timeOfDay: '下午',
          characters: [],
          type: '追逐', // 15秒基础时长
          cameraHint: '远景',
          transition: '切换',
          emotion: 'tense',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].cueOut).toBeLessThanOrEqual(BGM_STYLES.tension.duration);
    });
  });

  describe('BGM_STYLES', () => {
    it('should have all required BGM types', () => {
      const requiredTypes = ['tension', 'happy', 'sad', 'neutral', 'romantic', 'action'];
      requiredTypes.forEach((type) => {
        expect(BGM_STYLES[type]).toBeDefined();
      });
    });

    it('should have valid BGMTrack structure', () => {
      Object.values(BGM_STYLES).forEach((track) => {
        expect(track.id).toBeDefined();
        expect(track.name).toBeDefined();
        expect(track.type).toBeDefined();
        expect(track.duration).toBeGreaterThan(0);
        expect(Array.isArray(track.tags)).toBe(true);
      });
    });

    it('should have default duration of 180 seconds for all tracks', () => {
      Object.values(BGM_STYLES).forEach((track) => {
        expect(track.duration).toBe(180);
      });
    });
  });

  describe('BGMSelection interface', () => {
    it('should have correct interface structure', () => {
      const selection: BGMSelection = {
        sceneId: 'scene1',
        sceneNumber: 1,
        emotion: 'happy',
        bgmType: 'happy',
        intensity: 0.6,
        fadeIn: 1.5,
        fadeOut: 1.5,
        volume: 0.5,
        cueIn: 0,
        cueOut: 10,
      };

      expect(selection.sceneId).toBe('scene1');
      expect(selection.bgmType).toBe('happy');
      expect(selection.intensity).toBe(0.6);
    });

    it('should have volume between 0 and 1', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene1',
          sceneNumber: 1,
          location: '室内',
          timeOfDay: '下午',
          characters: [],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'happy',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].volume).toBeGreaterThanOrEqual(0);
      expect(result[0].volume).toBeLessThanOrEqual(1);
    });

    it('should have intensity between 0 and 1', () => {
      const scenes: ScriptScene[] = [
        {
          id: 'scene1',
          sceneNumber: 1,
          location: '室内',
          timeOfDay: '下午',
          characters: [],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'happy',
          content: '',
          videoNote: '',
          bgmSuggestion: '',
        },
      ];

      const result = selectBGM(scenes);

      expect(result[0].intensity).toBeGreaterThanOrEqual(0);
      expect(result[0].intensity).toBeLessThanOrEqual(1);
    });
  });
});
