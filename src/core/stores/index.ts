/**
 * Zustand Store 统一导出
 */

export { useAppStore } from './app.store';
export { useProjectStore } from './project.store';
export { useUserStore } from './user.store';
export { useWorkflowStore } from './workflow.store';
export { useVideoEditorStore } from './video-editor.store';

// Legacy store exports
export { useStore as useLegacyStore } from './legacy.store';

export type { AppState } from './app.store';
export type { ProjectState } from './project.store';
export type { UserState } from './user.store';
export type { WorkflowState } from './workflow.store';
export type { VideoEditorState, TimelineItem, SubtitleItem, VideoMarker, TimelineEffect } from './video-editor.store';

// 类型化 Hooks
export * from './hooks';
