import { ttsService, DEFAULT_TTS_CONFIG } from '../../../../../core/services/tts.service';
import type { TTSConfig } from '../../../../../shared/types/index';
import type { DialogueSegment, TTSGenerationResult } from '../../../types/dialogue';
import { Script, ScriptScene } from '../../step1-script-generation/types/script';

import { VoiceAssignment } from './assigner';

// Re-export for external consumers (e.g., step5-keyframe)
export type { DialogueSegment, TTSGenerationResult };

/**
 * 为对话生成 TTS 配音序列（仅生成序列信息，不执行实际合成）
 */
export function generateDialogueTTS(
  script: Script,
  voiceAssignments: VoiceAssignment[]
): TTSGenerationResult {
  const segments: DialogueSegment[] = [];
  let currentTime = 0;
  let segmentId = 1;

  const voiceMap = new Map(voiceAssignments.map((v) => [v.characterId, v]));

  for (const scene of script.scenes) {
    // 跳过无内容的场景
    if (!scene.content || scene.content.trim().length === 0) {
      currentTime += 3; // 默认 3 秒沉默
      continue;
    }

    // 从场景内容提取对话
    const dialogueLines = extractDialogueFromScene(scene);

    for (const line of dialogueLines) {
      // 查找角色音色分配
      const characterId = findCharacterId(line.character, script.characters);
      const voiceAssignment = characterId ? voiceMap.get(characterId) : voiceAssignments[0]; // 默认第一个音色

      if (!voiceAssignment) continue;

      // 估算朗读时长（中文约 5 字/秒）
      const textDuration = Math.max(estimateTextDuration(line.text), 2);

      segments.push({
        id: `tts_${segmentId++}`,
        sceneId: scene.id,
        sceneNumber: scene.sceneNumber,
        character: line.character,
        characterId: characterId || 'unknown',
        text: line.text,
        emotion: line.emotion,
        voiceId: voiceAssignment.voiceId,
        startTime: currentTime,
        endTime: currentTime + textDuration,
        status: 'pending',
      });

      currentTime += textDuration + 0.5; // 添加 0.5 秒间隔
    }

    // 场景间添加间隔
    currentTime += 1;
  }

  return {
    segments,
    totalDuration: currentTime,
  };
}

/**
 * 使用 Edge-TTS 合成真实音频
 */
export async function synthesizeSegmentAudio(
  segment: DialogueSegment,
  options: { ttsConfig?: Partial<TTSConfig> } = {}
): Promise<DialogueSegment> {
  const updatedSegment = { ...segment, status: 'generating' as const };

  try {
    const config: TTSConfig = {
      ...DEFAULT_TTS_CONFIG,
      ...options.ttsConfig,
      voice: segment.voiceId || DEFAULT_TTS_CONFIG.voice,
    };

    const response = await ttsService.synthesize({
      text: segment.text,
      config,
    });

    // 创建 Blob URL
    const blob = new Blob([response.audio], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(blob);

    return {
      ...updatedSegment,
      status: 'done',
      audioUrl,
      audioData: response.audio,
      duration: response.duration,
      endTime: segment.startTime + response.duration,
    };
  } catch (error) {
    return {
      ...updatedSegment,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 批量合成对话音频（并发版）
 *
 * 优化点：
 * 1. 使用 Promise.allSettled 并发处理，失败不影响其他段
 * 2. 支持 concurrency 限制（默认 5 并发，避免 API 限流）
 * 3. 支持进度回调和中止信号
 */
export async function synthesizeAllDialogueAudio(
  segments: DialogueSegment[],
  options: {
    ttsConfig?: Partial<TTSConfig>;
    onProgress?: (completed: number, total: number) => void;
    signal?: AbortSignal;
    /** 最大并发数（默认 5，避免 API 限流） */
    concurrency?: number;
  } = {}
): Promise<DialogueSegment[]> {
  const concurrency = options.concurrency ?? 5;
  const total = segments.length;
  let completed = 0;
  // 按 concurrency 限制分批并发
  const results: DialogueSegment[] = [];
  for (let batchStart = 0; batchStart < segments.length; batchStart += concurrency) {
    if (options.signal?.aborted) {
      // 剩余的标记为 failed
      for (let j = batchStart; j < segments.length; j++) {
        results.push({ ...segments[j], status: 'failed', error: 'Synthesis cancelled' });
      }
      break;
    }
    const batch = segments.slice(batchStart, batchStart + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((seg) => synthesizeSegmentAudio(seg, options))
    );

    for (const settled of batchResults) {
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      } else {
        // promise rejected — 标记为 failed
        const idx = batchStart + batchResults.indexOf(settled);
        results.push({
          ...segments[idx],
          status: 'failed',
          error: settled.reason?.message || 'Unknown error',
        });
      }
      completed++;
      options.onProgress?.(completed, total);
    }
  }
  return results;
}

function extractDialogueFromScene(
  scene: ScriptScene
): { character: string; text: string; emotion: string }[] {
  const lines: { character: string; text: string; emotion: string }[] = [];

  // 从 scene.content 中提取对话
  // 格式：角色：对话内容
  const dialoguePattern = /([^\s：]+)：([^。！？\n]+[。！？]?)/g;
  let match;

  while ((match = dialoguePattern.exec(scene.content)) !== null) {
    lines.push({
      character: match[1],
      text: match[2].trim(),
      emotion: scene.emotion,
    });
  }

  // 如果没有提取到，使用场景描述作为旁白
  if (lines.length === 0 && scene.content.trim()) {
    lines.push({
      character: '旁白',
      text: scene.content.slice(0, 50),
      emotion: scene.emotion,
    });
  }

  return lines;
}

function findCharacterId(
  characterName: string,
  characters: Script['characters']
): string | undefined {
  return characters.find((c) => c.name === characterName)?.id;
}

function estimateTextDuration(text: string): number {
  // 中文约 5 字/秒，英文约 3 words/秒
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

  const duration = chineseChars / 5 + englishWords / 3;
  return Math.ceil(duration);
}
