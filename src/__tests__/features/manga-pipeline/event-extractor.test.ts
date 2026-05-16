import { Chapter } from '../../../features/manga-pipeline/steps/step1-script-generation/parser/chapter-splitter';
import { ClassifiedParagraph } from '../../../features/manga-pipeline/steps/step1-script-generation/parser/classifier';
import { extractEvents } from '../../../features/manga-pipeline/steps/step1-script-generation/parser/extractor';

describe('EventExtractor', () => {
  it('should extract events from action paragraphs', () => {
    const chapters: Chapter[] = [
      {
        id: 'ch1',
        title: '第一章',
        startLine: 0,
        endLine: 10,
        content: '文本',
      },
    ];
    const paragraphs: ClassifiedParagraph[] = [
      { type: 'action', content: '主角推开门走了进去', originalIndex: 0 },
    ];
    const events = extractEvents(chapters, paragraphs);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].description).toContain('推开门');
  });

  it('should detect scene location from actions', () => {
    const chapters: Chapter[] = [];
    const paragraphs: ClassifiedParagraph[] = [
      { type: 'action', content: '主角走进咖啡厅', originalIndex: 0 },
    ];
    const events = extractEvents(chapters, paragraphs);
    expect(events[0].sceneLocation).toBe('咖啡厅');
  });

  it('should detect emotional tone from action content', () => {
    const chapters: Chapter[] = [];
    const paragraphs: ClassifiedParagraph[] = [
      { type: 'action', content: '主角伤心地哭了起来', originalIndex: 0 },
    ];
    const events = extractEvents(chapters, paragraphs);
    expect(events[0].emotionalTone).toBe('sad');
  });

  it('should return empty array for empty input', () => {
    const events = extractEvents([], []);
    expect(events).toHaveLength(0);
  });
});
