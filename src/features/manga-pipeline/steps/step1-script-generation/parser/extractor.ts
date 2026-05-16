import { ClassifiedParagraph } from './classifier';
import { Chapter } from './splitter';

export interface StoryEvent {
  id: string;
  description: string;
  involvedCharacters: string[];
  emotionalTone: 'neutral' | 'happy' | 'sad' | 'tense' | 'angry' | 'surprising';
  chapterId?: string;
  sceneLocation?: string;
}

/**
 * 从分类后的段落中提取关键事件
 */
export function extractEvents(
  chapters: Chapter[],
  paragraphs: ClassifiedParagraph[]
): StoryEvent[] {
  const events: StoryEvent[] = [];
  let eventId = 1;

  // 收集说话人
  const speakers = new Set<string>();
  paragraphs.forEach((p) => {
    if (p.speaker) speakers.add(p.speaker);
  });

  // 从动作/对话流中提取事件
  let currentScene = '';
  let currentEmotion: StoryEvent['emotionalTone'] = 'neutral';

  paragraphs.forEach((p) => {
    if (p.type === 'action') {
      // 新场景检测："走进"、"来到"、"进入" 等后面跟着地名
      const locationMatch = p.content.match(/(?:走进?|来到?|进入?|来到)(.+?)(?:[，。]|$)/);
      if (locationMatch) {
        currentScene = locationMatch[1];
      }

      // 情感检测
      if (/(哭|悲伤|难过|沮丧)/.test(p.content)) {
        currentEmotion = 'sad';
      } else if (/(笑|开心|高兴|兴奋)/.test(p.content)) {
        currentEmotion = 'happy';
      } else if (/(惊讶|震惊|愣住)/.test(p.content)) {
        currentEmotion = 'surprising';
      } else if (/(愤怒|生气|吵架)/.test(p.content)) {
        currentEmotion = 'angry';
      } else if (/(紧张|害怕|担心)/.test(p.content)) {
        currentEmotion = 'tense';
      }

      // 创建事件（动作描述作为事件）
      const charactersInEvent = Array.from(speakers).filter((s) => p.content.includes(s));

      events.push({
        id: `event_${eventId++}`,
        description: p.content,
        involvedCharacters:
          charactersInEvent.length > 0 ? charactersInEvent : Array.from(speakers).slice(0, 1),
        emotionalTone: currentEmotion,
        sceneLocation: currentScene || undefined,
      });
    }
  });

  return events;
}
