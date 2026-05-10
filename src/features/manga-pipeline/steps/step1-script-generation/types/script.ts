import { CharacterCard } from './character';
import { Scene } from './scene';

export interface ScriptScene extends Scene {
  sceneNumber: number;
  videoNote?: string;  // 视频分镜备注
  bgmSuggestion?: string;
  dialogue?: DialogueLine[];  // 场景对话
}

export interface DialogueLine {
  character?: string;
  characterId?: string;
  characterName?: string;
  type: string;
  content: string;
  text?: string;
  emotion?: string;
}

export interface ScriptGenerationInput {
  sourceText: string;
  characters?: CharacterCard[];
}

export interface ScriptGenerationResult {
  script: Script;
  errors?: string[];
  metadata: {
    chaptersCount: number;
    eventsCount: number;
    charactersCount: number;
    scenesCount: number;
    grade: string;
    evaluationScore: number;
  };
}

export interface Script {
  id: string;
  title: string;
  sourceText: string;
  estimatedDuration: number;  // 分钟
  scenes: ScriptScene[];
  characters: CharacterCard[];
  metadata: {
    generatedAt: number;
    model: string;
    version: string;
  };
}
