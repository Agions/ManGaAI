/**
 * VideoEditor 类型定义
 */

import type { ScriptSegment } from '@/core/types';

// 组件 Props
export interface VideoEditorProps {
  videoPath: string;
  segments: ScriptSegment[];
  onEditComplete?: (outputPath: string | ScriptSegment[]) => void;
}

// 片段样式
export interface SegmentStyleProps {
  left: string;
  width: string;
  color: string;
}

// 转场效果类型
export type TransitionType = 'none' | 'fade' | 'dissolve' | 'wipe' | 'slide';

// 转场效果选项
export const transitionOptions = [
  { value: 'none', label: '无转场' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'dissolve', label: '交叉溶解' },
  { value: 'wipe', label: '擦除效果' },
  { value: 'slide', label: '滑动效果' }
];

// 视频质量选项
export const qualityOptions = [
  { value: 'low', label: '低质量 (720p)' },
  { value: 'medium', label: '中等质量 (1080p)' },
  { value: 'high', label: '高质量 (原始分辨率)' }
];

// 导出格式选项
export const formatOptions = [
  { value: 'mp4', label: 'MP4 格式' },
  { value: 'mov', label: 'MOV 格式' },
  { value: 'mkv', label: 'MKV 格式' }
];

// 导出设置
export interface ExportSettings {
  quality: string;
  format: string;
  useSubtitles: boolean;
  transitionType: TransitionType;
  transitionDuration: number;
  audioVolume: number;
}

// 默认导出设置
export const defaultExportSettings: ExportSettings = {
  quality: 'medium',
  format: 'mp4',
  useSubtitles: true,
  transitionType: 'fade',
  transitionDuration: 1,
  audioVolume: 100
};

// 拖拽状态
export interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'start' | 'end' | null;
  dragSegmentId: string | null;
}
