/**
 * 视频合成服务 - 支持 FFmpeg.wasm 和 Tauri 两种模式
 * 
 * 特性：
 * - FFmpeg.wasm: 纯浏览器端视频合成，无需本地 FFmpeg
 * - Tauri: 本地 FFmpeg 集成，适用于桌面应用
 * - 自动检测可用模式并使用最优方案
 */

import { fetchFile } from '@ffmpeg/util';
import { saveAs } from 'file-saver';

import { logger } from '@/core/utils/logger';

import {
  ffmpegWasmService,
  loadFFmpeg,
  isFFmpegWasmAvailable,
  type Scene,
  type SubtitleTrack,
  type SubtitleStyle,
  type BackgroundMusic,
  type CompositionOptions,
  type CompositionResult,
  type ExportProgress,
  type ProgressCallback,
} from './ffmpeg-wasm.service';

// 检查是否在 Tauri 环境中
function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window;
}

// 检查 FFmpeg.wasm 是否可用
function checkFFmpegWasmAvailable(): boolean {
  return isFFmpegWasmAvailable();
}

// 初始化 FFmpeg.wasm
let ffmpegInitialized = false;

export async function initializeVideoCompositor(
  progressCallback?: ProgressCallback
): Promise<boolean> {
  // 如果是 Tauri 环境，使用本地 FFmpeg
  if (isTauri()) {
    logger.info('[VideoCompositor] 使用 Tauri 模式');
    return true;
  }

  // 检查浏览器是否支持 FFmpeg.wasm
  if (!checkFFmpegWasmAvailable()) {
    logger.warn('[VideoCompositor] 当前环境不支持 FFmpeg.wasm (需要 SharedArrayBuffer)');
    return false;
  }

  // 尝试加载 FFmpeg.wasm
  try {
    progressCallback?.({
      progress: 0,
      status: 'loading',
      message: '正在加载 FFmpeg.wasm...',
    });

    const loaded = await loadFFmpeg(progressCallback);
    ffmpegInitialized = loaded;

    if (loaded) {
      logger.info('[VideoCompositor] FFmpeg.wasm 初始化成功');
    }

    return loaded;
  } catch (error) {
    logger.error('[VideoCompositor] FFmpeg.wasm 初始化失败:', error);
    return false;
  }
}

// 视频合成
export async function composeVideo(
  scenes: Scene[],
  options: CompositionOptions = {},
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  // Tauri 模式
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<CompositionResult>('compose_video', { scenes, options });
    } catch (error) {
      logger.error('[VideoCompositor] Tauri 调用失败:', error);
      throw error;
    }
  }

  // FFmpeg.wasm 模式
  if (checkFFmpegWasmAvailable()) {
    try {
      return await ffmpegWasmService.compose(scenes, options, progressCallback);
    } catch (error) {
      logger.error('[VideoCompositor] FFmpeg.wasm 合成失败:', error);
      throw error;
    }
  }

  // 无可用模式
  throw new Error('视频合成需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器');
}

// 添加字幕
export async function addSubtitles(
  videoBlob: Blob,
  subtitles: SubtitleTrack,
  style: SubtitleStyle = {},
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  // Tauri 模式
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<CompositionResult>('add_subtitles', {
        videoBlob,
        subtitles,
        style,
        outputPath: `output_with_subtitles.${outputFormat}`,
      });
    } catch (error) {
      logger.error('[VideoCompositor] Tauri 调用失败:', error);
      throw error;
    }
  }

  // FFmpeg.wasm 模式
  if (checkFFmpegWasmAvailable()) {
    try {
      const result = await ffmpegWasmService.addSubtitles(
        videoBlob,
        subtitles,
        style,
        outputFormat,
        progressCallback
      );
      return {
        outputPath: result.outputPath,
        outputBlob: result.resultBlob,
        duration: 0,
        width: 1920,
        height: 1080,
        fileSize: result.resultBlob.size,
      };
    } catch (error) {
      logger.error('[VideoCompositor] FFmpeg.wasm 添加字幕失败:', error);
      throw error;
    }
  }

  throw new Error('添加字幕需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器');
}

// 添加背景音乐
export async function addBackgroundMusic(
  videoBlob: Blob,
  music: BackgroundMusic,
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  // Tauri 模式
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<CompositionResult>('add_audio', {
        videoBlob,
        music,
        outputPath: `output_with_music.${outputFormat}`,
      });
    } catch (error) {
      logger.error('[VideoCompositor] Tauri 调用失败:', error);
      throw error;
    }
  }

  // FFmpeg.wasm 模式
  if (checkFFmpegWasmAvailable()) {
    try {
      const result = await ffmpegWasmService.addBackgroundMusic(
        videoBlob,
        music.path,
        {
          volume: music.volume,
          fadeIn: music.fadeIn,
          fadeOut: music.fadeOut,
          loop: music.loop,
        },
        outputFormat,
        progressCallback
      );
      return {
        outputPath: result.outputPath,
        outputBlob: result.resultBlob,
        duration: 0,
        width: 1920,
        height: 1080,
        fileSize: result.resultBlob.size,
      };
    } catch (error) {
      logger.error('[VideoCompositor] FFmpeg.wasm 添加音乐失败:', error);
      throw error;
    }
  }

  throw new Error('添加背景音乐需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器');
}

// 导出视频
export async function exportVideo(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: {
    bitrate?: string;
    fps?: number;
    resolution?: { width: number; height: number };
  } = {},
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  // Tauri 模式
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<CompositionResult>('export_video', {
        inputBlob,
        outputFormat,
        options,
      });
    } catch (error) {
      logger.error('[VideoCompositor] Tauri 调用失败:', error);
      throw error;
    }
  }

  // FFmpeg.wasm 模式
  if (checkFFmpegWasmAvailable()) {
    try {
      const result = await ffmpegWasmService.export(
        inputBlob,
        outputFormat,
        options,
        progressCallback
      );
      return {
        outputPath: result.outputPath,
        outputBlob: result.resultBlob,
        duration: 0,
        width: options.resolution?.width || 1920,
        height: options.resolution?.height || 1080,
        fileSize: result.resultBlob.size,
      };
    } catch (error) {
      logger.error('[VideoCompositor] FFmpeg.wasm 导出失败:', error);
      throw error;
    }
  }

  throw new Error('导出视频需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器');
}

// 合并多个视频
export async function concatenateVideos(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  // Tauri 模式
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<CompositionResult>('concat_videos', {
        videoBlobs,
        outputPath: `concatenated.${outputFormat}`,
      });
    } catch (error) {
      logger.error('[VideoCompositor] Tauri 调用失败:', error);
      throw error;
    }
  }

  // FFmpeg.wasm 模式
  if (checkFFmpegWasmAvailable()) {
    try {
      const result = await ffmpegWasmService.concatenate(
        videoBlobs,
        outputFormat,
        progressCallback
      );
      return {
        outputPath: result.outputPath,
        outputBlob: result.resultBlob,
        duration: 0,
        width: 1920,
        height: 1080,
        fileSize: result.resultBlob.size,
      };
    } catch (error) {
      logger.error('[VideoCompositor] FFmpeg.wasm 合并失败:', error);
      throw error;
    }
  }

  throw new Error('合并视频需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器');
}

// 获取导出进度（仅 Tauri 模式）
export async function getExportProgress(): Promise<ExportProgress> {
  if (!isTauri()) {
    return {
      progress: 100,
      status: 'completed',
    };
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<ExportProgress>('get_export_progress');
  } catch {
    return {
      progress: 100,
      status: 'completed',
    };
  }
}

// 取消导出
export async function cancelExport(): Promise<void> {
  if (!isTauri()) return;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('cancel_export');
  } catch {
    // 忽略
  }
}

// 提取帧
export async function extractFrames(
  videoBlob: Blob,
  fps: number = 1
): Promise<string[]> {
  // FFmpeg.wasm 模式
  if (checkFFmpegWasmAvailable()) {
    try {
      const ff = await ffmpegWasmService.getInstance();
      const inputName = 'input_video.mp4';
      const frameDir = 'frames';

      await ff.writeFile(inputName, await fetchFile(videoBlob));

      // 创建帧输出目录
      await ff.createDir?.(frameDir).catch(() => {
        // 目录可能已存在
      });

      // 提取帧
      await ff.exec([
        '-i', inputName,
        '-vf', `fps=${fps}`,
        `${frameDir}/frame_%04d.png`,
      ]);

      // 读取帧文件
      const frameFiles: string[] = [];
      let i = 1;
      while (true) {
        const frameName = `frame_${String(i).padStart(4, '0')}.png`;
        try {
          const data = await ff.readFile(`${frameDir}/${frameName}`);
          const blob = new Blob([data], { type: 'image/png' });
          frameFiles.push(URL.createObjectURL(blob));
          i++;
        } catch {
          break;
        }
      }

      // 清理
      await ff.deleteFile(inputName);
      for (const frame of frameFiles) {
        URL.revokeObjectURL(frame);
      }

      return frameFiles;
    } catch (error) {
      logger.error('[VideoCompositor] FFmpeg.wasm 提取帧失败:', error);
      throw error;
    }
  }

  throw new Error('提取帧需要支持 SharedArrayBuffer 的浏览器');
}

// 获取视频信息
export async function getVideoInfo(
  videoBlob: Blob
): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}> {
  return ffmpegWasmService.getVideoInfo(videoBlob);
}

// 下载视频
export function downloadVideo(blob: Blob, fileName: string): void {
  saveAs(blob, fileName);
}

// 获取支持的功能
export function getSupportedFeatures(): {
  ffmpegWasm: boolean;
  tauri: boolean;
  sharedArrayBuffer: boolean;
} {
  return {
    ffmpegWasm: checkFFmpegWasmAvailable(),
    tauri: isTauri(),
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
  };
}

// 服务导出
export const videoCompositorService = {
  initialize: initializeVideoCompositor,
  compose: composeVideo,
  addSubtitles,
  addBackgroundMusic,
  export: exportVideo,
  concatenate: concatenateVideos,
  getProgress: getExportProgress,
  cancelExport,
  extractFrames,
  getVideoInfo,
  download: downloadVideo,
  getSupportedFeatures,
  isFFmpegWasmAvailable: checkFFmpegWasmAvailable,
  isTauriAvailable: isTauri,
};

export default videoCompositorService;
