/**
 * Tauri API 服务
 * 类型安全的 Tauri 命令封装
 */

import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { open, save, message, ask, confirm } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile, writeFile, exists, createDir, removeDir, readDir } from '@tauri-apps/api/fs';
import { appDir, appConfigDir, appDataDir, documentDir, videoDir, downloadDir } from '@tauri-apps/api/path';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/api/notification';
import { getCurrent } from '@tauri-apps/api/window';

// ========== 类型定义 ==========

// 文件选择选项
export interface OpenFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  multiple?: boolean;
  directory?: boolean;
}

// 保存文件选项
export interface SaveFileOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

// 视频剪辑选项
export interface VideoClipOptions {
  inputPath: string;
  outputPath: string;
  segments: Array<{
    start: number;
    end: number;
    type: string;
    content?: string;
  }>;
  quality: 'low' | 'medium' | 'high';
  format: string;
  transition?: string;
  transitionDuration?: number;
  volume?: number;
  addSubtitles?: boolean;
  [key: string]: unknown;
}

// 预览选项
export interface PreviewOptions {
  inputPath: string;
  segment: {
    start: number;
    end: number;
    type: string;
  };
  transition?: string;
  transitionDuration?: number;
  volume?: number;
  addSubtitles?: boolean;
  [key: string]: unknown;
}

// 导出选项
export interface ExportOptions {
  inputPath: string;
  outputPath: string;
  segments: Array<{
    start: number;
    end: number;
    type: string;
    content?: string;
  }>;
  quality: 'low' | 'medium' | 'high';
  format: string;
  transition?: string;
  transitionDuration?: number;
  volume?: number;
  addSubtitles?: boolean;
  exportId?: string;
}

// 导出进度事件
export interface ExportProgress {
  exportId: string;
  stage: 'preparing' | 'processing' | 'encoding' | 'finalizing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

// 导出进度回调
export type ExportProgressCallback = (progress: ExportProgress) => void;
export interface DirInfo {
  name: string;
  path: string;
  isDirectory: boolean;
}

// ========== 服务类 ==========

class TauriService {
  // ========== 窗口操作 ==========

  /**
   * 获取当前窗口
   */
  async getCurrent() {
    return getCurrent();
  }

  /**
   * 最小化窗口
   */
  async minimize() {
    const win = getCurrent();
    await win.minimize();
  }

  /**
   * 最大化/还原窗口
   */
  async toggleMaximize() {
    const win = getCurrent();
    const isMaximized = await win.isMaximized();
    if (isMaximized) {
      await win.unmaximize();
    } else {
      await win.maximize();
    }
  }

  /**
   * 关闭窗口
   */
  async close() {
    const win = getCurrent();
    await win.close();
  }

  /**
   * 设置窗口标题
   */
  async setTitle(title: string) {
    const win = getCurrent();
    await win.setTitle(title);
  }

  /**
   * 设置全屏
   */
  async setFullscreen(fullscreen: boolean) {
    const win = getCurrent();
    await win.setFullscreen(fullscreen);
  }

  /**
   * 设置置顶
   */
  async setAlwaysOnTop(alwaysOnTop: boolean) {
    const win = getCurrent();
    await win.setAlwaysOnTop(alwaysOnTop);
  }

  // ========== 文件操作 ==========

  /**
   * 打开文件选择对话框
   */
  async openFile(options?: OpenFileOptions): Promise<string | string[] | null> {
    const result = await open({
      title: options?.title || '选择文件',
      defaultPath: options?.defaultPath,
      filters: options?.filters,
      multiple: options?.multiple || false,
      directory: options?.directory || false
    });
    return result;
  }

  /**
   * 打开保存文件对话框
   */
  async saveFile(options?: SaveFileOptions): Promise<string | null> {
    const result = await save({
      title: options?.title || '保存文件',
      defaultPath: options?.defaultPath,
      filters: options?.filters
    });
    return result;
  }

  /**
   * 读取文本文件
   */
  async readText(filePath: string): Promise<string> {
    return readTextFile(filePath);
  }

  /**
   * 写入文本文件
   */
  async writeText(filePath: string, contents: string): Promise<void> {
    return writeTextFile(filePath, contents);
  }

  /**
   * 检查文件/目录是否存在
   */
  async fileExists(path: string): Promise<boolean> {
    return exists(path);
  }

  /**
   * 创建目录
   */
  async createDir(path: string): Promise<void> {
    return createDir(path, { recursive: true });
  }

  /**
   * 删除文件/目录
   */
  async removePath(path: string): Promise<void> {
    return removeDir(path, { recursive: true });
  }

  /**
   * 读取目录内容
   */
  async listDir(path: string): Promise<DirInfo[]> {
    const entries = await readDir(path);
    return entries.map(entry => ({
      name: entry.name,
      path: `${path}/${entry.name}`,
      isDirectory: (entry as any).isDirectory || (entry as any).is_directory || false
    }));
  }

  // ========== 路径操作 ==========

  /**
   * 获取应用目录
   */
  async getAppDir(): Promise<string> {
    return appDir();
  }

  /**
   * 获取应用配置目录
   */
  async getAppConfigDir(): Promise<string> {
    return appConfigDir();
  }

  /**
   * 获取应用数据目录
   */
  async getAppDataDir(): Promise<string> {
    return appDataDir();
  }

  /**
   * 获取文档目录
   */
  async getDocumentDir(): Promise<string | null> {
    return documentDir();
  }

  /**
   * 获取视频目录
   */
  async getVideoDir(): Promise<string | null> {
    return videoDir();
  }

  /**
   * 获取下载目录
   */
  async getDownloadDir(): Promise<string | null> {
    return downloadDir();
  }

  // ========== 对话框 ==========

  /**
   * 显示消息对话框
   */
  async showMessage(msg: string, options?: { title?: string; kind?: 'info' | 'warning' | 'error' }): Promise<void> {
    await message(msg, {
      title: options?.title || 'ManGa AI',
      type: options?.kind || 'info'
    });
  }

  /**
   * 显示确认对话框
   */
  async showConfirm(msg: string, title?: string): Promise<boolean> {
    return confirm(msg, { title: title || '确认' });
  }

  /**
   * 显示询问对话框
   */
  async showAsk(msg: string, title?: string): Promise<boolean> {
    return ask(msg, { title: title || '询问' });
  }

  // ========== 通知 ==========

  /**
   * 发送系统通知
   */
  async notify(title: string, body: string): Promise<void> {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
      await sendNotification({ title, body });
    }
  }

  // ========== 视频处理 ==========

  /**
   * 剪辑视频
   */
  async clipVideo(options: VideoClipOptions): Promise<void> {
    await invoke('cut_video', options);
  }

  /**
   * 生成预览
   */
  async generatePreview(options: PreviewOptions): Promise<string> {
    return invoke<string>('generate_preview', options);
  }

  /**
   * 导出视频（带进度回调）
   */
  async exportVideo(
    options: ExportOptions,
    onProgress?: ExportProgressCallback
  ): Promise<void> {
    const exportId = options.exportId || `export_${Date.now()}`;

    // 如果提供了回调，设置事件监听
    let unlisten: UnlistenFn | undefined;
    if (onProgress) {
      unlisten = await listen<ExportProgress>('export-progress', (event) => {
        if (event.payload.exportId === exportId) {
          onProgress({
            exportId: event.payload.exportId,
            stage: event.payload.stage as ExportProgress['stage'],
            progress: event.payload.progress,
            message: event.payload.message,
            error: event.payload.error,
          });
        }
      });
    }

    try {
      await invoke('export_video', {
        ...options,
        exportId,
      });
    } finally {
      // 清理事件监听
      if (unlisten) {
        unlisten();
      }
    }
  }

  /**
   * 监听导出进度事件
   */
  async onExportProgress(callback: ExportProgressCallback): Promise<UnlistenFn> {
    return listen<ExportProgress>('export-progress', (event) => {
      callback({
        exportId: event.payload.exportId,
        stage: event.payload.stage as ExportProgress['stage'],
        progress: event.payload.progress,
        message: event.payload.message,
        error: event.payload.error,
      });
    });
  }

  /**
   * 清理临时文件
   */
  async cleanTempFile(path: string): Promise<void> {
    await invoke('clean_temp_file', { path });
  }

  /**
   * 获取视频信息
   */
  async getVideoInfo(path: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    format: string;
  }> {
    return invoke('get_video_info', { path });
  }

  /**
   * 生成缩略图
   */
  async generateThumbnails(path: string, count: number): Promise<string[]> {
    return invoke<string[]>('generate_thumbnails', { path, count });
  }

  // ========== 窗口操作（通过 Rust 命令） ==========

  /**
   * 显示窗口
   */
  async showWindow(): Promise<void> {
    return invoke('show_window');
  }

  /**
   * 隐藏窗口
   */
  async hideWindow(): Promise<void> {
    return invoke('hide_window');
  }

  // ========== 全局快捷键 ==========

  /**
   * 注册全局快捷键
   * @param shortcut 快捷键，如 "CommandOrControl+Shift+M"
   * @param action 动作: "show" | "hide" | "toggle"
   */
  async registerGlobalShortcut(shortcut: string, action: 'show' | 'hide' | 'toggle'): Promise<void> {
    return invoke('register_global_shortcut', { shortcut, action });
  }

  /**
   * 注销全局快捷键
   */
  async unregisterGlobalShortcut(shortcut: string): Promise<void> {
    return invoke('unregister_global_shortcut', { shortcut });
  }

  /**
   * 检查快捷键是否已注册
   */
  async isGlobalShortcutRegistered(shortcut: string): Promise<boolean> {
    return invoke('is_global_shortcut_registered', { shortcut });
  }
}

// 导出单例
export const tauriService = new TauriService();
export default TauriService;
