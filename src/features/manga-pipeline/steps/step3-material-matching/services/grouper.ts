import { MaterialMatch, MaterialItem } from './searcher';

export type { MaterialMatch, MaterialItem };

export interface MaterialGroup {
  groupId: string;
  theme: string; // 主题标签
  scenes: number[]; // 包含的场景编号
  materials: MaterialItem[];
  continuityScore: number; // 连续性评分 0-1
}

export interface GroupingOptions {
  maxGroupSize?: number; // 每组最大场景数，默认 5
  continuityThreshold?: number; // 连续性阈值，默认 0.6
}

/**
 * 智能分组：将场景按主题/风格分组，优先复用相同素材
 */
export function groupMaterials(
  matches: MaterialMatch[],
  options: GroupingOptions = {}
): MaterialGroup[] {
  const { maxGroupSize = 5 } = options;

  const groups: MaterialGroup[] = [];
  let groupIdCounter = 1;

  // 按情感主题初步分组
  const emotionGroups = groupByEmotion(matches);

  for (const [emotion, sceneMatches] of Object.entries(emotionGroups)) {
    // 在每个情感组内，按地点进一步分组
    const locationGroups = groupByLocation(sceneMatches);

    for (const [location, locationSceneMatches] of Object.entries(locationGroups)) {
      // 创建分组
      const group: MaterialGroup = {
        groupId: `group_${groupIdCounter++}`,
        theme: `${emotion}_${location}`,
        scenes: locationSceneMatches.map((m) => m.sceneNumber),
        materials: collectUniqueMaterials(locationSceneMatches),
        continuityScore: calculateContinuityScore(locationSceneMatches),
      };

      groups.push(group);
    }
  }

  // 合并小分组
  return mergeSmallGroups(groups, maxGroupSize);
}

function groupByEmotion(matches: MaterialMatch[]): Record<string, MaterialMatch[]> {
  const groups: Record<string, MaterialMatch[]> = {};

  matches.forEach((match) => {
    const emotion = match.emotion || 'neutral'; // 使用真实情感标签
    if (!groups[emotion]) groups[emotion] = [];
    groups[emotion].push(match);
  });

  return groups;
}

function groupByLocation(matches: MaterialMatch[]): Record<string, MaterialMatch[]> {
  // 简化：按场景编号分组
  const groups: Record<string, MaterialMatch[]> = {};
  matches.forEach((match) => {
    const key = `scene_group_${Math.ceil(match.sceneNumber / 3)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(match);
  });
  return groups;
}

function collectUniqueMaterials(matches: MaterialMatch[]): MaterialItem[] {
  const seen = new Set<string>();
  const materials: MaterialItem[] = [];

  matches.forEach((match) => {
    match.matches.forEach((item) => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        materials.push(item);
      }
    });
  });

  return materials;
}

function calculateContinuityScore(matches: MaterialMatch[]): number {
  if (matches.length <= 1) return 1.0;

  // 连续场景评分：场景编号连续 + 素材相同 = 高连续性
  let continuityCount = 0;
  for (let i = 1; i < matches.length; i++) {
    if (matches[i].sceneNumber === matches[i - 1].sceneNumber + 1) {
      // 检查是否有相同素材
      const prevIds = new Set(matches[i - 1].matches.map((m) => m.id));
      const hasOverlap = matches[i].matches.some((m) => prevIds.has(m.id));
      if (hasOverlap) continuityCount++;
    }
  }

  return continuityCount / (matches.length - 1);
}

function mergeSmallGroups(groups: MaterialGroup[], maxGroupSize: number): MaterialGroup[] {
  const merged: MaterialGroup[] = [];
  let buffer: MaterialGroup[] = [];

  for (const group of groups) {
    buffer.push(group);
    if (buffer.length >= maxGroupSize) {
      merged.push(mergeGroups(buffer));
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    merged.push(mergeGroups(buffer));
  }

  return merged;
}

function mergeGroups(groups: MaterialGroup[]): MaterialGroup {
  if (groups.length === 1) return groups[0];

  return {
    groupId: groups[0].groupId,
    theme: groups.map((g) => g.theme).join('+'),
    scenes: groups.flatMap((g) => g.scenes).sort((a, b) => a - b),
    materials: groups.flatMap((g) => g.materials),
    continuityScore: groups.reduce((sum, g) => sum + g.continuityScore, 0) / groups.length,
  };
}
