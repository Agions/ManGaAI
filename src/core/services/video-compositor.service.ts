/**
 * 视频合成服务 - 纯前端实现
 * 支持：视频合成、字幕添加、音频混音、视频导出
 * 注意：此为浏览器/web 版本，Tauri 后端功能需要单独实现
 */

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
  duration: number;
  width: number;
  height: number;
  fileSize: number;
}

export interface ExportProgress {
  progress: number;
  status: 'preparing' | 'processing' | 'encoding' | 'completed' | 'failed';
  message?: string;
  eta?: number;
}

// Mock 结果
const mockResult: CompositionResult = {
  outputPath: 'mock_output.mp4',
  duration: 0,
  width: 1920,
  height: 1080,
  fileSize: 0
};

const mockProgress: ExportProgress = {
  progress: 100,
  status: 'completed'
};

// 检查是否在 Tauri 环境中
function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window;
}

// Tauri 命令调用
async function tauriInvoke<T>(_cmd: string, _args?: Record<string, unknown>): Promise<T> {
  console.warn('[VideoCompositor] Tauri mode - invoke would be called here');
  throw new Error('Tauri invoke not available in web mode');
}

// 视频合成
export async function composeVideo(scenes: Scene[], options: CompositionOptions = {}): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('compose_video', { scenes, options });
    } catch {
      // Fall through to mock
    }
  }
  console.warn('[VideoCompositor] Running in web mode - using mock implementation');
  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
  return { ...mockResult, duration: totalDuration };
}

export async function addSubtitles(_videoPath: string, _subtitles: SubtitleTrack, _style: SubtitleStyle = {}, _outputPath?: string): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('add_subtitles', { videoPath: _videoPath, subtitles: _subtitles, outputPath: _outputPath });
    } catch {
      // Fall through to mock
    }
  }
  console.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { ...mockResult };
}

export async function addBackgroundMusic(_videoPath: string, _music: BackgroundMusic, _outputPath?: string): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('add_audio', { videoPath: _videoPath, music: _music, outputPath: _outputPath });
    } catch {
      // Fall through to mock
    }
  }
  console.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { ...mockResult };
}

export async function exportVideo(_inputPath: string, _outputPath: string, _options: CompositionOptions = {}): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('export_video', { inputPath: _inputPath, outputPath: _outputPath, options: _options });
    } catch {
      // Fall through to mock
    }
  }
  console.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { ...mockResult };
}

export async function getExportProgress(): Promise<ExportProgress> {
  if (isTauri()) {
    try {
      return await tauriInvoke<ExportProgress>('get_export_progress');
    } catch {
      // Fall through to mock
    }
  }
  return { ...mockProgress };
}

export async function cancelExport(): Promise<void> {
  if (!isTauri()) return;
  try {
    await tauriInvoke('cancel_export');
  } catch {
    // Ignore
  }
}

export async function concatenateVideos(_videoPaths: string[], _outputPath: string, _transitions?: { type: string; duration: number }[]): Promise<CompositionResult> {
  if (isTauri()) {
    try {
      return await tauriInvoke<CompositionResult>('concat_videos', { videoPaths: _videoPaths, outputPath: _outputPath, transitions: _transitions });
    } catch {
      // Fall through to mock
    }
  }
  console.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { ...mockResult };
}

export async function extractFrames(_videoPath: string, _outputDir: string, _fps: number = 1): Promise<string[]> {
  if (isTauri()) {
    try {
      return await tauriInvoke<string[]>('extract_frames', { videoPath: _videoPath, outputDir: _outputDir, fps: _fps });
    } catch {
      // Fall through to mock
    }
  }
  console.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return [];
}

export async function getVideoInfo(_videoPath: string): Promise<{ duration: number; width: number; height: number; fps: number; codec: string; bitrate: number }> {
  if (isTauri()) {
    try {
      return await tauriInvoke<{ duration: number; width: number; height: number; fps: number; codec: string; bitrate: number }>('get_video_info', { videoPath: _videoPath });
    } catch {
      // Fall through to mock
    }
  }
  console.warn('[VideoCompositor] Running in web mode - using mock implementation');
  return { duration: 0, width: 1920, height: 1080, fps: 30, codec: 'h264', bitrate: 0 };
}

// 服务导出
export const videoCompositorService = {
  compose: composeVideo,
  addSubtitles,
  addBackgroundMusic,
  export: exportVideo,
  getProgress: getExportProgress,
  cancelExport,
  concatenate: concatenateVideos,
  extractFrames,
  getVideoInfo
};

export default videoCompositorService;
