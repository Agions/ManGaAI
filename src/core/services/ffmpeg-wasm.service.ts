/**
 * FFmpeg.wasm 视频合成增强服务
 * 提供纯浏览器端视频合成能力，无需依赖本地 FFmpeg
 * 支持：视频合成、字幕添加、音频混音、视频导出
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import { logger } from '@/core/utils/logger';

// 类型定义
export interface Scene {
  id: string;
  mediaPath: string;
  mediaType: 'video' | 'image';
  startTime: number;
  duration: number;
  volume?: number;
  effects?: SceneEffect[];
}

export interface SceneEffect {
  type: 'fade_in' | 'fade_out' | 'zoom' | 'slide' | 'blur';
  duration: number;
  params?: Record<string, number | string>;
}

export interface SubtitleTrack {
  id: string;
  subtitles: Subtitle[];
}

export interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  font?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  position?: 'top' | 'center' | 'bottom';
  margin?: number;
}

export interface BackgroundMusic {
  path: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
}

export interface CompositionOptions {
  format?: 'mp4' | 'webm' | 'mov' | 'avi';
  videoCodec?: 'h264' | 'h265' | 'vp9' | 'av1';
  audioCodec?: 'aac' | 'mp3' | 'opus' | 'flac';
  bitrate?: string;
  fps?: number;
  resolution?: { width: number; height: number };
  masterVolume?: number;
}

export interface CompositionResult {
  outputPath: string;
  outputBlob?: Blob;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
}

export interface ExportProgress {
  progress: number;
  status: 'preparing' | 'loading' | 'processing' | 'encoding' | 'completed' | 'failed';
  message?: string;
  eta?: number;
}

export type ProgressCallback = (progress: ExportProgress) => void;

// FFmpeg.wasm 核心实例
let ffmpeg: FFmpeg | null = null;
let ffmpegLoaded = false;

// 进度追踪
let currentProgressCallback: ProgressCallback | null = null;

// 获取 FFmpeg 实例（单例）
export async function getFFmpegInstance(): Promise<FFmpeg> {
  if (ffmpeg && ffmpegLoaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  // 设置日志处理器
  ffmpeg.on('log', ({ message }) => {
    logger.debug('[FFmpeg.wasm]', message);
  });

  // 设置进度处理器
  ffmpeg.on('progress', ({ progress, time }) => {
    if (currentProgressCallback) {
      currentProgressCallback({
        progress: Math.round(progress * 100),
        status: 'encoding',
        message: `处理中... ${Math.round(progress * 100)}%`,
        eta: time > 0 ? Math.round((1 - progress) * time / 1000) : undefined,
      });
    }
  });

  return ffmpeg;
}

// 加载 FFmpeg.wasm 核心文件
export async function loadFFmpeg(progressCallback?: ProgressCallback): Promise<boolean> {
  if (ffmpegLoaded) {
    return true;
  }

  try {
    progressCallback?.({
      progress: 0,
      status: 'loading',
      message: '正在加载 FFmpeg 核心...',
    });

    const ff = await getFFmpegInstance();

    // 使用 CDN 加载 FFmpeg core
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ff.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegLoaded = true;
    logger.info('[FFmpeg.wasm] 加载完成');

    progressCallback?.({
      progress: 100,
      status: 'completed',
      message: 'FFmpeg 加载完成',
    });

    return true;
  } catch (error) {
    logger.error('[FFmpeg.wasm] 加载失败:', error);
    progressCallback?.({
      progress: 0,
      status: 'failed',
      message: `加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
    return false;
  }
}

// 检查 FFmpeg.wasm 是否可用
export function isFFmpegWasmAvailable(): boolean {
  return typeof window !== 'undefined' && typeof SharedArrayBuffer !== 'undefined';
}

// 检查是否在 Tauri 环境中
function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window;
}

// 格式化时间
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 生成 SRT 字幕文件
function generateSRTFile(subtitles: Subtitle[]): string {
  const lines: string[] = [];

  subtitles.forEach((sub, index) => {
    lines.push(String(index + 1));
    lines.push(`${formatSRTTime(sub.startTime)} --> ${formatSRTTime(sub.endTime)}`);
    lines.push(sub.text);
    lines.push('');
  });

  return lines.join('\n');
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// 视频合成 - FFmpeg.wasm 实现
export async function composeVideoWithFFmpeg(
  scenes: Scene[],
  options: CompositionOptions = {},
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  currentProgressCallback = progressCallback || null;

  const ff = await getFFmpegInstance();

  progressCallback?.({
    progress: 5,
    status: 'preparing',
    message: '准备合成视频...',
  });

  const format = options.format || 'mp4';
  const fps = options.fps || 30;
  const resolution = options.resolution || { width: 1920, height: 1080 };

  // 注册输入文件
  const inputFiles: string[] = [];
  let totalDuration = 0;

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    progressCallback?.({
      progress: 5 + Math.round((i / scenes.length) * 20),
      status: 'processing',
      message: `加载媒体 ${i + 1}/${scenes.length}...`,
    });

    try {
      let inputName: string;

      if (scene.mediaType === 'image') {
        // 图片场景：需要转换为视频片段
        inputName = `input_image_${i}.png`;
        const imageData = await fetchFile(scene.mediaPath);
        await ff.writeFile(inputName, imageData);
      } else {
        // 视频场景
        inputName = `input_video_${i}.mp4`;
        const videoData = await fetchFile(scene.mediaPath);
        await ff.writeFile(inputName, videoData);
      }

      inputFiles.push(inputName);
      totalDuration += scene.duration;
    } catch (error) {
      logger.error(`[FFmpeg.wasm] 加载媒体失败 ${scene.mediaPath}:`, error);
      throw new Error(`无法加载媒体文件: ${scene.mediaPath}`);
    }
  }

  progressCallback?.({
    progress: 30,
    status: 'processing',
    message: '开始合成视频...',
  });

  // 构建 FFmpeg 命令
  // 对于连续场景，使用复杂 filter 进行合成
  const outputFile = `output.${format}`;

  if (scenes.every(s => s.mediaType === 'image')) {
    // 全是图片场景：使用 loop 和 concat
    const args: string[] = ['-y'];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      args.push('-loop', '1');
      args.push('-i', `input_image_${i}.png`);
      args.push('-t', scene.duration.toString());
    }

    // 构建 filter_complex
    const filters: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const scaleFilter = `scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2`;

      let filter = `[${i}:v]${scaleFilter}`;

      // 添加淡入淡出效果
      if (scene.effects) {
        for (const effect of scene.effects) {
          if (effect.type === 'fade_in') {
            filter += `,fade=t=in:d=${effect.duration}`;
          } else if (effect.type === 'fade_out') {
            filter += `,fade=t=out:d=${effect.duration}`;
          }
        }
      }

      filter += `[v${i}]`;
      filters.push(filter);
    }

    // 拼接所有视频
    let concatInput = '';
    for (let i = 0; i < scenes.length; i++) {
      concatInput += `[v${i}]`;
    }
    filters.push(`${concatInput}concat=n=${scenes.length}:v=1:a=0[outv]`);

    args.push('-filter_complex', filters.join(';'));
    args.push('-map', '[outv]');
    args.push('-c:v', 'libx264');
    args.push('-pix_fmt', 'yuv420p');
    args.push('-r', fps.toString());
    args.push('-t', totalDuration.toString());
    args.push(outputFile);

    logger.debug('[FFmpeg.wasm] 执行合成命令:', args);
    await ff.exec(args);
  } else {
    // 混合图片和视频场景
    // 使用 concat demuxer
    const args: string[] = ['-y'];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (scene.mediaType === 'image') {
        args.push('-loop', '1');
        args.push('-i', `input_image_${i}.png`);
      } else {
        args.push('-i', `input_video_${i}.mp4`);
      }
    }

    // 构建 concat filter
    let concatParts = '';
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneDuration = scene.duration;

      // 对每段进行缩放
      args.push('-filter_complex', `[${i}:v]scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS+${totalDuration}s/TB[v${i}]`);
    }

    for (let i = 0; i < scenes.length; i++) {
      concatParts += `[v${i}]`;
    }
    args.push('-filter_complex', `${concatParts}concat=n=${scenes.length}:v=1:a=0[outv]`);
    args.push('-map', '[outv]');
    args.push('-c:v', 'libx264');
    args.push('-t', totalDuration.toString());
    args.push(outputFile);

    logger.debug('[FFmpeg.wasm] 执行合成命令:', args);
    await ff.exec(args);
  }

  progressCallback?.({
    progress: 90,
    status: 'encoding',
    message: '生成输出文件...',
  });

  // 读取输出文件
  const data = await ff.readFile(outputFile);
  const blob = new Blob([data], { type: `video/${format}` });

  // 清理临时文件
  for (const file of inputFiles) {
    try {
      await ff.deleteFile(file);
    } catch {
      // 忽略清理错误
    }
  }
  try {
    await ff.deleteFile(outputFile);
  } catch {
    // 忽略清理错误
  }

  currentProgressCallback = null;

  return {
    outputPath: outputFile,
    outputBlob: blob,
    duration: totalDuration,
    width: resolution.width,
    height: resolution.height,
    fileSize: blob.size,
  };
}

// 添加字幕 - FFmpeg.wasm 实现
export async function addSubtitlesWithFFmpeg(
  videoBlob: Blob,
  subtitles: SubtitleTrack,
  _style: SubtitleStyle = {},
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  currentProgressCallback = progressCallback || null;

  const ff = await getFFmpegInstance();
  const outputPath = `video_with_subtitles.${outputFormat}`;

  progressCallback?.({
    progress: 10,
    status: 'preparing',
    message: '准备添加字幕...',
  });

  // 写入输入视频
  await ff.writeFile('input_video', await fetchFile(videoBlob));

  // 生成 SRT 字幕文件
  const srtContent = generateSRTFile(subtitles.subtitles);
  await ff.writeFile('subtitles.srt', new TextEncoder().encode(srtContent));

  progressCallback?.({
    progress: 30,
    status: 'processing',
    message: '烧录字幕...',
  });

  // 执行字幕烧录
  await ff.exec([
    '-y',
    '-i', 'input_video',
    '-vf', `subtitles=subtitles.srt:force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2'`,
    '-c:a', 'copy',
    outputPath,
  ]);

  progressCallback?.({
    progress: 90,
    status: 'encoding',
    message: '生成输出文件...',
  });

  // 读取输出
  const data = await ff.readFile(outputPath);
  const resultBlob = new Blob([data], { type: `video/${outputFormat}` });

  // 清理
  await ff.deleteFile('input_video');
  await ff.deleteFile('subtitles.srt');
  await ff.deleteFile(outputPath);

  currentProgressCallback = null;

  return { resultBlob, outputPath };
}

// 添加背景音乐 - FFmpeg.wasm 实现
export async function addBackgroundMusicWithFFmpeg(
  videoBlob: Blob,
  musicPath: string,
  options: {
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
    loop?: boolean;
  } = {},
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  currentProgressCallback = progressCallback || null;

  const ff = await getFFmpegInstance();
  const outputPath = `video_with_music.${outputFormat}`;

  progressCallback?.({
    progress: 10,
    status: 'preparing',
    message: '准备添加背景音乐...',
  });

  // 写入输入视频
  await ff.writeFile('input_video', await fetchFile(videoBlob));

  // 写入音频文件
  const musicData = await fetchFile(musicPath);
  const musicExt = musicPath.split('.').pop() || 'mp3';
  await ff.writeFile(`background_music.${musicExt}`, musicData);

  progressCallback?.({
    progress: 40,
    status: 'processing',
    message: '混音处理...',
  });

  const volume = options.volume ?? 0.3;
  const fadeIn = options.fadeIn ?? 2;
  const fadeOut = options.fadeOut ?? 2;

  // 构建音频滤镜
  const audioFilter = `[1:a]volume=${volume},afade=t=in:d=${fadeIn},afade=t=out:st=-${fadeOut}:d=${fadeOut}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]`;

  await ff.exec([
    '-y',
    '-i', 'input_video',
    '-i', `background_music.${musicExt}`,
    '-filter_complex', audioFilter,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    outputPath,
  ]);

  progressCallback?.({
    progress: 90,
    status: 'encoding',
    message: '生成输出文件...',
  });

  // 读取输出
  const data = await ff.readFile(outputPath);
  const resultBlob = new Blob([data], { type: `video/${outputFormat}` });

  // 清理
  await ff.deleteFile('input_video');
  await ff.deleteFile(`background_music.${musicExt}`);
  await ff.deleteFile(outputPath);

  currentProgressCallback = null;

  return { resultBlob, outputPath };
}

// 导出视频 - FFmpeg.wasm 实现
export async function exportVideoWithFFmpeg(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: {
    bitrate?: string;
    fps?: number;
    resolution?: { width: number; height: number };
  } = {},
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  currentProgressCallback = progressCallback || null;

  const ff = await getFFmpegInstance();
  const outputPath = `exported.${outputFormat}`;

  progressCallback?.({
    progress: 10,
    status: 'preparing',
    message: '准备导出视频...',
  });

  // 写入输入
  await ff.writeFile('input', await fetchFile(inputBlob));

  progressCallback?.({
    progress: 30,
    status: 'processing',
    message: '转码中...',
  });

  const args = ['-y', '-i', 'input'];

  // 添加视频滤镜
  const filters: string[] = [];
  if (options.resolution) {
    filters.push(`scale=${options.resolution.width}:${options.resolution.height}`);
  }
  if (options.fps) {
    filters.push(`fps=${options.fps}`);
  }

  if (filters.length > 0) {
    args.push('-vf', filters.join(','));
  }

  // 添加编码参数
  if (outputFormat === 'mp4') {
    args.push('-c:v', 'libx264');
    args.push('-preset', 'fast');
    if (options.bitrate) {
      args.push('-b:v', options.bitrate);
    }
  } else {
    args.push('-c:v', 'libvpx-vp9');
    if (options.bitrate) {
      args.push('-b:v', options.bitrate);
    }
  }

  args.push('-c:a', 'aac');
  args.push(outputPath);

  await ff.exec(args);

  progressCallback?.({
    progress: 90,
    status: 'encoding',
    message: '生成输出文件...',
  });

  // 读取输出
  const data = await ff.readFile(outputPath);
  const resultBlob = new Blob([data], { type: `video/${outputFormat}` });

  // 清理
  await ff.deleteFile('input');
  await ff.deleteFile(outputPath);

  currentProgressCallback = null;

  return { resultBlob, outputPath };
}

// 合并多个视频 - FFmpeg.wasm 实现
export async function concatenateVideosWithFFmpeg(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<{ resultBlob: Blob; outputPath: string }> {
  currentProgressCallback = progressCallback || null;

  const ff = await getFFmpegInstance();
  const outputPath = `concatenated.${outputFormat}`;

  progressCallback?.({
    progress: 10,
    status: 'preparing',
    message: '准备合并视频...',
  });

  // 写入所有输入视频
  for (let i = 0; i < videoBlobs.length; i++) {
    progressCallback?.({
      progress: 10 + Math.round((i / videoBlobs.length) * 30),
      status: 'loading',
      message: `加载视频 ${i + 1}/${videoBlobs.length}...`,
    });
    await ff.writeFile(`input_${i}`, await fetchFile(videoBlobs[i]));
  }

  progressCallback?.({
    progress: 45,
    status: 'processing',
    message: '合并视频...',
  });

  // 使用 concat demuxer
  const concatList = videoBlobs.map((_, i) => `file 'input_${i}'`).join('\n');
  await ff.writeFile('concat.txt', new TextEncoder().encode(concatList));

  await ff.exec([
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    outputPath,
  ]);

  progressCallback?.({
    progress: 90,
    status: 'encoding',
    message: '生成输出文件...',
  });

  // 读取输出
  const data = await ff.readFile(outputPath);
  const resultBlob = new Blob([data], { type: `video/${outputFormat}` });

  // 清理
  for (let i = 0; i < videoBlobs.length; i++) {
    await ff.deleteFile(`input_${i}`);
  }
  await ff.deleteFile('concat.txt');
  await ff.deleteFile(outputPath);

  currentProgressCallback = null;

  return { resultBlob, outputPath };
}

// 获取视频信息
export async function getVideoInfoFromBlob(blob: Blob): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30, // 估算值
        codec: 'unknown',
        bitrate: 0,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('无法读取视频信息'));
    };

    video.src = URL.createObjectURL(blob);
  });
}

// 服务导出对象
export const ffmpegWasmService = {
  load: loadFFmpeg,
  isAvailable: isFFmpegWasmAvailable,
  compose: composeVideoWithFFmpeg,
  addSubtitles: addSubtitlesWithFFmpeg,
  addBackgroundMusic: addBackgroundMusicWithFFmpeg,
  export: exportVideoWithFFmpeg,
  concatenate: concatenateVideosWithFFmpeg,
  getVideoInfo: getVideoInfoFromBlob,
  getInstance: getFFmpegInstance,
};

export default ffmpegWasmService;
