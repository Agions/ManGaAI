import { ClassifiedParagraph } from '../parser/classifier';
import { StoryEvent } from '../parser/extractor';

export type RelationType = 'family' | 'friend' | 'enemy' | 'romantic' | 'colleague' | 'unknown';

export interface CharacterRelation {
  from: string;
  to: string;
  type: RelationType;
  description?: string;
  strength: number; // 0-1，关系强度
}

export interface CharacterGraph {
  characters: string[];
  relations: CharacterRelation[];
  characterInfo: Record<string, { appearanceCount: number; firstScene?: string }>;
}

/**
 * 从事件和对话中构建人物关系图
 */
export function buildCharacterGraph(
  events: StoryEvent[],
  paragraphs: ClassifiedParagraph[]
): CharacterGraph {
  const characters = new Set<string>();
  const relations: CharacterRelation[] = [];
  const characterInfo: CharacterGraph['characterInfo'] = {};

  // 收集说话人
  paragraphs.forEach((p) => {
    if (p.speaker) {
      characters.add(p.speaker);
      if (!characterInfo[p.speaker]) {
        characterInfo[p.speaker] = { appearanceCount: 0 };
      }
      characterInfo[p.speaker].appearanceCount++;
    }
  });

  // 从动作段落补充人物
  events.forEach((e) => {
    e.involvedCharacters.forEach((c) => {
      characters.add(c);
      if (!characterInfo[c]) {
        characterInfo[c] = { appearanceCount: 0 };
      }
      characterInfo[c].appearanceCount++;
      if (e.sceneLocation) {
        characterInfo[c].firstScene = e.sceneLocation;
      }
    });
  });

  // 推断关系（基于共现）
  const characterList = Array.from(characters);
  for (let i = 0; i < characterList.length; i++) {
    for (let j = i + 1; j < characterList.length; j++) {
      const c1 = characterList[i];
      const c2 = characterList[j];

      // 检查是否在同场景/同事件
      const coOccurrenceCount = events.filter(
        (e) => e.involvedCharacters.includes(c1) && e.involvedCharacters.includes(c2)
      ).length;

      if (coOccurrenceCount > 0) {
        // 检查是否有敌对/紧张情感
        const hasTension = events.some(
          (e) =>
            e.involvedCharacters.includes(c1) &&
            e.involvedCharacters.includes(c2) &&
            (e.emotionalTone === 'angry' || e.emotionalTone === 'tense')
        );

        const hasRomance = events.some(
          (e) =>
            e.involvedCharacters.includes(c1) &&
            e.involvedCharacters.includes(c2) &&
            e.emotionalTone === 'happy'
        );

        let type: RelationType = 'unknown';
        if (hasTension) type = 'enemy';
        else if (hasRomance) type = 'romantic';
        else if (coOccurrenceCount > 2) type = 'friend';
        else type = 'colleague';

        relations.push({
          from: c1,
          to: c2,
          type,
          strength: Math.min(coOccurrenceCount / 5, 1),
        });
      }
    }
  }

  return {
    characters: Array.from(characters),
    relations,
    characterInfo,
  };
}
