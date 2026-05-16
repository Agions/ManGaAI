import { evaluateScript } from '../../../features/manga-pipeline/steps/step1-script-generation/evaluator/evaluator';
import { CharacterCard } from '../../../features/manga-pipeline/steps/step1-script-generation/types/character';
import { Script } from '../../../features/manga-pipeline/steps/step1-script-generation/types/script';

describe('ScriptEvaluator', () => {
  it('should evaluate script and return results', () => {
    const script: Script = {
      id: 's1',
      title: '测试剧本',
      sourceText: '',
      estimatedDuration: 10,
      scenes: [
        {
          id: 'scene_1',
          location: '咖啡厅',
          timeOfDay: '下午',
          characters: ['主角'],
          type: '对话',
          cameraHint: '中景',
          transition: '淡入',
          emotion: 'happy',
          content: '主角：你好！今天天气真不错。配角：是啊，很适合出门。',
          sceneNumber: 1,
        },
      ],
      characters: [],
      metadata: { generatedAt: 0, model: 'test', version: '1.0' },
    };

    const result = evaluateScript(script);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.overallGrade);
  });

  it('should detect repetitive dialogue', () => {
    const script: Script = {
      id: 's1',
      title: '测试剧本',
      sourceText: '',
      estimatedDuration: 5,
      scenes: [
        {
          id: 'scene_1',
          location: '家',
          timeOfDay: '夜晚',
          characters: ['A'],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'neutral',
          content: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // highly repetitive
          sceneNumber: 1,
        },
      ],
      characters: [],
      metadata: { generatedAt: 0, model: 'test', version: '1.0' },
    };

    const result = evaluateScript(script);
    expect(result.dialogueNaturalness).toBeLessThan(100);
    expect(result.issues.some((i) => i.severity === 'medium')).toBe(true);
  });

  it('should penalize excessive location jumps', () => {
    const script: Script = {
      id: 's1',
      title: '测试剧本',
      sourceText: '',
      estimatedDuration: 10,
      scenes: [
        {
          id: 's1',
          location: '咖啡厅',
          timeOfDay: '上午',
          characters: ['A'],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'neutral',
          content: 'A：场景1',
          sceneNumber: 1,
        },
        {
          id: 's2',
          location: '公司',
          timeOfDay: '下午',
          characters: ['A'],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'neutral',
          content: 'A：场景2',
          sceneNumber: 2,
        },
        {
          id: 's3',
          location: '公园',
          timeOfDay: '傍晚',
          characters: ['A'],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'neutral',
          content: 'A：场景3',
          sceneNumber: 3,
        },
        {
          id: 's4',
          location: '餐厅',
          timeOfDay: '夜晚',
          characters: ['A'],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'neutral',
          content: 'A：场景4',
          sceneNumber: 4,
        },
        {
          id: 's5',
          location: '街道',
          timeOfDay: '夜晚',
          characters: ['A'],
          type: '对话',
          cameraHint: '中景',
          transition: '切换',
          emotion: 'neutral',
          content: 'A：场景5',
          sceneNumber: 5,
        },
      ],
      characters: [],
      metadata: { generatedAt: 0, model: 'test', version: '1.0' },
    };

    const result = evaluateScript(script);
    expect(result.narrativeLogic).toBeLessThan(100);
    expect(result.suggestions.some((s) => s.includes('场景跳转'))).toBe(true);
  });

  it('should grade correctly', () => {
    const baseScene = {
      id: 's1',
      location: '家',
      timeOfDay: '夜晚' as const,
      characters: ['A'] as string[],
      type: '对话' as const,
      cameraHint: '中景' as const,
      transition: '切换' as const,
      emotion: 'neutral' as const,
      content: 'A：正常对话内容。',
      sceneNumber: 1 as const,
    };

    const highScoreScript: Script = {
      id: 's1',
      title: '高分剧本',
      sourceText: '',
      estimatedDuration: 20,
      scenes: Array.from({ length: 10 }, (_, i) => ({
        ...baseScene,
        id: `s${i}`,
        sceneNumber: i + 1,
      })),
      characters: [],
      metadata: { generatedAt: 0, model: 'test', version: '1.0' },
    };

    const result = evaluateScript(highScoreScript);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('should return empty issues for good script', () => {
    const script: Script = {
      id: 's1',
      title: '优秀剧本',
      sourceText: '',
      estimatedDuration: 10,
      scenes: [
        {
          id: 'scene_1',
          location: '咖啡厅',
          timeOfDay: '下午',
          characters: ['主角', '配角'],
          type: '对话',
          cameraHint: '中景',
          transition: '淡入',
          emotion: 'happy',
          content: '主角：欢迎光临，请问需要点什么？配角：来一杯咖啡，谢谢。',
          sceneNumber: 1,
        },
        {
          id: 'scene_2',
          location: '咖啡厅',
          timeOfDay: '下午',
          characters: ['主角', '配角'],
          type: '对话',
          cameraHint: '近景',
          transition: '切换',
          emotion: 'happy',
          content: '主角：好的，请稍等。配角：谢谢。',
          sceneNumber: 2,
        },
      ],
      characters: [
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
        {
          id: 'c2',
          name: '配角',
          appearance: '',
          personality: '温和',
          speakingStyle: '',
          voiceSuggestion: '',
          relationships: [],
          firstAppearance: '',
        },
      ],
      metadata: { generatedAt: 0, model: 'test', version: '1.0' },
    };

    const result = evaluateScript(script);
    expect(result.issues.filter((i) => i.severity === 'high')).toHaveLength(0);
  });
});
