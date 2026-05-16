import { integrateScript } from '../../../features/manga-pipeline/steps/step1-script-generation/script-writer/integrator';
import { CharacterCard } from '../../../features/manga-pipeline/steps/step1-script-generation/types/character';
import { Scene } from '../../../features/manga-pipeline/steps/step1-script-generation/types/scene';

describe('ScriptIntegrator', () => {
  it('should integrate scenes into script', () => {
    const scenes: Scene[] = [
      {
        id: 's1',
        location: '咖啡厅',
        timeOfDay: '下午',
        characters: ['主角'],
        type: '对话',
        cameraHint: '中景',
        transition: '淡入',
        emotion: 'happy',
        content: '打招呼',
      },
    ];
    const characters: CharacterCard[] = [];
    const result = integrateScript(scenes, characters, [], { title: '测试剧本' });
    expect(result.title).toBe('测试剧本');
    expect(result.scenes).toHaveLength(1);
    expect(result.scenes[0].sceneNumber).toBe(1);
  });

  it('should estimate duration based on scene count', () => {
    const scenes: Scene[] = Array.from({ length: 5 }, (_, i) => ({
      id: `s${i}`,
      location: '地点',
      timeOfDay: '下午' as const,
      characters: ['A'],
      type: '对话' as const,
      cameraHint: '中景' as const,
      transition: '切换' as const,
      emotion: 'neutral' as const,
      content: '内容',
    }));
    const result = integrateScript(scenes, [], []);
    expect(result.estimatedDuration).toBe(10); // 5 scenes * 2 min
  });

  it('should include characters in script', () => {
    const scenes: Scene[] = [];
    const characters: CharacterCard[] = [
      {
        id: 'c1',
        name: '主角',
        appearance: '',
        personality: '开朗',
        speakingStyle: '',
        voiceSuggestion: '',
        relationships: [],
        firstAppearance: '',
      },
    ];
    const result = integrateScript(scenes, characters, []);
    expect(result.characters).toHaveLength(1);
    expect(result.characters[0].name).toBe('主角');
  });

  it('should add video notes to scenes', () => {
    const scenes: Scene[] = [
      {
        id: 's1',
        location: '办公室',
        timeOfDay: '上午',
        characters: ['A'],
        type: '对峙',
        cameraHint: '近景',
        transition: '切换',
        emotion: 'tense',
        content: '争吵',
      },
    ];
    const result = integrateScript(scenes, [], []);
    expect(result.scenes[0].videoNote).toContain('近景');
  });

  it('should add BGM suggestions', () => {
    const scenes: Scene[] = [
      {
        id: 's1',
        location: '家',
        timeOfDay: '夜晚',
        characters: ['A'],
        type: '情感',
        cameraHint: '特写',
        transition: '淡出',
        emotion: 'sad',
        content: '独白',
      },
    ];
    const result = integrateScript(scenes, [], []);
    expect(result.scenes[0].bgmSuggestion).toContain('钢琴');
  });

  it('should use default title if not provided', () => {
    const result = integrateScript([], [], []);
    expect(result.title).toBe('未命名剧本');
  });
});
