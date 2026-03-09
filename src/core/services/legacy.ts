/**
 * Legacy Services - 兼容层
 * 为旧代码提供向后兼容的导出
 */

export { tauriService } from './tauri.service';
export { aiService } from './ai.service';
export { videoService } from './video.service';
export { storageService } from './storage.service';
import { aiService as ai } from './ai.service';

// 重新导出旧接口兼容
export const getAppData = async (key: string) => {
  const { storageService: ss } = await import('./storage.service');
  return ss.get(key);
};

export const saveAppData = async (key: string, data: unknown) => {
  const { storageService: ss } = await import('./storage.service');
  return ss.set(key, data);
};

export const loadProjectFromFile = async (path: string) => {
  const { tauriService: ts } = await import('./tauri.service');
  return ts.readText(path);
};

export const saveProjectToFile = async (path: string, data: string) => {
  const { tauriService: ts } = await import('./tauri.service');
  return ts.writeText(path, data);
};

export const exportScriptToFile = async (path: string, content: string) => {
  const { tauriService: ts } = await import('./tauri.service');
  return ts.writeText(path, content);
};

export const getApiKey = async (): Promise<string> => {
  // AIService doesn't have getApiKey method, return empty string
  return '';
};

export const generateScriptWithModel = async (prompt: string, options?: {
  model: string;
  provider: string;
  signal?: AbortSignal;
  temperature?: number;
  max_tokens?: number;
}) => {
  return ai.generate(prompt, options || { model: 'default', provider: 'openai' });
};

export const parseGeneratedScript = (text: string) => {
  return { content: text, scenes: [] };
};

export interface VideoSegment {
  id?: string;
  start: number;
  end: number;
  type: string;
  content?: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  format: string;
  codec?: string;
}

export const extractKeyFrames = async (videoPath: string, count: number = 10) => {
  const { tauriService: ts } = await import('./tauri.service');
  return ts.generateThumbnails(videoPath, count);
};

export const generateThumbnail = async (videoPath: string, timestamp: number) => {
  return extractKeyFrames(videoPath, 1);
};

export const analyzeVideo = async (videoPath: string) => {
  const { tauriService: ts } = await import('./tauri.service');
  return ts.getVideoInfo(videoPath);
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatResolution = (width: number, height: number): string => {
  return `${width}x${height}`;
};

export const previewSegment = async (videoPath: string, start: number, end: number) => {
  const { tauriService: ts } = await import('./tauri.service');
  return ts.generatePreview({
    inputPath: videoPath,
    segment: { start, end, type: 'preview' }
  });
};

export type ExportFormat = 'json' | 'txt' | 'md' | 'srt';

export const exportScript = async (script: unknown, format: ExportFormat, path: string) => {
  const { tauriService: ts } = await import('./tauri.service');
  let content = '';

  switch (format) {
    case 'json':
      content = JSON.stringify(script, null, 2);
      break;
    case 'txt':
    case 'md':
      content = (script as any).content || '';
      break;
    case 'srt':
      content = (script as any).srt || '';
      break;
  }

  return ts.writeText(path, content);
};
