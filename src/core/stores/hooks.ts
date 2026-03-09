/**
 * 类型化 Store Hooks
 * 提供更好的 TypeScript 类型推断
 */

import { useAppStore, useProjectStore, useUserStore, useWorkflowStore } from './index';
import { useShallow } from 'zustand/react/shallow';

// ==================== App Store Hooks ====================

/**
 * UI 状态 hooks
 */
export const useUI = () => useAppStore(
  useShallow(state => ({
    sidebarCollapsed: state.sidebarCollapsed,
    theme: state.theme,
    language: state.language,
    isLoading: state.isLoading,
    loadingMessage: state.loadingMessage,
    toggleSidebar: state.toggleSidebar,
    setTheme: state.setTheme,
    setLanguage: state.setLanguage,
    setLoading: state.setLoading,
  }))
);

/**
 * 通知 hooks
 */
export const useNotifications = () => useAppStore(
  useShallow(state => ({
    notifications: state.notifications,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearAllNotifications: state.clearAllNotifications,
  }))
);

/**
 * 当前项目 hooks
 */
export const useCurrentProject = () => useAppStore(
  useShallow(state => ({
    currentProjectId: state.currentProjectId,
    currentModel: state.currentModel,
    setCurrentProject: state.setCurrentProject,
    setCurrentModel: state.setCurrentModel,
  }))
);

// ==================== Project Store Hooks ====================

/**
 * 项目列表 hooks
 */
export const useProjects = () => useProjectStore(
  useShallow(state => ({
    projects: state.projects,
    currentProject: state.currentProject,
    filteredProjects: state.filteredProjects(),
    recentProjects: state.recentProjects(),
  }))
);

/**
 * 项目过滤和排序 hooks
 */
export const useProjectFilters = () => useProjectStore(
  useShallow(state => ({
    searchQuery: state.searchQuery,
    filterStatus: state.filterStatus,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    setSearchQuery: state.setSearchQuery,
    setFilterStatus: state.setFilterStatus,
    setSortBy: state.setSortBy,
    setSortOrder: state.setSortOrder,
  }))
);

/**
 * 项目 CRUD hooks
 */
export const useProjectActions = () => useProjectStore(
  useShallow(state => ({
    createProject: state.createProject,
    updateProject: state.updateProject,
    deleteProject: state.deleteProject,
    setCurrentProject: state.setCurrentProject,
    loadProject: state.loadProject,
  }))
);

/**
 * 脚本操作 hooks
 */
export const useScriptActions = () => useProjectStore(
  useShallow(state => ({
    addScript: state.addScript,
    updateScript: state.updateScript,
    deleteScript: state.deleteScript,
  }))
);

/**
 * 视频操作 hooks
 */
export const useVideoActions = () => useProjectStore(
  useShallow(state => ({
    addVideo: state.addVideo,
    removeVideo: state.removeVideo,
  }))
);

/**
 * 导出历史 hooks
 */
export const useExportHistory = () => useProjectStore(
  useShallow(state => ({
    exportHistory: state.exportHistory,
    addExportRecord: state.addExportRecord,
    clearExportHistory: state.clearExportHistory,
  }))
);

// ==================== User Store Hooks ====================

/**
 * 用户信息 hooks
 */
export const useUser = () => useUserStore(
  useShallow(state => ({
    userId: state.userId,
    username: state.username,
    email: state.email,
    avatar: state.avatar,
    setUser: state.setUser,
    clearUser: state.clearUser,
  }))
);

/**
 * 用户偏好设置 hooks
 */
export const usePreferences = () => useUserStore(
  useShallow(state => ({
    preferences: state.preferences,
    updatePreferences: state.updatePreferences,
    resetPreferences: state.resetPreferences,
  }))
);

/**
 * API 设置 hooks
 */
export const useApiSettings = () => useUserStore(
  useShallow(state => ({
    apiSettings: state.apiSettings,
    setApiSettings: state.setApiSettings,
    removeApiSettings: state.removeApiSettings,
    getApiSettings: state.getApiSettings,
  }))
);

/**
 * 最近文件 hooks
 */
export const useRecentFiles = () => useUserStore(
  useShallow(state => ({
    recentFiles: state.recentFiles,
    addRecentFile: state.addRecentFile,
    removeRecentFile: state.removeRecentFile,
    clearRecentFiles: state.clearRecentFiles,
  }))
);

// ==================== Workflow Store Hooks ====================

/**
 * 工作流状态 hooks
 */
export const useWorkflow = () => useWorkflowStore(
  useShallow(state => ({
    currentStep: state.currentStep,
    status: state.status,
    progress: state.progress,
    steps: state.steps,
  }))
);

/**
 * 工作流控制 hooks
 */
export const useWorkflowControls = () => useWorkflowStore(
  useShallow(state => ({
    startWorkflow: state.startWorkflow,
    pauseWorkflow: state.pauseWorkflow,
    resumeWorkflow: state.resumeWorkflow,
    cancelWorkflow: state.cancelWorkflow,
    resetWorkflow: state.resetWorkflow,
    nextStep: state.nextStep,
    previousStep: state.previousStep,
    goToStep: state.goToStep,
  }))
);

/**
 * 工作流步骤数据 hooks
 */
export const useWorkflowData = () => useWorkflowStore(
  useShallow(state => ({
    getStepData: state.getStepData,
    updateStepData: state.updateStepData,
    getCurrentStepData: state.getCurrentStepData,
    updateCurrentStepData: state.updateCurrentStepData,
    validateStep: state.validateStep,
  }))
);

/**
 * 工作流历史 hooks (撤销/重做)
 */
export const useWorkflowHistory = () => useWorkflowStore(
  useShallow(state => ({
    history: state.history,
    historyIndex: state.historyIndex,
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo(),
    canRedo: state.canRedo(),
  }))
);

export default {
  // App
  useUI,
  useNotifications,
  useCurrentProject,
  // Project
  useProjects,
  useProjectFilters,
  useProjectActions,
  useScriptActions,
  useVideoActions,
  useExportHistory,
  // User
  useUser,
  usePreferences,
  useApiSettings,
  useRecentFiles,
  // Workflow
  useWorkflow,
  useWorkflowControls,
  useWorkflowData,
  useWorkflowHistory,
};
