/**
 * 桌面应用服务
 * 统一封装桌面应用相关的功能：窗口管理、系统托盘、快捷键、通知等
 */

import { appWindow as getCurrent } from '@tauri-apps/api/window';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/api/notification';

// 快捷键定义
export interface ShortcutDefinition {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description?: string;
}

// 托盘菜单项
export interface TrayMenuItem {
  id: string;
  label: string;
  enabled?: boolean;
  visible?: boolean;
  action?: () => void;
}

// 通知选项
export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  sound?: string;
}

// 窗口状态
export interface WindowState {
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  isAlwaysOnTop: boolean;
  isFocused: boolean;
  title: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
}

class DesktopAppService {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  private shortcutHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();

  /**
   * 窗口操作
   */

  /**
   * 获取当前窗口
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCurrentWindow(): Promise<any> {
    return getCurrent;
  }

  /**
   * 获取窗口状态
   */
  async getWindowState(): Promise<WindowState> {
    const window = getCurrent;

    const [isMaximized, isMinimized, isFullscreen, isFocused, title, size, position] = await Promise.all([
      window.isMaximized(),
      window.isMinimized(),
      window.isFullscreen(),
      window.isFocused(),
      window.title(),
      window.innerSize(),
      window.innerPosition(),
    ]);

    // isAlwaysOnTop may not be available in all Tauri versions
    let isAlwaysOnTop = false;
    try {
      isAlwaysOnTop = await (window as any).isAlwaysOnTop?.() ?? false;
    } catch {
      // Ignore error, default to false
    }

    return {
      isMaximized,
      isMinimized,
      isFullscreen,
      isAlwaysOnTop,
      isFocused,
      title,
      size: { width: size.width, height: size.height },
      position: { x: position.x, y: position.y },
    };
  }

  /**
   * 最小化窗口
   */
  async minimize(): Promise<void> {
    const window = getCurrent;
    await window.minimize();
  }

  /**
   * 最大化/还原窗口
   */
  async toggleMaximize(): Promise<void> {
    const window = getCurrent;
    const isMaximized = await window.isMaximized();

    if (isMaximized) {
      await window.unmaximize();
    } else {
      await window.maximize();
    }
  }

  /**
   * 设置全屏
   */
  async setFullscreen(fullscreen: boolean): Promise<void> {
    const window = getCurrent;
    await window.setFullscreen(fullscreen);
  }

  /**
   * 切换全屏
   */
  async toggleFullscreen(): Promise<void> {
    const window = getCurrent;
    const isFullscreen = await window.isFullscreen();
    await window.setFullscreen(!isFullscreen);
  }

  /**
   * 设置置顶
   */
  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    const window = getCurrent;
    await window.setAlwaysOnTop(alwaysOnTop);
  }

  /**
   * 切换置顶
   */
  async toggleAlwaysOnTop(): Promise<void> {
    const window = getCurrent;
    // isAlwaysOnTop may not be available in all Tauri versions
    let isOnTop = false;
    try {
      isOnTop = await (window as any).isAlwaysOnTop?.() ?? false;
    } catch {
      // Ignore error, default to false
    }
    await window.setAlwaysOnTop(!isOnTop);
  }

  /**
   * 设置窗口标题
   */
  async setTitle(title: string): Promise<void> {
    const window = getCurrent;
    await window.setTitle(title);
  }

  /**
   * 设置窗口大小
   */
  async setSize(width: number, height: number): Promise<void> {
    const window = getCurrent;
    await window.setSize({ width, height, type: 'Logical' });
  }

  /**
   * 设置窗口位置
   */
  async setPosition(x: number, y: number): Promise<void> {
    const window = getCurrent;
    await window.setPosition({ x, y, type: 'Logical' });
  }

  /**
   * 居中窗口
   */
  async center(): Promise<void> {
    const window = getCurrent;
    await window.center();
  }

  /**
   * 显示窗口
   */
  async show(): Promise<void> {
    const window = getCurrent;
    await window.show();
    await window.setFocus();
  }

  /**
   * 隐藏窗口
   */
  async hide(): Promise<void> {
    const window = getCurrent;
    await window.hide();
  }

  /**
   * 关闭窗口
   */
  async close(): Promise<void> {
    const window = getCurrent;
    await window.close();
  }

  /**
   * 退出应用
   */
  async quit(): Promise<void> {
    const window = getCurrent;
    await window.close();
  }

  /**
   * 请求用户关注
   */
  async requestAttention(bounce: boolean = true): Promise<void> {
    const window = getCurrent;
    // Use number type for UserAttentionType in Tauri 1.x: 1 = critical, 0 = informational
    await (window as any).requestUserAttention(bounce ? 1 : 0);
  }

  /**
   * 通知功能
   */

  /**
   * 检查通知权限
   */
  async checkNotificationPermission(): Promise<boolean> {
    return await isPermissionGranted();
  }

  /**
   * 请求通知权限
   */
  async requestNotificationPermission(): Promise<boolean> {
    const permission = await requestPermission();
    return permission === 'granted';
  }

  /**
   * 发送通知
   */
  async sendNotification(options: NotificationOptions): Promise<void> {
    const hasPermission = await this.checkNotificationPermission();

    if (!hasPermission) {
      const granted = await this.requestNotificationPermission();
      if (!granted) {
        console.warn('通知权限被拒绝');
        return;
      }
    }

    await sendNotification({
      title: options.title,
      body: options.body,
    });
  }

  /**
   * 发送成功通知
   */
  async notifySuccess(message: string, title: string = '操作成功'): Promise<void> {
    await this.sendNotification({ title, body: message });
  }

  /**
   * 发送错误通知
   */
  async notifyError(message: string, title: string = '操作失败'): Promise<void> {
    await this.sendNotification({ title, body: message });
  }

  /**
   * 发送信息通知
   */
  async notifyInfo(message: string, title: string = '提示'): Promise<void> {
    await this.sendNotification({ title, body: message });
  }

  /**
   * 快捷键功能
   */

  /**
   * 注册快捷键（前端模拟实现）
   * 注意：Tauri 1.x 的全局快捷键需要在 Rust 端注册
   * 这里提供前端快捷键监听
   */
  registerShortcut(shortcut: ShortcutDefinition): void {
    const key = this.generateShortcutKey(shortcut.key, shortcut.modifiers);
    this.shortcuts.set(key, shortcut);

    const handler = (event: KeyboardEvent) => {
      if (this.matchShortcut(event, shortcut)) {
        event.preventDefault();
        shortcut.action();
      }
    };

    this.shortcutHandlers.set(key, handler);
    document.addEventListener('keydown', handler);
  }

  /**
   * 注销快捷键
   */
  unregisterShortcut(key: string, modifiers?: string[]): void {
    const shortcutKey = this.generateShortcutKey(key, modifiers);
    const handler = this.shortcutHandlers.get(shortcutKey);

    if (handler) {
      document.removeEventListener('keydown', handler);
      this.shortcutHandlers.delete(shortcutKey);
      this.shortcuts.delete(shortcutKey);
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterAllShortcuts(): void {
    this.shortcutHandlers.forEach((handler) => {
      document.removeEventListener('keydown', handler);
    });
    this.shortcutHandlers.clear();
    this.shortcuts.clear();
  }

  /**
   * 匹配快捷键
   */
  private matchShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
    const key = event.key.toLowerCase();
    const targetKey = shortcut.key.toLowerCase();

    if (key !== targetKey) {
      return false;
    }

    const modifiers = shortcut.modifiers || [];
    const requiredModifiers = ['ctrl', 'shift', 'alt', 'meta'];

    for (const mod of requiredModifiers) {
      const eventMod = mod === 'ctrl' ? 'control' : mod;
      const isRequired = modifiers.includes(mod as any);
      const isPressed = event.getModifierState(eventMod);

      if (isRequired && !isPressed) {
        return false;
      }
      if (!isRequired && isPressed && mod !== 'shift') {
        // Shift 经常被意外按下，排除它
        return false;
      }
    }

    return true;
  }

  /**
   * 生成快捷键标识
   */
  private generateShortcutKey(key: string, modifiers?: string[]): string {
    const mods = modifiers ? modifiers.sort().join('+') : '';
    return `${mods}${mods ? '+' : ''}${key}`.toLowerCase();
  }

  /**
   * 文件拖放
   */

  /**
   * 启用文件拖放
   * Note: setFileDropEnabled is not available in Tauri 1.5
   */
  async enableFileDrop(): Promise<void> {
    // Not available in Tauri 1.5 - file drop handling is done via webview events
  }

  /**
   * 禁用文件拖放
   * Note: setFileDropEnabled is not available in Tauri 1.5
   */
  async disableFileDrop(): Promise<void> {
    // Not available in Tauri 1.5 - file drop handling is done via webview events
  }

  /**
   * 监听文件拖放事件
   */
  async onFileDrop(callback: (paths: string[]) => void): Promise<() => void> {
    const window = getCurrent;

    const unlisten = await window.onFileDropEvent((event) => {
      if (event.payload.type === 'drop') {
        callback(event.payload.paths);
      }
    });

    return unlisten;
  }

  /**
   * 应用信息
   */

  /**
   * 获取应用版本
   */
  getAppVersion(): string {
    return '2.1.0';
  }

  /**
   * 获取应用名称
   */
  getAppName(): string {
    return 'ManGa AI';
  }

  /**
   * 平台检测
   */
  getPlatform(): 'windows' | 'macos' | 'linux' | 'unknown' {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';

    return 'unknown';
  }

  /**
   * 是否为 macOS
   */
  isMacOS(): boolean {
    return this.getPlatform() === 'macos';
  }

  /**
   * 是否为 Windows
   */
  isWindows(): boolean {
    return this.getPlatform() === 'windows';
  }
}

export const desktopAppService = new DesktopAppService();
export default desktopAppService;
