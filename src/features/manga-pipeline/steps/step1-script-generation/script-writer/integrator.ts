import { ClassifiedParagraph } from '../parser/classifier';
import { CharacterCard } from '../types/character';
import { Scene } from '../types/scene';
import { Script, ScriptScene } from '../types/script';

import { generateDialogue } from './dialogue-gen';

export interface ScriptIntegrationOptions {
  title?: string;
  model?: string;
}

/**
 * 整合场景、对话、角色生成完整剧本
 */
export function integrateScript(
  scenes: Scene[],
  characters: CharacterCard[],
  paragraphs: ClassifiedParagraph[],
  options: ScriptIntegrationOptions = {}
): Script {
  const { title = '未命名剧本', model = 'deepseek-v3' } = options;

  // 将场景转换为带对话的 ScriptScene
  const scriptScenes: ScriptScene[] = scenes.map((scene, sceneIdx) => {
    const dialogue = generateDialogue(scene, paragraphs);

    return {
      ...scene,
      sceneNumber: sceneIdx + 1,
      videoNote: generateVideoNote(scene),
      bgmSuggestion: generateBgmSuggestion(scene),
      dialogue,
    };
  });

  // 计算总时长（每个场景约 1-3 分钟）
  const estimatedDuration = scenes.length * 2;

  return {
    id: generateScriptId(),
    title,
    sourceText: '', // 原始文本可选填充
    estimatedDuration,
    scenes: scriptScenes,
    characters,
    metadata: {
      generatedAt: Date.now(),
      model,
      version: '1.0',
    },
  };
}

function generateVideoNote(scene: Scene): string {
  const cameraInstructions: Record<string, string> = {
    远景: '建立镜头，定场使用',
    全景: '展示全部人物和场景',
    中景: '人物半身，标准对话镜头',
    近景: '人物面部特写，强调情绪',
    特写: '细节镜头，突出关键物品或表情',
  };

  const hint = scene.cameraHint;
  const base = cameraInstructions[hint] || '标准中景';

  if (scene.emotion === 'tense') {
    return `${hint}，${base}，手持轻微晃动增加紧张感`;
  }
  if (scene.emotion === 'sad') {
    return `${hint}，${base}，慢速推进增加悲伤氛围`;
  }

  return `${hint}，${base}`;
}

function generateBgmSuggestion(scene: Scene): string {
  const bgmMap: Record<string, string> = {
    tense: '悬疑紧张类BGM，节奏加快',
    angry: '低沉鼓点，压迫感强',
    surprising: '突发音效 + 悬停音乐',
    sad: '钢琴慢曲，忧伤弦乐',
    happy: '轻快明亮，欢快节奏',
    neutral: '背景轻音乐',
  };

  return bgmMap[scene.emotion] || '背景轻音乐';
}

function generateScriptId(): string {
  return `script_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
