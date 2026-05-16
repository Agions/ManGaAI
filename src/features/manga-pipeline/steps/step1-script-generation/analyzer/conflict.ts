import { StoryEvent } from '../parser/extractor';

import { NarrativeStructure } from './narrative';

export type ConflictType = 'internal' | 'external' | 'interpersonal';

export interface Conflict {
  id: string;
  type: ConflictType;
  description: string;
  involvedCharacters: string[];
  suspenseLevel: number; // 0-10
  resolution?: string;
}

export interface ConflictAnalysisResult {
  conflicts: Conflict[];
  totalSuspense: number;
  highestSuspenseScene?: string;
}

/**
 * 检测故事中的核心冲突和悬念
 */
export function detectConflicts(
  events: StoryEvent[],
  _narrative: NarrativeStructure
): ConflictAnalysisResult {
  const conflicts: Conflict[] = [];
  let conflictId = 1;

  // 检测人际冲突（多个角色 + 负面情感）
  const charGroups = groupEventsByCharacters(events);

  charGroups.forEach((group) => {
    const hasNegativeEmotion = group.events.some(
      (e) => e.emotionalTone === 'angry' || e.emotionalTone === 'tense'
    );
    const hasMultipleChars = group.characters.length >= 2;

    if (hasNegativeEmotion && hasMultipleChars) {
      const suspenseLevel = calculateSuspenseLevel(group.events);

      conflicts.push({
        id: `conflict_${conflictId++}`,
        type: 'interpersonal',
        description: summarizeConflict(group.events),
        involvedCharacters: group.characters,
        suspenseLevel,
      });
    }
  });

  // 检测悬念（惊讶/紧张情感的事件）
  const suspenseEvents = events.filter(
    (e) => e.emotionalTone === 'surprising' || e.emotionalTone === 'tense'
  );

  if (suspenseEvents.length > 0) {
    const highestSuspense = suspenseEvents.reduce(
      (max, e) => {
        const weight = e.emotionalTone === 'surprising' ? 2 : 1;
        return weight > max.weight ? { event: e, weight } : max;
      },
      { event: suspenseEvents[0], weight: 0 }
    );

    return {
      conflicts,
      totalSuspense: suspenseEvents.length * 2,
      highestSuspenseScene:
        highestSuspense.event.sceneLocation || highestSuspense.event.description,
    };
  }

  return {
    conflicts,
    totalSuspense: 0,
  };
}

interface EventGroup {
  characters: string[];
  events: StoryEvent[];
}

function groupEventsByCharacters(events: StoryEvent[]): EventGroup[] {
  const groups: Map<string, EventGroup> = new Map();

  events.forEach((event) => {
    const key = event.involvedCharacters.sort().join('|');
    if (!groups.has(key)) {
      groups.set(key, { characters: event.involvedCharacters, events: [] });
    }
    groups.get(key)!.events.push(event);
  });

  return Array.from(groups.values());
}

function calculateSuspenseLevel(events: StoryEvent[]): number {
  const weights: Record<StoryEvent['emotionalTone'], number> = {
    neutral: 0,
    happy: 1,
    sad: 2,
    tense: 5,
    angry: 6,
    surprising: 8,
  };

  const totalWeight = events.reduce((sum, e) => sum + weights[e.emotionalTone], 0);
  return Math.min(Math.round(totalWeight / events.length), 10);
}

function summarizeConflict(events: StoryEvent[]): string {
  const descriptions = events.map((e) => e.description).slice(0, 3);
  return descriptions.join('；');
}
