/**
 * 增强版工作流服务
 * 集成重试、检查点、缓存、并行处理功能
 */

import { novelService } from './novel.service';
import { consistencyService } from './consistency.service';
import type { Character } from './consistency.service';
import { aiService } from './ai.service';
import { storageService } from './storage.service';
import { lipSyncService } from './lip-sync.service';
import {
  withRetry,
  withTimeout,
  workflowCache,
  checkpointStorage,
  createCheckpoint,
  SimpleCache
} from './workflow-enhance.service';
import type { RetryConfig } from './workflow-enhance.service';
import type {
  NovelParseResult,
  Script,
  Storyboard
} from './novel.service';

// 增强的工作流步骤 - 包含 lip-sync
export type DramaWorkflowStep =
  | 'novel-upload'
  | 'novel-parse'
  | 'script-generate'
  | 'storyboard-generate'
  | 'character-design'
  | 'scene-render'
  | 'animation'
  | 'voiceover'
  | 'lip-sync'
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
  lipSyncResults?: any[];
  exportUrl?: string;
}

// 工作流配置 - 增强版
export interface DramaWorkflowConfig {
  autoParse: boolean;
  autoGenerateScript: boolean;
  autoGenerateStoryboard: boolean;
  chaptersToUse: number;
  scenesPerChapter: number;
  panelsPerScene: number;
  provider: string;
  model: string;
  // 增强配置
  enableRetry?: boolean;
  enableCheckpoint?: boolean;
  enableCache?: boolean;
  enableParallel?: boolean;
  retryConfig?: RetryConfig;
  checkpointInterval?: number;
}

// 步骤结果缓存 key
function getStepCacheKey(step: string, content: string, config: any): string {
  const contentHash = SimpleCache.hashContent(content);
  const configHash = SimpleCache.hashContent(JSON.stringify(config));
  return `${step}_${contentHash}_${configHash}`;
}

class EnhancedDramaWorkflowService {
  private state: DramaWorkflowState;
  private config: DramaWorkflowConfig;
  private abortController: AbortController | null = null;
  private checkpointInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.state = this.getInitialState();
    this.config = this.getDefaultConfig();
  }

  private getInitialState(): DramaWorkflowState {
    return {
      step: 'novel-upload',
      progress: 0,
      status: 'idle',
      data: {}
    };
  }

  private getDefaultConfig(): DramaWorkflowConfig {
    return {
      autoParse: true,
      autoGenerateScript: true,
      autoGenerateStoryboard: true,
      chaptersToUse: 5,
      scenesPerChapter: 3,
      panelsPerScene: 4,
      provider: 'openai',
      model: 'gpt-4',
      enableRetry: true,
      enableCheckpoint: true,
      enableCache: true,
      enableParallel: true,
      retryConfig: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2
      }
    };
  }

  /**
   * 开始工作流 - 增强版
   */
  async start(
    projectId: string,
    novelContent: string,
    config: Partial<DramaWorkflowConfig> = {}
  ): Promise<void> {
    this.config = { ...this.getDefaultConfig(), ...config };
    this.abortController = new AbortController();
    this.updateState({ status: 'running', progress: 0 });

    // 启动检查点保存
    if (this.config.enableCheckpoint) {
      this.startCheckpointSaving();
    }

    try {
      // Step 1: 上传小说
      this.updateData({ projectId, novelContent });
      this.updateState({ step: 'novel-upload', progress: 5 });

      // Step 2: 解析小说 (带重试)
      if (this.config.autoParse) {
        await this.stepParseNovelWithRetry(novelContent);
      } else {
        this.updateState({ step: 'novel-parse', progress: 15 });
        return;
      }

      // Step 3: 生成剧本 (带缓存)
      if (this.config.autoGenerateScript) {
        await this.stepGenerateScriptWithCache();
      } else {
        this.updateState({ step: 'script-generate', progress: 35 });
        return;
      }

      // Step 4: 生成分镜 (带缓存)
      if (this.config.autoGenerateStoryboard) {
        await this.stepGenerateStoryboardsWithCache();
      } else {
        this.updateState({ step: 'storyboard-generate', progress: 50 });
        return;
      }

      // Step 5: 角色设计 (可并行)
      if (this.config.enableParallel) {
        await this.stepDesignCharactersParallel();
      } else {
        await this.stepDesignCharacters();
      }

      // Step 6: 场景渲染 (可并行)
      if (this.config.enableParallel) {
        await this.stepRenderScenesParallel();
      } else {
        await this.stepRenderScenes();
      }

      // Step 7: 动画合成
      await this.stepAnimation();

      // Step 8: 配音配乐
      await this.stepVoiceover();

      // Step 9: 对口型处理 (新增)
      await this.stepLipSync();

      // Step 10: 导出
      await this.stepExport();

      this.updateState({ status: 'completed', progress: 100 });
      this.stopCheckpointSaving();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '工作流执行失败';
      this.updateState({ status: 'error', error: errorMessage });
      this.stopCheckpointSaving();
      throw error;
    }
  }

  /**
   * 带重试的解析小说
   */
  private async stepParseNovelWithRetry(content: string): Promise<void> {
    const cacheKey = getStepCacheKey('parse', content, this.config);
    
    // 尝试从缓存加载
    if (this.config.enableCache) {
      const cached = workflowCache.get<NovelParseResult>(cacheKey);
      if (cached) {
        console.log('[Workflow] 使用缓存的解析结果');
        this.updateData({ novelResult: cached });
        this.updateState({ step: 'novel-parse', progress: 20 });
        return;
      }
    }

    const execFn = async () => {
      this.updateState({ step: 'novel-parse', progress: 10 });
      return await novelService.parseNovel(content, {
        maxChapters: this.config.chaptersToUse * 2,
        provider: this.config.provider,
        model: this.config.model
      });
    };

    let result: NovelParseResult;
    
    if (this.config.enableRetry) {
      result = await withRetry(execFn, this.config.retryConfig, (attempt, delay, error) => {
        console.log(`[Workflow] 解析失败，${attempt}秒后重试...`, error.message);
      });
    } else {
      result = await execFn();
    }

    // 保存到缓存
    if (this.config.enableCache) {
      workflowCache.set(cacheKey, result);
    }

    this.updateData({ novelResult: result });
    this.updateState({ progress: 20 });
  }

  /**
   * 带缓存的生成剧本
   */
  private async stepGenerateScriptWithCache(): Promise<void> {
    const { novelResult } = this.state.data;
    if (!novelResult) throw new Error('小说解析结果不存在');

    const cacheKey = getStepCacheKey('script', JSON.stringify(novelResult), this.config);
    
    if (this.config.enableCache) {
      const cached = workflowCache.get<Script>(cacheKey);
      if (cached) {
        console.log('[Workflow] 使用缓存的剧本');
        this.updateData({ script: cached });
        this.updateState({ step: 'script-generate', progress: 40 });
        return;
      }
    }

    this.updateState({ step: 'script-generate', progress: 25 });

    const execFn = async () => {
      return await novelService.generateScript(novelResult, {
        chaptersToUse: this.config.chaptersToUse,
        scenesPerChapter: this.config.scenesPerChapter,
        provider: this.config.provider,
        model: this.config.model
      });
    };

    let script: Script;
    
    if (this.config.enableRetry) {
      script = await withRetry(execFn, this.config.retryConfig);
    } else {
      script = await execFn();
    }

    if (this.config.enableCache) {
      workflowCache.set(cacheKey, script);
    }

    this.updateData({ script });
    this.updateState({ progress: 40 });
  }

  /**
   * 带缓存的生成分镜
   */
  private async stepGenerateStoryboardsWithCache(): Promise<void> {
    const { script } = this.state.data;
    if (!script) throw new Error('剧本不存在');

    this.updateState({ step: 'storyboard-generate', progress: 45 });

    const allStoryboards: Storyboard[] = [];
    const storyboardHash = SimpleCache.hashContent(JSON.stringify(script));

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      const cacheKey = getStepCacheKey(`storyboard_${i}`, JSON.stringify(scene), this.config);
      
      let panels: Storyboard[];
      
      if (this.config.enableCache) {
        const cached = workflowCache.get<Storyboard[]>(cacheKey);
        if (cached) {
          console.log(`[Workflow] 使用缓存的分镜 ${i + 1}/${script.scenes.length}`);
          panels = cached;
        } else {
          panels = await this.generateWithRetry(() => 
            novelService.generateStoryboard(scene, {
              panelsPerScene: this.config.panelsPerScene,
              provider: this.config.provider,
              model: this.config.model
            })
          );
          workflowCache.set(cacheKey, panels);
        }
      } else {
        panels = await this.generateWithRetry(() => 
          novelService.generateStoryboard(scene, {
            panelsPerScene: this.config.panelsPerScene,
            provider: this.config.provider,
            model: this.config.model
          })
        );
      }
      
      allStoryboards.push(...panels);

      this.updateState({
        progress: 45 + ((i + 1) / script.scenes.length) * 15
      });
    }

    this.updateData({ storyboards: allStoryboards });
  }

  /**
   * 并行设计角色
   */
  private async stepDesignCharactersParallel(): Promise<void> {
    this.updateState({ step: 'character-design', progress: 60 });

    const { novelResult } = this.state.data;
    if (!novelResult) throw new Error('小说解析结果不存在');

    // 并行创建角色
    const characterPromises = novelResult.characters.map(char => 
      Promise.resolve(
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
          voice: { type: '', pitch: '', speed: '', emotion: '' }
        })
      )
    );

    const characters = await Promise.all(characterPromises);

    this.updateData({ characters });
    this.updateState({ progress: 70 });
  }

  /**
   * 并行渲染场景
   */
  private async stepRenderScenesParallel(): Promise<void> {
    this.updateState({ step: 'scene-render', progress: 72 });

    const { storyboards, characters } = this.state.data;
    if (!storyboards || storyboards.length === 0) throw new Error('分镜数据不存在');

    // 并行处理场景
    const scenePromises = storyboards.map(async (board, idx) => {
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

      try {
        const sceneResult = await this.generateWithRetry(() =>
          aiService.generate(renderPrompt, { provider: this.config.provider, model: this.config.model })
        );

        return {
          id: `scene-${board.id}`,
          storyboardId: board.id,
          renderPrompt,
          description: sceneResult,
          imageUrl: null,
          status: 'completed'
        };
      } catch {
        return {
          id: `scene-${board.id}`,
          storyboardId: board.id,
          renderPrompt,
          description: board.description,
          imageUrl: null,
          status: 'fallback'
        };
      }
    });

    const scenes = await Promise.all(scenePromises);

    this.updateData({ scenes });
    this.updateState({ progress: 80 });
  }

  /**
   * 标准角色设计
   */
  private async stepDesignCharacters(): Promise<void> {
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
        voice: { type: '', pitch: '', speed: '', emotion: '' }
      })
    );

    this.updateData({ characters });
    this.updateState({ progress: 70 });
  }

  /**
   * 标准场景渲染
   */
  private async stepRenderScenes(): Promise<void> {
    this.updateState({ step: 'scene-render', progress: 72 });

    const { storyboards, characters } = this.state.data;
    if (!storyboards || storyboards.length === 0) throw new Error('分镜数据不存在');

    const scenes: any[] = [];

    for (let i = 0; i < storyboards.length; i++) {
      const board = storyboards[i];

      const charDescriptions = (characters || [])
        .filter(c => board.characters.includes(c.name))
        .map(c => `${c.name}: ${c.appearance ? JSON.stringify(c.appearance) : c.description}`)
        .join('\n');

      const renderPrompt = [
        board.prompt,
        `风格: 漫画/动漫`,
        `镜头: ${board.shotType}, 角度: ${board.angle}`,
        charDescriptions ? `角色:\n${charDescriptions}` : '',
        `背景: ${board.background}`
      ].filter(Boolean).join('\n');

      try {
        const sceneResult = await this.generateWithRetry(() =>
          aiService.generate(renderPrompt, { provider: this.config.provider, model: this.config.model })
        );

        scenes.push({
          id: `scene-${board.id}`,
          storyboardId: board.id,
          renderPrompt,
          description: sceneResult,
          imageUrl: null,
          status: 'completed'
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
   * 动画合成
   */
  private async stepAnimation(): Promise<void> {
    this.updateState({ step: 'animation', progress: 82 });

    const { storyboards, scenes } = this.state.data;
    if (!storyboards || !scenes) throw new Error('场景数据不存在');

    const animations = storyboards.map((board, idx) => ({
      id: `anim-${board.id}`,
      sceneId: scenes[idx]?.id,
      duration: board.duration || 3,
      camera: {
        movement: board.movement,
        startPosition: { x: 0, y: 0, zoom: 1 },
        endPosition: { x: 0, y: 0, zoom: 1 },
        easing: 'ease-in-out'
      },
      transitions: { in: idx === 0 ? 'fade' : 'cut', out: 'cut', duration: 0.5 }
    }));

    this.updateData({ animations });
    this.updateState({ progress: 88 });
  }

  /**
   * 配音配乐
   */
  private async stepVoiceover(): Promise<void> {
    this.updateState({ step: 'voiceover', progress: 90 });

    const { script, characters, storyboards } = this.state.data;
    if (!script) throw new Error('剧本不存在');

    const dialogues: any[] = [];
    for (const scene of script.scenes) {
      for (const line of scene.dialogue) {
        dialogues.push({
          character: line.character,
          text: line.text,
          emotion: line.emotion,
          sceneId: scene.id,
          voiceConfig: { type: 'default', pitch: 'medium', speed: 'normal' },
          audioUrl: null,
          status: 'pending'
        });
      }
    }

    const voiceMap: Record<string, any> = {};
    for (const char of (characters || [])) {
      if (char.voice) voiceMap[char.name] = char.voice;
    }

    // 更新语音配置
    for (const d of dialogues) {
      if (voiceMap[d.character]) {
        d.voiceConfig = voiceMap[d.character];
      }
    }

    const audio = {
      dialogues,
      bgm: { mood: 'neutral', style: 'cinematic', url: null, status: 'pending' },
      sfx: [],
      totalDialogues: dialogues.length,
      estimatedDuration: script.totalDuration
    };

    this.updateData({ audio });
    this.updateState({ progress: 93 });
  }

  /**
   * 对口型处理 (新增步骤)
   */
  private async stepLipSync(): Promise<void> {
    this.updateState({ step: 'lip-sync', progress: 95 });

    const { audio, characters } = this.state.data;
    if (!audio) throw new Error('音频数据不存在');

    // 为每个对话创建对口型任务
    const lipSyncResults: any[] = [];
    const pendingDialogues = audio.dialogues.filter((d: any) => d.status === 'pending');

    // 查找角色参考图
    const getCharacterRefImage = (characterName: string): string | undefined => {
      const char = (characters || []).find((c: Character) => c.name === characterName);
      return char?.referenceImages?.[0];
    };

    // 批量创建对口型任务
    for (const dialogue of pendingDialogues) {
      const refImage = getCharacterRefImage(dialogue.character);
      
      if (refImage) {
        const result = await lipSyncService.createTask({
          characterId: dialogue.character,
          characterName: dialogue.character,
          audioUrl: dialogue.audioUrl || '',
          audioText: dialogue.text,
          referenceImageUrl: refImage,
          duration: 3,
          emotions: dialogue.emotion ? [dialogue.emotion] : []
        });
        
        lipSyncResults.push(result);
        dialogue.lipSyncId = result.id;
      }
    }

    this.updateData({ lipSyncResults });
    this.updateState({ progress: 98 });
  }

  /**
   * 导出
   */
  private async stepExport(): Promise<void> {
    this.updateState({ step: 'export', progress: 99 });

    const { projectId, animations, audio, lipSyncResults } = this.state.data;
    if (!animations || !audio) throw new Error('数据不完整');

    const timeline = {
      projectId,
      totalDuration: animations.reduce((sum: number, a: any) => sum + a.duration, 0),
      tracks: {
        video: animations,
        audio: { ...audio, lipSyncResults }
      },
      exportConfig: {
        format: 'mp4',
        resolution: '1080p',
        fps: 24,
        bitrate: '8M',
        codec: 'h264'
      }
    };

    await storageService.projects.save({ id: projectId, ...timeline } as any);

    this.updateData({ exportUrl: `export://${projectId}/output.mp4` });
    this.updateState({ progress: 100 });
  }

  // ========== 辅助方法 ==========

  private async generateWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    if (this.config.enableRetry) {
      return withRetry(fn, this.config.retryConfig);
    }
    return fn();
  }

  private updateState(updates: Partial<DramaWorkflowState>): void {
    const prevStep = this.state.step;
    this.state = { ...this.state, ...updates };
    
    // 自动保存检查点
    if (this.config.enableCheckpoint && updates.step) {
      this.saveCheckpoint();
    }
  }

  private updateData(data: Partial<DramaWorkflowData>): void {
    this.state.data = { ...this.state.data, ...data };
  }

  private startCheckpointSaving(): void {
    const interval = this.config.checkpointInterval || 30000; // 默认30秒
    this.checkpointInterval = setInterval(() => {
      this.saveCheckpoint();
    }, interval);
  }

  private stopCheckpointSaving(): void {
    if (this.checkpointInterval) {
      clearInterval(this.checkpointInterval);
      this.checkpointInterval = null;
    }
  }

  private async saveCheckpoint(): Promise<void> {
    const { projectId } = this.state.data;
    if (!projectId) return;

    const checkpoint = createCheckpoint(
      this.state.step,
      this.state.progress,
      { ...this.state.data },
      '2.0.0'
    );

    try {
      await checkpointStorage.save(checkpoint);
      console.log(`[Workflow] 检查点已保存: ${this.state.step} (${this.state.progress}%)`);
    } catch (error) {
      console.error('[Workflow] 检查点保存失败:', error);
    }
  }

  /**
   * 暂停工作流
   */
  pause(): void {
    this.updateState({ status: 'paused' });
    this.stopCheckpointSaving();
  }

  /**
   * 恢复工作流
   */
  resume(): void {
    this.updateState({ status: 'running' });
    if (this.config.enableCheckpoint) {
      this.startCheckpointSaving();
    }
  }

  /**
   * 取消工作流
   */
  cancel(): void {
    this.abortController?.abort();
    this.stopCheckpointSaving();
    this.updateState({ status: 'idle', progress: 0 });
  }

  /**
   * 重置工作流
   */
  reset(): void {
    this.state = this.getInitialState();
    workflowCache.clear();
  }

  /**
   * 获取状态
   */
  getState(): DramaWorkflowState {
    return { ...this.state };
  }
}

export const enhancedDramaWorkflowService = new EnhancedDramaWorkflowService();
export default EnhancedDramaWorkflowService;
