import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 工作流步骤类型
export type WorkflowStep = 'import' | 'generate' | 'storyboard' | 'character' | 'render' | 'compose' | 'export';

// 工作流状态类型
export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

// 单个步骤的状态
export interface StepState {
  step: WorkflowStep;
  status: WorkflowStatus;
  progress: number; // 0-100
  data: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

// 历史记录项
export interface HistoryItem {
  step: WorkflowStep;
  timestamp: string;
  data: Record<string, unknown>;
}

// 工作流完整状态
export interface WorkflowState {
  // 当前工作流
  currentStep: WorkflowStep;
  status: WorkflowStatus;
  progress: number; // 总体进度 0-100

  // 各步骤状态
  steps: Record<WorkflowStep, StepState>;

  // 历史记录（用于撤销）
  history: HistoryItem[];
  historyIndex: number;

  // Actions
  startWorkflow: (step?: WorkflowStep) => void;
  setStepProgress: (step: WorkflowStep, progress: number) => void;
  completeStep: (step: WorkflowStep, data?: Record<string, unknown>) => void;
  goToStep: (step: WorkflowStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  pauseWorkflow: () => void;
  resumeWorkflow: () => void;
  cancelWorkflow: () => void;
  resetWorkflow: () => void;

  // 撤销/重做
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // 步骤数据操作
  getStepData: <T>(step: WorkflowStep) => T | null;
  updateStepData: (step: WorkflowStep, data: Partial<Record<string, unknown>>) => void;
  getCurrentStepData: <T>() => T | null;
  updateCurrentStepData: (data: Partial<Record<string, unknown>>) => void;

  // 验证
  validateStep: (step: WorkflowStep) => { valid: boolean; errors: string[] };
}

// 步骤顺序
const STEP_ORDER: WorkflowStep[] = [
  'import',
  'generate',
  'storyboard',
  'character',
  'render',
  'compose',
  'export'
];

// 初始化步骤状态
const createInitialSteps = (): Record<WorkflowStep, StepState> => {
  return STEP_ORDER.reduce((acc, step) => ({
    ...acc,
    [step]: {
      step,
      status: 'idle',
      progress: 0,
      data: {}
    }
  }), {} as Record<WorkflowStep, StepState>);
};

// 获取下一步
const getNextStep = (current: WorkflowStep): WorkflowStep | null => {
  const currentIndex = STEP_ORDER.indexOf(current);
  return currentIndex < STEP_ORDER.length - 1 ? STEP_ORDER[currentIndex + 1] : null;
};

// 获取上一步
const getPreviousStep = (current: WorkflowStep): WorkflowStep | null => {
  const currentIndex = STEP_ORDER.indexOf(current);
  return currentIndex > 0 ? STEP_ORDER[currentIndex - 1] : null;
};

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      currentStep: 'import',
      status: 'idle',
      progress: 0,

      steps: createInitialSteps(),

      history: [],
      historyIndex: -1,

      startWorkflow: (step) => {
        const targetStep = step || 'import';
        set((state) => ({
          status: 'running',
          currentStep: targetStep,
          steps: {
            ...state.steps,
            [targetStep]: {
              ...state.steps[targetStep],
              status: 'running',
              startedAt: new Date().toISOString()
            }
          }
        }));
      },

      setStepProgress: (step, progress) => {
        set((state) => ({
          steps: {
            ...state.steps,
            [step]: {
              ...state.steps[step],
              progress: Math.min(100, Math.max(0, progress))
            }
          },
          // 计算总体进度
          progress: state.currentStep === step
            ? (STEP_ORDER.indexOf(step) * 100 + progress) / STEP_ORDER.length
            : state.progress
        }));
      },

      completeStep: (step, data) => {
        const nextStep = getNextStep(step);
        const stepIndex = STEP_ORDER.indexOf(step);

        set((state) => {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push({
            step,
            timestamp: new Date().toISOString(),
            data: state.steps[step].data
          });

          return {
            steps: {
              ...state.steps,
              [step]: {
                ...state.steps[step],
                status: 'completed',
                progress: 100,
                completedAt: new Date().toISOString(),
                ...(data ? { data: { ...state.steps[step].data, ...data } } : {})
              }
            },
            currentStep: nextStep || step,
            progress: nextStep
              ? ((stepIndex + 1) / STEP_ORDER.length) * 100
              : 100,
            status: nextStep ? 'running' : 'completed',
            history: newHistory,
            historyIndex: newHistory.length - 1
          };
        });
      },

      goToStep: (step) => {
        set((state) => ({
          currentStep: step,
          status: state.steps[step].status === 'completed' ? 'completed' : 'running',
          progress: (STEP_ORDER.indexOf(step) / STEP_ORDER.length) * 100
        }));
      },

      nextStep: () => {
        const { currentStep, status } = get();
        const nextStep = getNextStep(currentStep);

        if (!nextStep) return;

        set((state) => ({
          currentStep: nextStep,
          status: status === 'completed' ? 'completed' : 'running',
          progress: ((STEP_ORDER.indexOf(nextStep) + 1) / STEP_ORDER.length) * 100,
          steps: {
            ...state.steps,
            [nextStep]: {
              ...state.steps[nextStep],
              status: status === 'completed' ? 'completed' : 'running',
              startedAt: state.steps[nextStep].startedAt || new Date().toISOString()
            }
          }
        }));
      },

      previousStep: () => {
        const { currentStep } = get();
        const prevStep = getPreviousStep(currentStep);

        if (!prevStep) return;

        set((state) => ({
          currentStep: prevStep,
          status: 'running',
          progress: (STEP_ORDER.indexOf(prevStep) / STEP_ORDER.length) * 100
        }));
      },

      pauseWorkflow: () => set({ status: 'paused' }),

      resumeWorkflow: () => set({ status: 'running' }),

      cancelWorkflow: () => set({
        status: 'idle',
        progress: 0,
        steps: createInitialSteps(),
        history: [],
        historyIndex: -1
      }),

      resetWorkflow: () => set({
        currentStep: 'import',
        status: 'idle',
        progress: 0,
        steps: createInitialSteps(),
        history: [],
        historyIndex: -1
      }),

      undo: () => {
        const { historyIndex } = get();
        if (historyIndex < 0) return;

        const historyItem = get().history[historyIndex];

        set((state) => ({
          currentStep: historyItem.step,
          progress: (STEP_ORDER.indexOf(historyItem.step) / STEP_ORDER.length) * 100,
          historyIndex: state.historyIndex - 1
        }));
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;

        const nextHistoryItem = history[historyIndex + 1];

        set((state) => ({
          currentStep: nextHistoryItem.step,
          progress: ((STEP_ORDER.indexOf(nextHistoryItem.step) + 1) / STEP_ORDER.length) * 100,
          historyIndex: state.historyIndex + 1
        }));
      },

      canUndo: () => get().historyIndex >= 0,

      canRedo: () => get().historyIndex < get().history.length - 1,

      getStepData: <T = unknown>(step: WorkflowStep): T | null => {
        const { steps } = get();
        return steps[step]?.data as T | null;
      },

      updateStepData: (step, data) => {
        set((state) => ({
          steps: {
            ...state.steps,
            [step]: {
              ...state.steps[step],
              data: { ...state.steps[step].data, ...data }
            }
          }
        }));
      },

      getCurrentStepData: <T = unknown>(): T | null => {
        const { currentStep, steps } = get();
        return steps[currentStep]?.data as T | null;
      },

      updateCurrentStepData: (data) => {
        const { currentStep } = get();
        set((state) => ({
          steps: {
            ...state.steps,
            [currentStep]: {
              ...state.steps[currentStep],
              data: { ...state.steps[currentStep].data, ...data }
            }
          }
        }));
      },

      validateStep: (step) => {
        const { steps } = get();
        const stepData = steps[step]?.data;
        const errors: string[] = [];

        // 根据步骤验证必要数据
        switch (step) {
          case 'import':
            if (!stepData?.sourceFile) {
              errors.push('请先导入素材');
            }
            break;
          case 'generate':
            if (!stepData?.script) {
              errors.push('请先生成脚本');
            }
            break;
          case 'storyboard':
            if (!stepData?.storyboard) {
              errors.push('请先创建分镜');
            }
            break;
          case 'character':
            if (!stepData?.characters || (stepData.characters as unknown[]).length === 0) {
              errors.push('请先创建角色');
            }
            break;
          case 'render':
            if (!stepData?.renderedFrames) {
              errors.push('请先完成渲染');
            }
            break;
          case 'compose':
            if (!stepData?.composedVideo) {
              errors.push('请先完成合成');
            }
            break;
          case 'export':
            if (!stepData?.exportSettings) {
              errors.push('请先配置导出设置');
            }
            break;
        }

        return {
          valid: errors.length === 0,
          errors
        };
      }
    }),
    {
      name: 'mangaai-workflow-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        steps: state.steps
      })
    }
  )
);

// 导出步骤常量供其他地方使用
export { STEP_ORDER };
