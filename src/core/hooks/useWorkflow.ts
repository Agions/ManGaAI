/**
 * 工作流管理 Hook
 * 用于管理漫剧/解说工作流的状态
 */
import { useState, useCallback } from 'react';
import type { ScriptTemplate, AIModel, DramaWorkflowStep } from '@/core/types';

export type WorkflowStep =
  | 'upload'
  | 'analyze'
  | 'template-select'
  | 'script-generate'
  | 'script-dedup'
  | 'script-edit'
  | 'timeline-edit'
  | 'preview'
  | 'export';

export interface WorkflowState {
  step: WorkflowStep;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  error?: string;
  data: WorkflowData;
}

export interface WorkflowData {
  projectId?: string;
  script?: unknown;
  timeline?: unknown;
  exportUrl?: string;
  duplicates?: unknown[];
  suggestions?: unknown[];
  uniquenessReport?: unknown;
  uniqueScript?: unknown;
  videoAnalysis?: unknown;
  videoInfo?: unknown;
  editedScript?: unknown;
  generatedScript?: unknown;
  originalityReport?: unknown;
}

export interface WorkflowCallbacks {
  onStepChange?: (step: WorkflowStep) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

export interface WorkflowConfig {
  autoAnalyze?: boolean;
  autoGenerateScript?: boolean;
  preferredTemplate?: string;
}

export interface UseWorkflowReturn {
  state: WorkflowState;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  hasError: boolean;
  error?: string;
  currentStep: WorkflowStep;
  progress: number;
  data: WorkflowData;
  start: (projectId: string, file: File, config?: WorkflowConfig) => Promise<void>;
  analyze: () => Promise<void>;
  selectTemplate: (template: ScriptTemplate) => void;
  generateScript: (model: AIModel, params: unknown) => Promise<void>;
  dedupScript: () => Promise<void>;
  ensureUniqueness: (content: string) => Promise<{ isUnique: boolean; duplicates: unknown[]; suggestions: unknown[] }>;
  editScript: (content: string) => void;
  editTimeline: (timeline: unknown) => void;
  preview: () => Promise<void>;
  export: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  reset: () => void;
  jumpToStep: (step: WorkflowStep) => void;
}

export function useWorkflow(callbacks?: WorkflowCallbacks): UseWorkflowReturn {
  const [state, setState] = useState<WorkflowState>({
    step: 'upload',
    status: 'idle',
    progress: 0,
    data: {}
  });

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isCompleted = state.status === 'completed';
  const hasError = state.status === 'error';

  const updateStep = useCallback((step: WorkflowStep) => {
    setState(prev => ({ ...prev, step }));
    callbacks?.onStepChange?.(step);
  }, [callbacks]);

  const updateStatus = useCallback((status: WorkflowState['status'], error?: string) => {
    setState(prev => ({ ...prev, status, error }));
    if (status === 'error' && error) {
      callbacks?.onError?.(error);
    }
  }, [callbacks]);

  const start = useCallback(async (projectId: string, file: File, config?: WorkflowConfig) => {
    updateStatus('running');
    setState(prev => ({
      ...prev,
      data: { ...prev.data, projectId }
    }));

    if (config?.autoAnalyze) {
      await analyze();
    }
    if (config?.autoGenerateScript && config?.preferredTemplate) {
      updateStep('script-generate');
    }
  }, [updateStep, updateStatus]);

  const analyze = useCallback(async () => {
    updateStep('analyze');
    setState(prev => ({ ...prev, progress: 20 }));
  }, [updateStep]);

  const selectTemplate = useCallback((template: ScriptTemplate) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, script: prev.data.script }
    }));
    updateStep('template-select');
  }, [updateStep]);

  const generateScript = useCallback(async (model: AIModel, params: unknown) => {
    updateStep('script-generate');
    setState(prev => ({ ...prev, progress: 40 }));
  }, [updateStep]);

  const dedupScript = useCallback(async () => {
    updateStep('script-dedup');
    setState(prev => ({ ...prev, progress: 50 }));
  }, [updateStep]);

  const ensureUniqueness = useCallback(async (content: string) => {
    // 模拟去重检测
    return {
      isUnique: true,
      duplicates: [],
      suggestions: []
    };
  }, []);

  const editScript = useCallback((content: string) => {
    updateStep('script-edit');
    setState(prev => ({
      ...prev,
      data: { ...prev.data, script: { content } }
    }));
  }, [updateStep]);

  const editTimeline = useCallback((timeline: unknown) => {
    updateStep('timeline-edit');
    setState(prev => ({
      ...prev,
      data: { ...prev.data, timeline }
    }));
  }, [updateStep]);

  const preview = useCallback(async () => {
    updateStep('preview');
    setState(prev => ({ ...prev, progress: 80 }));
  }, [updateStep]);

  const exportFn = useCallback(async () => {
    updateStep('export');
    setState(prev => ({ ...prev, progress: 100, status: 'completed' }));
    callbacks?.onComplete?.();
  }, [updateStep, callbacks]);

  const pause = useCallback(() => {
    updateStatus('paused');
  }, [updateStatus]);

  const resume = useCallback(() => {
    updateStatus('running');
  }, [updateStatus]);

  const cancel = useCallback(() => {
    updateStatus('idle');
    setState(prev => ({ ...prev, progress: 0 }));
  }, [updateStatus]);

  const reset = useCallback(() => {
    setState({
      step: 'upload',
      status: 'idle',
      progress: 0,
      data: {}
    });
  }, []);

  const jumpToStep = useCallback((step: WorkflowStep) => {
    updateStep(step);
  }, [updateStep]);

  return {
    state,
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    error: state.error,
    currentStep: state.step,
    progress: state.progress,
    data: state.data,
    start,
    analyze,
    selectTemplate,
    generateScript,
    dedupScript,
    ensureUniqueness,
    editScript,
    editTimeline,
    preview,
    export: exportFn,
    pause,
    resume,
    cancel,
    reset,
    jumpToStep
  };
}
