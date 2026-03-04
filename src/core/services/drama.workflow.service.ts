/**
 * ClipAiMan 漫剧视频生成工作流服务
 * 小说 → 剧本 → 分镜 → 角色 → 场景 → 动画 → 配音 → 导出
 */

import { novelService } from './novel.service';
import { consistencyService } from './consistency.service';
import type { Character } from './consistency.service';
import { aiService } from './ai.service';
import { storageService } from './storage.service';
import type {
  NovelParseResult,
  Script,
  ScriptScene,
  Storyboard
} from './novel.service';

// 工作流步骤
export type DramaWorkflowStep =
  | 'novel-upload'
  | 'novel-parse'
  | 'script-generate'
  | 'storyboard-generate'
  | 'character-design'
  | 'scene-render'
  | 'animation'
  | 'voiceover'
  | 'export';

// 工作流状态
export interface DramaWorkflowState {
  step: DramaWorkflowStep;
  progress: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error?: string;
  data: DramaWorkflowData;
}

// 工作流数据
export interface DramaWorkflowData {
  projectId?: string;
  novelContent?: string;
  novelResult?: NovelParseResult;
  script?: Script;
  storyboards?: Storyboard[];
  characters?: Character[];
  scenes?: any[];
  animations?: any[];
  audio?: any;
  exportUrl?: string;
}

// 工作流配置
export interface DramaWorkflowConfig {
  autoParse: boolean;
  autoGenerateScript: boolean;
  autoGenerateStoryboard: boolean;
  chaptersToUse: number;
  scenesPerChapter: number;
  panelsPerScene: number;
  provider: string;
  model: string;
}

// 工作流事件回调
export interface DramaWorkflowCallbacks {
  onStepChange?: (step: DramaWorkflowStep, prevStep: DramaWorkflowStep) => void;
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: DramaWorkflowState['status']) => void;
  onError?: (error: string) => void;
  onComplete?: (result: DramaWorkflowData) => void;
}

class DramaWorkflowService {
  private state: DramaWorkflowState;
  private callbacks: DramaWorkflowCallbacks = {};
  private abortController: AbortController | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): DramaWorkflowState {
    return {
      step: 'novel-upload',
      progress: 0,
      status: 'idle',
      data: {}
    };
  }

  setCallbacks(callbacks: DramaWorkflowCallbacks): void {
    this.callbacks = callbacks;
  }

  getState(): DramaWorkflowState {
    return { ...this.state };
  }

  private updateState(updates: Partial<DramaWorkflowState>): void {
    const prevStep = this.state.step;
    const prevStatus = this.state.status;

    this.state = { ...this.state, ...updates };

    if (updates.step && updates.step !== prevStep) {
      this.callbacks.onStepChange?.(updates.step, prevStep);
    }
    if (updates.progress !== undefined) {
      this.callbacks.onProgress?.(updates.progress);
    }
    if (updates.status && updates.status !== prevStatus) {
      this.callbacks.onStatusChange?.(updates.status);
    }
    if (updates.error) {
      this.callbacks.onError?.(updates.error);
    }
  }

  private updateData(data: Partial<DramaWorkflowData>): void {
    this.state.data = { ...this.state.data, ...data };
  }

  /**
   * 开始工作流
   */
  async start(
    projectId: string,
    novelContent: string,
    config: DramaWorkflowConfig
  ): Promise<void> {
    this.abortController = new AbortController();
    this.updateState({ status: 'running', progress: 0 });

    try {
      // Step 1: 上传小说
      this.updateData({ projectId, novelContent });
      this.updateState({ step: 'novel-upload', progress: 5 });

      // Step 2: 解析小说
      if (config.autoParse) {
        await this.stepParseNovel(novelContent, config);
      } else {
        this.updateState({ step: 'novel-parse', progress: 15 });
        return;
      }

      // Step 3: 生成剧本
      if (config.autoGenerateScript) {
        await this.stepGenerateScript(config);
      } else {
        this.updateState({ step: 'script-generate', progress: 35 });
        return;
      }

      // Step 4: 生成分镜
      if (config.autoGenerateStoryboard) {
        await this.stepGenerateStoryboards(config);
      } else {
        this.updateState({ step: 'storyboard-generate', progress: 50 });
        return;
      }

      // Step 5: 角色设计
      await this.stepDesignCharacters(config);

      // Step 6: 场景渲染
      await this.stepRenderScenes(config);

      // Step 7: 动画合成
      await this.stepAnimation(config);

      // Step 8: 配音配乐
      await this.stepVoiceover(config);

      // Step 9: 导出
      await this.stepExport(config);

      this.updateState({ status: 'completed', progress: 100 });
      this.callbacks.onComplete?.(this.state.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '工作流执行失败';
      this.updateState({ status: 'error', error: errorMessage });
      throw error;
    }
  }

  /**
   * 解析小说
   */
  private async stepParseNovel(
    content: string,
    config: DramaWorkflowConfig
  ): Promise<void> {
    this.updateState({ step: 'novel-parse', progress: 10 });

    const result = await novelService.parseNovel(content, {
      maxChapters: config.chaptersToUse * 2,
      provider: config.provider,
      model: config.model
    });

    this.updateData({ novelResult: result });
    this.updateState({ progress: 20 });
  }

  /**
   * 生成剧本
   */
  private async stepGenerateScript(config: DramaWorkflowConfig): Promise<void> {
    this.updateState({ step: 'script-generate', progress: 25 });

    const { novelResult } = this.state.data;
    if (!novelResult) throw new Error('小说解析结果不存在');

    const script = await novelService.generateScript(novelResult, {
      chaptersToUse: config.chaptersToUse,
      scenesPerChapter: config.scenesPerChapter,
      provider: config.provider,
      model: config.model
    });

    this.updateData({ script });
    this.updateState({ progress: 40 });
  }

  /**
   * 生成分镜
   */
  private async stepGenerateStoryboards(config: DramaWorkflowConfig): Promise<void> {
    this.updateState({ step: 'storyboard-generate', progress: 45 });

    const { script } = this.state.data;
    if (!script) throw new Error('剧本不存在');

    const allStoryboards: Storyboard[] = [];

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      const panels = await novelService.generateStoryboard(scene, {
        panelsPerScene: config.panelsPerScene,
        provider: config.provider,
        model: config.model
      });
      allStoryboards.push(...panels);

      this.updateState({
        progress: 45 + ((i + 1) / script.scenes.length) * 15
      });
    }

    this.updateData({ storyboards: allStoryboards });
  }

  /**
   * 设计角色
   */
  private async stepDesignCharacters(config: DramaWorkflowConfig): Promise<void> {
    this.updateState({ step: 'character-design', progress: 60 });

    const { novelResult } = this.state.data;
    if (!novelResult) throw new Error('小说解析结果不存在');

    const characters: Character[] = novelResult.characters.map(char =>
      consistencyService.createCharacter({
        name: char.name,
        description: char.description,
        appearance: {
          gender: 'unknown',
          age: '未知',
          hairStyle: '',
          hairColor: '',
          eyeColor: '',
          clothing: '',
          features: []
        },
        personality: [],
        referenceImages: [],
        voice: {
          type: '',
          pitch: '',
          speed: '',
          emotion: ''
        }
      })
    );

    this.updateData({ characters });
    this.updateState({ progress: 70 });
  }

  /**
   * Step 6: 渲染场景
   * 输入: 分镜脚本 + 角色卡
   * 输出: 渲染后的场景图片序列
   */
  private async stepRenderScenes(config: DramaWorkflowConfig): Promise<void> {
    this.updateState({ step: 'scene-render', progress: 72 });

    const { storyboards, characters } = this.state.data;
    if (!storyboards || storyboards.length === 0) throw new Error('分镜数据不存在');

    const scenes: any[] = [];

    for (let i = 0; i < storyboards.length; i++) {
      const board = storyboards[i];

      // 构建场景渲染 prompt，融合角色外观信息
      const charDescriptions = (characters || [])
        .filter(c => board.characters.includes(c.name))
        .map(c => `${c.name}: ${c.appearance ? JSON.stringify(c.appearance) : c.description}`)
        .join('\n');

      const renderPrompt = [
        board.prompt,
        `风格: 漫画/动漫`,
        `镜头: ${board.shotType}, 角度: ${board.angle}`,
        `光照: ${board.lighting}, 氛围: ${board.mood}`,
        charDescriptions ? `角色:\n${charDescriptions}` : '',
        `背景: ${board.background}`
      ].filter(Boolean).join('\n');

      // 调用 AI 图像生成（通过 aiService）
      try {
        const sceneResult = await aiService.generate(
          `作为场景渲染引擎，根据以下分镜描述生成详细的漫画场景描述（用于后续图像生成）：\n\n${renderPrompt}`,
          { provider: config.provider, model: config.model }
        );

        scenes.push({
          id: `scene-${board.id}`,
          storyboardId: board.id,
          renderPrompt,
          description: sceneResult,
          imageUrl: null, // 实际图像URL由外部图像生成API填充
          status: 'described'
        });
      } catch {
        scenes.push({
          id: `scene-${board.id}`,
          storyboardId: board.id,
          renderPrompt,
          description: board.description,
          imageUrl: null,
          status: 'fallback'
        });
      }

      this.updateState({
        progress: 72 + ((i + 1) / storyboards.length) * 8
      });
    }

    this.updateData({ scenes });
    this.updateState({ progress: 80 });
  }

  /**
   * Step 7: 动态合成
   * 输入: 场景图片 + 分镜参数
   * 输出: 动画片段序列（含镜头运动、转场）
   */
  private async stepAnimation(config: DramaWorkflowConfig): Promise<void> {
    this.updateState({ step: 'animation', progress: 82 });

    const { storyboards, scenes } = this.state.data;
    if (!storyboards || !scenes) throw new Error('场景数据不存在');

    const animations: any[] = [];

    for (let i = 0; i < storyboards.length; i++) {
      const board = storyboards[i];
      const scene = scenes[i];

      // 根据分镜参数生成动画配置
      const animation = {
        id: `anim-${board.id}`,
        sceneId: scene?.id,
        duration: board.duration || 3,
        camera: {
          movement: board.movement, // static | pan | tilt | zoom | track
          startPosition: this.getCameraStart(board),
          endPosition: this.getCameraEnd(board),
          easing: 'ease-in-out'
        },
        transitions: {
          in: i === 0 ? 'fade' : this.getTransition(board, storyboards[i - 1]),
          out: 'cut',
          duration: 0.5
        },
        effects: {
          kenBurns: board.movement === 'zoom',
          parallax: board.movement === 'track',
          shake: false
        }
      };

      animations.push(animation);
      this.updateState({ progress: 82 + ((i + 1) / storyboards.length) * 6 });
    }

    this.updateData({ animations });
    this.updateState({ progress: 88 });
  }

  /**
   * Step 8: 配音配乐
   * 输入: 剧本对白 + 角色配音参数 + 场景氛围
   * 输出: 完整音轨（对白 + BGM + SFX）
   */
  private async stepVoiceover(config: DramaWorkflowConfig): Promise<void> {
    this.updateState({ step: 'voiceover', progress: 90 });

    const { script, characters, storyboards } = this.state.data;
    if (!script) throw new Error('剧本不存在');

    // 收集所有对白
    const dialogues: Array<{
      character: string;
      text: string;
      emotion?: string;
      sceneId: string;
    }> = [];

    for (const scene of script.scenes) {
      for (const line of scene.dialogue) {
        dialogues.push({
          character: line.character,
          text: line.text,
          emotion: line.emotion,
          sceneId: scene.id
        });
      }
    }

    // 匹配角色配音参数
    const voiceMap: Record<string, any> = {};
    for (const char of (characters || [])) {
      if (char.voice) {
        voiceMap[char.name] = char.voice;
      }
    }

    // 分析场景氛围用于 BGM 匹配
    const moodSequence = (storyboards || []).map(b => b.mood);
    const dominantMood = this.getDominantMood(moodSequence);

    const audio = {
      dialogues: dialogues.map(d => ({
        ...d,
        voiceConfig: voiceMap[d.character] || { type: 'default', pitch: 'medium', speed: 'normal' },
        audioUrl: null, // TTS API 生成后填充
        status: 'pending'
      })),
      bgm: {
        mood: dominantMood,
        style: 'cinematic',
        url: null,
        status: 'pending'
      },
      sfx: [],
      totalDialogues: dialogues.length,
      estimatedDuration: script.totalDuration
    };

    this.updateData({ audio });
    this.updateState({ progress: 95 });
  }

  /**
   * Step 9: 导出
   * 输入: 动画序列 + 音轨
   * 输出: 成品视频文件
   */
  private async stepExport(config: DramaWorkflowConfig): Promise<void> {
    this.updateState({ step: 'export', progress: 96 });

    const { projectId, animations, audio, storyboards } = this.state.data;
    if (!animations || !audio) throw new Error('动画或音频数据不存在');

    // 构建导出时间轴
    const timeline = {
      projectId,
      totalDuration: animations.reduce((sum: number, a: any) => sum + a.duration, 0),
      tracks: {
        video: animations.map((anim: any, idx: number) => ({
          id: anim.id,
          startTime: animations.slice(0, idx).reduce((s: number, a: any) => s + a.duration, 0),
          duration: anim.duration,
          camera: anim.camera,
          transitions: anim.transitions
        })),
        audio: {
          dialogues: audio.dialogues,
          bgm: audio.bgm,
          sfx: audio.sfx
        }
      },
      exportConfig: {
        format: 'mp4',
        resolution: '1080p',
        fps: 24,
        bitrate: '8M',
        codec: 'h264'
      }
    };

    // 保存导出配置
    await storageService.projects.save({ id: projectId, ...timeline } as any);

    this.updateData({
      exportUrl: `export://${projectId}/output.mp4`
    });
    this.updateState({ progress: 100 });
  }

  // ========== 辅助方法 ==========

  private getCameraStart(board: Storyboard): { x: number; y: number; zoom: number } {
    const base = { x: 0, y: 0, zoom: 1 };
    switch (board.movement) {
      case 'zoom': return { ...base, zoom: 0.8 };
      case 'pan': return { ...base, x: -0.1 };
      case 'tilt': return { ...base, y: -0.1 };
      default: return base;
    }
  }

  private getCameraEnd(board: Storyboard): { x: number; y: number; zoom: number } {
    const base = { x: 0, y: 0, zoom: 1 };
    switch (board.movement) {
      case 'zoom': return { ...base, zoom: 1.2 };
      case 'pan': return { ...base, x: 0.1 };
      case 'tilt': return { ...base, y: 0.1 };
      default: return base;
    }
  }

  private getTransition(current: Storyboard, previous: Storyboard): string {
    if (current.mood !== previous.mood) return 'dissolve';
    if (current.shotType !== previous.shotType) return 'cut';
    return 'cut';
  }

  private getDominantMood(moods: string[]): string {
    const counts: Record<string, number> = {};
    for (const m of moods) {
      counts[m] = (counts[m] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }

  /**
   * 暂停工作流
   */
  pause(): void {
    this.updateState({ status: 'paused' });
  }

  /**
   * 恢复工作流
   */
  resume(): void {
    this.updateState({ status: 'running' });
  }

  /**
   * 取消工作流
   */
  cancel(): void {
    this.abortController?.abort();
    this.updateState({ status: 'idle', progress: 0 });
  }

  /**
   * 重置工作流
   */
  reset(): void {
    this.state = this.getInitialState();
  }
}

// 导出单例
export const dramaWorkflowService = new DramaWorkflowService();
export default DramaWorkflowService;
