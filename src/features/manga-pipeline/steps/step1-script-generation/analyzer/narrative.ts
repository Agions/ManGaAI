import { StoryEvent } from '../parser/extractor';

export type StoryArc = 'introduction' | 'rising' | 'climax' | 'falling' | 'resolution';

export interface NarrativeStructure {
  arc: StoryArc;
  estimatedDuration: number; // 分钟
  keyPlotPoints: string[];
  arcSegments: ArcSegment[];
}

export interface ArcSegment {
  startPercent: number;
  endPercent: number;
  arc: StoryArc;
  description: string;
}

/**
 * 分析叙事结构（起承转合）
 * 基于事件数量 + 情感强度分布判断
 */
export function analyzeNarrativeStructure(
  events: StoryEvent[],
  _totalChapters: number
): NarrativeStructure {
  if (events.length === 0) {
    return {
      arc: 'introduction',
      estimatedDuration: 0,
      keyPlotPoints: [],
      arcSegments: [],
    };
  }

  const arcSegments: ArcSegment[] = [];
  const keyPlotPoints: string[] = [];

  // 计算情感强度分布
  const emotionWeights: Record<StoryEvent['emotionalTone'], number> = {
    neutral: 0,
    happy: 1,
    sad: 2,
    tense: 3,
    angry: 3,
    surprising: 4,
  };

  const eventsWithWeight = events.map((e, i) => ({
    ...e,
    weight: emotionWeights[e.emotionalTone] + (i < events.length * 0.1 ? 1 : 0),
    position: i / events.length,
  }));

  // 找到情感峰值（高潮）
  const maxWeightEvent = eventsWithWeight.reduce(
    (max, e) => (e.weight > max.weight ? e : max),
    eventsWithWeight[0]
  );
  const climaxPosition = maxWeightEvent.position;

  // 构建弧线段
  const segments = 5;
  const segmentSize = 1 / segments;

  for (let i = 0; i < segments; i++) {
    const start = i * segmentSize;
    const end = (i + 1) * segmentSize;
    const arc: StoryArc =
      i === 0
        ? 'introduction'
        : i < segments - 2
          ? 'rising'
          : i === segments - 2
            ? 'climax'
            : i === segments - 1 && climaxPosition > 0.6
              ? 'falling'
              : 'rising';

    arcSegments.push({
      startPercent: start * 100,
      endPercent: end * 100,
      arc,
      description: getArcDescription(arc),
    });

    // 收集关键情节点
    if (arc === 'climax' || arc === 'rising') {
      const relevantEvents = eventsWithWeight.filter(
        (e) => e.position >= start && e.position < end && e.weight >= 2
      );
      relevantEvents.forEach((e) => {
        if (e.description.length < 50) {
          keyPlotPoints.push(e.description);
        }
      });
    }
  }

  // 判断整体弧线
  const climaxCount = eventsWithWeight.filter(
    (e) => e.emotionalTone === 'surprising' || e.emotionalTone === 'tense'
  ).length;
  const arc: StoryArc = climaxCount > events.length * 0.3 ? 'climax' : 'rising';

  // 估计时长（按每秒1事件）
  const estimatedDuration = Math.max(events.length * 0.5, 5);

  return {
    arc,
    estimatedDuration,
    keyPlotPoints: Array.from(new Set(keyPlotPoints)).slice(0, 10),
    arcSegments,
  };
}

function getArcDescription(arc: StoryArc): string {
  const descriptions: Record<StoryArc, string> = {
    introduction: '建立世界观和人物关系',
    rising: '冲突升级，情节发展',
    climax: '高潮，最紧张的情节',
    falling: '冲突解决，情节收束',
    resolution: '结局，收尾',
  };
  return descriptions[arc];
}
