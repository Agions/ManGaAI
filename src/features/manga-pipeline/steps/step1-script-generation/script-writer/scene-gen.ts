import { NarrativeStructure } from '../analyzer/narrative';
import { StoryEvent } from '../parser/extractor';
import { CharacterCard } from '../types/character';
import { Scene } from '../types/scene';

const MAX_SCENES_DEFAULT = 20;
const MAX_EVENTS_PER_SCENE = 5;

export interface SceneGenerationOptions {
  maxScenes?: number; // 默认 20
}

/**
 * 将事件分配到场景，生成带分镜标注的场景列表
 */
export function generateScenes(
  events: StoryEvent[],
  narrative: NarrativeStructure,
  characters: CharacterCard[],
  options: SceneGenerationOptions = {}
): Scene[] {
  const { maxScenes = MAX_SCENES_DEFAULT } = options;
  const scenes: Scene[] = [];

  if (events.length === 0) return scenes;

  // 按场景位置分组事件
  const eventsByLocation = groupEventsByLocation(events);
  const locationKeys = Object.keys(eventsByLocation);

  let sceneIdCounter = 1;

  for (const location of locationKeys) {
    if (scenes.length >= maxScenes) break;

    const locationEvents = eventsByLocation[location];

    // 进一步按情感分组
    const emotionGroups = groupByEmotion(locationEvents);

    for (const [emotion, groupEvents] of Object.entries(emotionGroups)) {
      if (scenes.length >= maxScenes) break;

      const dominantEmotion = emotion as StoryEvent['emotionalTone'];
      const involvedChars = getInvolvedCharacters(groupEvents);

      // 估算时间（基于情感）
      const timeOfDay = estimateTimeOfDay(groupEvents);

      // 选择镜头类型
      const cameraHint = selectCameraHint(groupEvents, involvedChars.length);

      // 选择转场
      const transition = selectTransition(scenes.length, dominantEmotion);

      // 合并事件描述为场景内容
      const content = groupEvents
        .map((e) => e.description)
        .slice(0, MAX_EVENTS_PER_SCENE)
        .join('\n');

      scenes.push({
        id: `scene_${sceneIdCounter++}`,
        location,
        timeOfDay,
        characters: involvedChars,
        type: mapEmotionToSceneType(dominantEmotion),
        cameraHint,
        transition,
        emotion: dominantEmotion,
        content,
      });
    }
  }

  return scenes;
}

function groupEventsByLocation(events: StoryEvent[]): Record<string, StoryEvent[]> {
  const groups: Record<string, StoryEvent[]> = {};

  events.forEach((event) => {
    const location = event.sceneLocation || '未知场景';
    if (!groups[location]) {
      groups[location] = [];
    }
    groups[location].push(event);
  });

  return groups;
}

function groupByEmotion(events: StoryEvent[]): Record<string, StoryEvent[]> {
  const groups: Record<string, StoryEvent[]> = {};

  events.forEach((event) => {
    const emotion = event.emotionalTone;
    if (!groups[emotion]) {
      groups[emotion] = [];
    }
    groups[emotion].push(event);
  });

  return groups;
}

function getInvolvedCharacters(events: StoryEvent[]): string[] {
  const chars = new Set<string>();
  events.forEach((e) => e.involvedCharacters.forEach((c) => chars.add(c)));
  return Array.from(chars);
}

function estimateTimeOfDay(events: StoryEvent[]): Scene['timeOfDay'] {
  const allText = events.map((e) => e.description).join('');

  if (/(早晨|早上|日出|黎明)/.test(allText)) return '早晨';
  if (/(上午|中午|午饭)/.test(allText)) return '上午';
  if (/(下午|傍晚|黄昏)/.test(allText)) return '下午';
  if (/(夜晚|晚上|深夜|午夜)/.test(allText)) return '夜晚';

  return '下午'; // 默认下午
}

function selectCameraHint(events: StoryEvent[], charCount: number): Scene['cameraHint'] {
  // 紧张/冲突场景 → 特写或近景
  const hasTension = events.some((e) => e.emotionalTone === 'tense' || e.emotionalTone === 'angry');
  if (hasTension) return '近景';

  // 多人场景 → 全景或远景
  if (charCount >= 3) return '全景';
  if (charCount === 2) return '中景';

  return '中景'; // 默认中景
}

function selectTransition(
  sceneIndex: number,
  emotion: StoryEvent['emotionalTone']
): Scene['transition'] {
  if (sceneIndex === 0) return '淡入';

  if (emotion === 'tense' || emotion === 'angry') return '切换';
  if (emotion === 'surprising') return '溶解';
  if (emotion === 'sad') return '淡出';

  return '切换'; // 默认切换
}

function mapEmotionToSceneType(emotion: StoryEvent['emotionalTone']): Scene['type'] {
  const map: Record<string, Scene['type']> = {
    tense: '对峙',
    angry: '对峙',
    surprising: '动作',
    sad: '情感',
    happy: '对话',
    neutral: '对话',
  };
  return map[emotion] || '对话';
}
