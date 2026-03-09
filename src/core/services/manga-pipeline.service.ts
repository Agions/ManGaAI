/**
 * 漫剧流水线服务 - Manga Pipeline Service
 * 整合图像生成、唇同步、视频合成服务
 */

import {
  generateImage,
  generateVideo,
  type ImageGenerationOptions,
  type VideoGenerationOptions,
  type VideoGenerationResult
} from './image-generation.service';

import {
  syncLip,
  generateTalkingHead,
  type LipSyncOptions,
  type TalkingFaceResult
} from './lip-sync.service';

import {
  composeVideo,
  addSubtitles,
  type Scene,
  type SubtitleTrack,
  type CompositionOptions
} from './video-compositor.service';

import { ttsService } from './tts.service';
import type { TTSConfig } from '@/core/types';

// ========== 类型定义 ==========

export interface PipelineConfig {
  image?: ImageGenerationOptions;
  video?: VideoGenerationOptions;
  tts?: Partial<TTSConfig>;
  lipSync?: LipSyncOptions;
  composition?: CompositionOptions;
}

export interface PipelineScene {
  id: string;
  description: string;
  imagePrompt: string;
  dialogue?: string;
  character?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  finalVideoUrl?: string;
  subtitles?: SubtitleTrack;
}

export interface PipelineResult {
  scenes: PipelineScene[];
  finalVideoUrl?: string;
  totalProcessingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface PipelineProgress {
  stage: 'analyzing' | 'generating_images' | 'generating_audio' | 'syncing_lips' | 'composing' | 'exporting' | 'completed' | 'failed';
  overallProgress: number;
  stageProgress: number;
  currentSceneIndex: number;
  totalScenes: number;
  message?: string;
}

// ========== 流水线服务 ==========

class MangaPipelineService {
  private config: PipelineConfig;
  private progressCallback?: (progress: PipelineProgress) => void;

  constructor(config: PipelineConfig = {}) {
    this.config = config;
  }

  onProgress(callback: (progress: PipelineProgress) => void): void {
    this.progressCallback = callback;
  }

  private updateProgress(stage: PipelineProgress['stage'], overallProgress: number, stageProgress: number, currentSceneIndex: number, totalScenes: number, message?: string): void {
    if (this.progressCallback) {
      this.progressCallback({ stage, overallProgress, stageProgress, currentSceneIndex, totalScenes, message });
    }
  }

  async generateFromNovel(
    _novelContent: string,
    scenes: Omit<PipelineScene, 'imageUrl' | 'videoUrl' | 'audioUrl' | 'finalVideoUrl'>[]
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const pipelineScenes: PipelineScene[] = [];
    const totalScenes = scenes.length;

    try {
      // 阶段 1: 生成图像
      this.updateProgress('generating_images', 10, 0, 0, totalScenes, '开始生成场景图像');

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        this.updateProgress('generating_images', 10 + (i / totalScenes) * 30, ((i + 1) / totalScenes) * 100, i, totalScenes, `生成场景 ${i + 1}: ${scene.description}`);

        const imageResult = await generateImage(scene.imagePrompt, {
          ...this.config.image,
          model: this.config.image?.model || 'seedream-5.0'
        });

        pipelineScenes.push({ ...scene, imageUrl: imageResult.url });
      }

      // 阶段 2: 生成音频
      this.updateProgress('generating_audio', 40, 0, 0, totalScenes, '开始生成语音');

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (!scene.dialogue) continue;

        this.updateProgress('generating_audio', 40 + (i / totalScenes) * 20, ((i + 1) / totalScenes) * 100, i, totalScenes, `生成语音 ${i + 1}`);

        const ttsResult = await ttsService.synthesize({
          text: scene.dialogue,
          config: { provider: 'edge', voice: 'zh-CN-XiaoxiaoNeural', speed: 1.0, pitch: 1.0, volume: 100, format: 'audio-24khz-48kbitrate-mono-mp3' }
        });

        pipelineScenes[i].audioUrl = "tts_audio_" + i;
      }

      // 阶段 3: 唇同步
      this.updateProgress('syncing_lips', 60, 0, 0, totalScenes, '开始唇同步');

      for (let i = 0; i < pipelineScenes.length; i++) {
        const scene = pipelineScenes[i];
        if (!scene.imageUrl || !scene.audioUrl) continue;

        this.updateProgress('syncing_lips', 60 + (i / totalScenes) * 20, ((i + 1) / totalScenes) * 100, i, totalScenes, `唇同步 ${i + 1}`);

        const lipSyncResult = await syncLip(scene.imageUrl, scene.audioUrl, this.config.lipSync);
        scene.videoUrl = lipSyncResult.url;
      }

      // 阶段 4: 合成视频
      this.updateProgress('composing', 80, 0, 0, totalScenes, '开始合成视频');

      const videoScenes: Scene[] = pipelineScenes
        .filter(s => s.videoUrl)
        .map((s, i) => ({
          id: s.id,
          mediaPath: s.videoUrl!,
          mediaType: 'video' as const,
          startTime: i * 5,
          duration: 5,
          volume: 1.0
        }));

      if (videoScenes.length > 0) {
        const composeResult = await composeVideo(videoScenes, this.config.composition);

        if (pipelineScenes.some(s => s.subtitles)) {
          const allSubtitles: SubtitleTrack = { id: 'main', subtitles: [] };
          pipelineScenes.forEach((scene, i) => {
            if (scene.subtitles) {
              scene.subtitles.subtitles.forEach(sub => {
                allSubtitles.subtitles.push({ ...sub, startTime: sub.startTime + i * 5, endTime: sub.endTime + i * 5 });
              });
            }
          });
          await addSubtitles(composeResult.outputPath, allSubtitles);
        }

        pipelineScenes.forEach(scene => { scene.finalVideoUrl = composeResult.outputPath; });
      }

      this.updateProgress('completed', 100, 100, totalScenes, totalScenes, '生成完成');

      return { scenes: pipelineScenes, finalVideoUrl: pipelineScenes[0]?.finalVideoUrl, totalProcessingTime: Date.now() - startTime, status: 'completed' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.updateProgress('failed', 100, 100, 0, 0, errorMessage);
      return { scenes: pipelineScenes, totalProcessingTime: Date.now() - startTime, status: 'failed', error: errorMessage };
    }
  }

  async generateFromImages(images: { url: string; prompt: string }[]): Promise<VideoGenerationResult[]> {
    const results: VideoGenerationResult[] = [];
    for (let i = 0; i < images.length; i++) {
      const { url, prompt } = images[i];
      this.updateProgress('generating_images', (i / images.length) * 100, 100, i, images.length, `生成视频 ${i + 1}`);
      const videoResult = await generateVideo(prompt, { ...this.config.video, model: this.config.video?.model || 'seedance-2.0', referenceImage: url });
      results.push(videoResult);
    }
    return results;
  }

  async generateTalkingVideo(imageUrl: string, audioUrl: string): Promise<TalkingFaceResult> {
    return generateTalkingHead(imageUrl, audioUrl);
  }
}

export const mangaPipelineService = new MangaPipelineService();
export { MangaPipelineService };
export default mangaPipelineService;
