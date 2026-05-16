import { ClassifiedParagraph } from '../../../features/manga-pipeline/steps/step1-script-generation/parser/classifier';
import { generateDialogue } from '../../../features/manga-pipeline/steps/step1-script-generation/script-writer/dialogue-gen';
import { Scene } from '../../../features/manga-pipeline/steps/step1-script-generation/types/scene';

describe('DialogueGenerator', () => {
  it('should extract dialogue from paragraphs', () => {
    const scene: Scene = {
      id: 's1',
      location: '咖啡厅',
      timeOfDay: '下午',
      characters: ['主角'],
      type: '对话',
      cameraHint: '中景',
      transition: '切换',
      emotion: 'happy',
      content: '',
    };
    const paragraphs: ClassifiedParagraph[] = [
      { type: 'dialogue', content: '主角：你好！', speaker: '主角', originalIndex: 0 },
    ];
    const lines = generateDialogue(scene, paragraphs);
    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe('dialogue');
  });

  it('should clean speaker prefix from dialogue', () => {
    const scene: Scene = {
      id: 's1',
      location: '家',
      timeOfDay: '夜晚',
      characters: ['A'],
      type: '对话',
      cameraHint: '中景',
      transition: '切换',
      emotion: 'neutral',
      content: '',
    };
    const paragraphs: ClassifiedParagraph[] = [
      { type: 'dialogue', content: 'A：今天过得怎么样？', speaker: 'A', originalIndex: 0 },
    ];
    const lines = generateDialogue(scene, paragraphs);
    expect(lines[0].content).toBe('今天过得怎么样？');
  });

  it('should generate fallback dialogue for empty scene', () => {
    const scene: Scene = {
      id: 's1',
      location: '未知',
      timeOfDay: '下午',
      characters: [],
      type: '对话',
      cameraHint: '中景',
      transition: '切换',
      emotion: 'neutral',
      content: '',
    };
    const paragraphs: ClassifiedParagraph[] = [];
    const lines = generateDialogue(scene, paragraphs);
    expect(lines.length).toBeGreaterThan(0);
  });

  it('should include action lines', () => {
    const scene: Scene = {
      id: 's1',
      location: '街道',
      timeOfDay: '傍晚',
      characters: ['A'],
      type: '动作',
      cameraHint: '全景',
      transition: '切换',
      emotion: 'tense',
      content: '',
    };
    const paragraphs: ClassifiedParagraph[] = [
      { type: 'action', content: 'A 跑向门口', originalIndex: 0 },
    ];
    const lines = generateDialogue(scene, paragraphs);
    expect(lines.some((l) => l.type === 'action')).toBe(true);
  });

  it('should respect includeInnerMonologue option', () => {
    const scene: Scene = {
      id: 's1',
      location: '卧室',
      timeOfDay: '夜晚',
      characters: ['A'],
      type: '独白',
      cameraHint: '特写',
      transition: '淡入',
      emotion: 'sad',
      content: '',
    };
    const paragraphs: ClassifiedParagraph[] = [
      { type: 'inner_monologue', content: '我心想：这一切值得吗？', originalIndex: 0 },
    ];
    const withMonologue = generateDialogue(scene, paragraphs, { includeInnerMonologue: true });
    const withoutMonologue = generateDialogue(scene, paragraphs, { includeInnerMonologue: false });
    expect(withMonologue.length).toBe(1);
    expect(withoutMonologue.length).toBe(0);
  });
});
