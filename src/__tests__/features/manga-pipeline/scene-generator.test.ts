import { NarrativeStructure } from '../../../features/manga-pipeline/steps/step1-script-generation/analyzer/narrative';
import { StoryEvent } from '../../../features/manga-pipeline/steps/step1-script-generation/parser/event-extractor';
import { generateScenes } from '../../../features/manga-pipeline/steps/step1-script-generation/script-writer/scene-gen';
import { CharacterCard } from '../../../features/manga-pipeline/steps/step1-script-generation/types/character';

describe('SceneGenerator', () => {
  it('should return empty for no events', () => {
    const narrative: NarrativeStructure = {
      arc: 'rising',
      estimatedDuration: 5,
      keyPlotPoints: [],
      arcSegments: [],
    };
    const scenes = generateScenes([], narrative, []);
    expect(scenes).toHaveLength(0);
  });

  it('should group events by location', () => {
    const events: StoryEvent[] = [
      {
        id: 'e1',
        description: '在咖啡厅',
        involvedCharacters: ['A'],
        emotionalTone: 'neutral',
        sceneLocation: '咖啡厅',
      },
      {
        id: 'e2',
        description: '在咖啡厅',
        involvedCharacters: ['A'],
        emotionalTone: 'neutral',
        sceneLocation: '咖啡厅',
      },
      {
        id: 'e3',
        description: '在公司',
        involvedCharacters: ['A'],
        emotionalTone: 'neutral',
        sceneLocation: '公司',
      },
    ];
    const narrative: NarrativeStructure = {
      arc: 'rising',
      estimatedDuration: 5,
      keyPlotPoints: [],
      arcSegments: [],
    };
    const scenes = generateScenes(events, narrative, []);
    expect(scenes.length).toBeGreaterThanOrEqual(2);
  });

  it('should set camera hint based on emotion', () => {
    const events: StoryEvent[] = [
      {
        id: 'e1',
        description: '紧张对话',
        involvedCharacters: ['A', 'B'],
        emotionalTone: 'tense',
        sceneLocation: '办公室',
      },
    ];
    const narrative: NarrativeStructure = {
      arc: 'rising',
      estimatedDuration: 5,
      keyPlotPoints: [],
      arcSegments: [],
    };
    const scenes = generateScenes(events, narrative, []);
    expect(scenes[0].cameraHint).toBe('近景');
  });

  it('should use correct transition for climax scenes', () => {
    // First scene → 淡入 (per spec), second surprising scene → 溶解
    const events: StoryEvent[] = [
      {
        id: 'e1',
        description: '平静',
        involvedCharacters: ['A'],
        emotionalTone: 'neutral',
        sceneLocation: '客厅',
      },
      {
        id: 'e2',
        description: '震惊',
        involvedCharacters: ['A'],
        emotionalTone: 'surprising',
        sceneLocation: '客厅',
      },
    ];
    const narrative: NarrativeStructure = {
      arc: 'climax',
      estimatedDuration: 5,
      keyPlotPoints: [],
      arcSegments: [],
    };
    const scenes = generateScenes(events, narrative, [], { maxScenes: 10 });
    // scenes are grouped by location then emotion: first neutral scene, then surprising scene
    expect(scenes[0].transition).toBe('淡入');
    expect(scenes[1].transition).toBe('溶解');
  });

  it('should limit scenes by maxScenes option', () => {
    const events: StoryEvent[] = Array.from({ length: 10 }, (_, i) => ({
      id: `e${i}`,
      description: `事件${i}`,
      involvedCharacters: ['A'],
      emotionalTone: 'neutral' as const,
      sceneLocation: `场景${i}`,
    }));
    const narrative: NarrativeStructure = {
      arc: 'rising',
      estimatedDuration: 10,
      keyPlotPoints: [],
      arcSegments: [],
    };
    const scenes = generateScenes(events, narrative, [], { maxScenes: 3 });
    expect(scenes).toHaveLength(3);
  });

  it('should map emotion to scene type', () => {
    const events: StoryEvent[] = [
      {
        id: 'e1',
        description: '争吵',
        involvedCharacters: ['A', 'B'],
        emotionalTone: 'angry',
        sceneLocation: '街道',
      },
    ];
    const narrative: NarrativeStructure = {
      arc: 'rising',
      estimatedDuration: 5,
      keyPlotPoints: [],
      arcSegments: [],
    };
    const scenes = generateScenes(events, narrative, []);
    expect(scenes[0].type).toBe('对峙');
  });
});
