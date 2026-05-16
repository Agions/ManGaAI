import { Script } from '../types/script';

export interface EvaluationResult {
  score: number; // 0-100 总分
  dialogueNaturalness: number; // 对话自然度 0-100
  characterConsistency: number; // 角色一致性 0-100
  narrativeLogic: number; // 叙事逻辑 0-100
  pacingScore: number; // 节奏评分 0-100
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: EvaluationIssue[];
  suggestions: string[];
}

export interface EvaluationIssue {
  severity: 'low' | 'medium' | 'high';
  location: string; // e.g., "scene_1", "character:主角"
  description: string;
}
export function evaluateScript(script: Script): EvaluationResult {
  const issues: EvaluationIssue[] = [];
  const suggestions: string[] = [];
  // 1. 对话自然度评估
  const dialogueNaturalness = evaluateDialogueNaturalness(script, issues, suggestions);

  // 2. 角色一致性评估
  const characterConsistency = evaluateCharacterConsistency(script, issues, suggestions);

  // 3. 叙事逻辑评估
  const narrativeLogic = evaluateNarrativeLogic(script, issues, suggestions);

  // 4. 节奏评分
  const pacingScore = evaluatePacing(script, issues, suggestions);

  // 计算总分（加权平均）
  const score = Math.round(
    dialogueNaturalness * 0.25 +
      characterConsistency * 0.3 +
      narrativeLogic * 0.3 +
      pacingScore * 0.15
  );

  // 判定等级
  const overallGrade = getOverallGrade(score);

  return {
    score,
    dialogueNaturalness,
    characterConsistency,
    narrativeLogic,
    pacingScore,
    overallGrade,
    issues,
    suggestions: Array.from(new Set(suggestions)), // 去重
  };
}

function evaluateDialogueNaturalness(
  script: Script,
  issues: EvaluationIssue[],
  suggestions: string[]
): number {
  let score = 100;
  let dialogueCount = 0;
  const shortDialogues: string[] = [];

  script.scenes.forEach((scene) => {
    const sceneDialogues = scene.content.split(/[。！？\n]/).filter((d) => d.trim().length > 0);
    dialogueCount += sceneDialogues.length;

    sceneDialogues.forEach((d) => {
      const trimmed = d.trim();

      // 检测过短对话
      if (trimmed.length > 0 && trimmed.length < 4) {
        shortDialogues.push(trimmed);
      }

      // 检测无意义重复
      const words = trimmed.split('');
      const uniqueRatio = new Set(words).size / words.length;
      if (uniqueRatio < 0.3 && words.length > 5) {
        issues.push({
          severity: 'medium',
          location: scene.id,
          description: `对话可能过于重复：${trimmed.slice(0, 10)}...`,
        });
        score -= 5;
      }
    });
  });

  // 短对话过多扣分
  if (shortDialogues.length > dialogueCount * 0.3) {
    suggestions.push('部分对话过于简短，建议增加自然的寒暄和过渡语');
    score -= 10;
  }

  return Math.max(0, score);
}

function evaluateCharacterConsistency(
  script: Script,
  issues: EvaluationIssue[],
  _suggestions: string[]
): number {
  let score = 100;

  // 检查角色出现频率是否合理
  const charAppearanceCount: Record<string, number> = {};
  script.scenes.forEach((scene) => {
    scene.characters.forEach((char) => {
      charAppearanceCount[char] = (charAppearanceCount[char] || 0) + 1;
    });
  });

  // 检测戏份异常（某些角色出现太多/太少）
  const counts = Object.values(charAppearanceCount);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

  Object.entries(charAppearanceCount).forEach(([char, count]) => {
    if (count > avg * 5) {
      issues.push({
        severity: 'low',
        location: `character:${char}`,
        description: `角色"${char}"戏份过多（出现${count}次），可能影响故事平衡`,
      });
      score -= 5;
    }
    if (count < avg * 0.1 && counts.length > 2) {
      issues.push({
        severity: 'medium',
        location: `character:${char}`,
        description: `角色"${char}"戏份过少，建议增加出场机会`,
      });
      score -= 10;
    }
  });

  return Math.max(0, score);
}

function evaluateNarrativeLogic(
  script: Script,
  issues: EvaluationIssue[],
  suggestions: string[]
): number {
  let score = 100;

  // 检测场景跳转逻辑
  let prevLocation = '';
  let locationJumpCount = 0;

  script.scenes.forEach((scene) => {
    if (prevLocation && prevLocation !== scene.location) {
      locationJumpCount++;
    }
    prevLocation = scene.location;
  });

  // 场景跳转过多（无过渡）
  if (locationJumpCount > script.scenes.length * 0.5) {
    suggestions.push('场景跳转过于频繁，建议增加过渡场景或场景描述');
    score -= 15;
  }

  // 检测情感波动
  const emotions = script.scenes.map((s) => s.emotion);
  const emotionChanges = emotions.filter((e, i) => i > 0 && e !== emotions[i - 1]).length;

  if (emotionChanges < script.scenes.length * 0.1) {
    suggestions.push('情感变化较少，叙事节奏略显平淡');
    score -= 5;
  }

  return Math.max(0, score);
}

function evaluatePacing(script: Script, issues: EvaluationIssue[], suggestions: string[]): number {
  let score = 100;

  // 场景数量与时长匹配度
  const expectedDurationPerScene = 2; // 分钟
  const expectedScenes = script.estimatedDuration / expectedDurationPerScene;
  const actualScenes = script.scenes.length;

  if (actualScenes > expectedScenes * 1.5) {
    suggestions.push('场景数量偏多，可能节奏拖沓');
    score -= 10;
  }
  if (actualScenes < expectedScenes * 0.5 && expectedScenes > 3) {
    suggestions.push('场景数量偏少，建议适当拆分丰富叙事');
    score -= 10;
  }

  // 检测过短场景
  const shortScenes = script.scenes.filter((s) => s.content.length < 20);
  if (shortScenes.length > script.scenes.length * 0.3) {
    suggestions.push('部分场景内容过短，建议合并或补充');
    score -= 5;
  }

  return Math.max(0, score);
}

function getOverallGrade(score: number): EvaluationResult['overallGrade'] {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
