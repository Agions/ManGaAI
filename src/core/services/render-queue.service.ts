/**
 * 渲染任务队列服务（A4/C1）
 */

import { imageGenerationService } from './image-generation.service';
import { costService } from './cost.service';

export type RenderJobStatus = 'pending' | 'running' | 'completed' | 'failed';
export type RenderLogLevel = 'info' | 'warning' | 'error';

export interface FrameRenderJob {
  id: string;
  frameId: string;
  frameTitle: string;
  prompt: string;
  model: 'seedream-5.0' | 'kling-1.6' | 'vidu-2.0';
  status: RenderJobStatus;
  progress: number;
  retries: number;
  maxRetries: number;
  projectId?: string;
  imageUrl?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface RenderLog {
  id: string;
  jobId?: string;
  level: RenderLogLevel;
  message: string;
  timestamp: string;
}

interface RenderQueueState {
  jobs: FrameRenderJob[];
  logs: RenderLog[];
  isRunning: boolean;
  isPaused: boolean;
}

type StateListener = (state: RenderQueueState) => void;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class RenderQueueService {
  private state: RenderQueueState = {
    jobs: [],
    logs: [],
    isRunning: false,
    isPaused: false,
  };

  private listeners = new Set<StateListener>();

  getState(): RenderQueueState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  enqueue(jobs: Omit<FrameRenderJob, 'id' | 'status' | 'progress' | 'retries' | 'createdAt'>[]): FrameRenderJob[] {
    const now = new Date().toISOString();
    const created = jobs.map((job, index) => ({
      ...job,
      id: `render_job_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'pending' as RenderJobStatus,
      progress: 0,
      retries: 0,
      createdAt: now,
    }));

    this.updateState({ jobs: [...this.state.jobs, ...created] });
    this.addLog('info', `已加入 ${created.length} 个渲染任务`);
    return created;
  }

  pause(): void {
    this.updateState({ isPaused: true });
    this.addLog('warning', '队列已暂停，当前任务完成后停止继续处理。');
  }

  resume(): void {
    this.updateState({ isPaused: false });
    this.addLog('info', '队列已恢复。');
    if (!this.state.isRunning) {
      void this.run();
    }
  }

  clearCompleted(): void {
    const pendingJobs = this.state.jobs.filter(job => job.status !== 'completed');
    this.updateState({ jobs: pendingJobs });
  }

  retry(jobId: string): void {
    const jobs = this.state.jobs.map(job => {
      if (job.id !== jobId) return job;
      return {
        ...job,
        status: 'pending' as RenderJobStatus,
        progress: 0,
        error: undefined,
      };
    });

    this.updateState({ jobs });
    this.addLog('info', `任务 ${jobId} 已重试`);

    if (!this.state.isRunning && !this.state.isPaused) {
      void this.run();
    }
  }

  async run(): Promise<void> {
    if (this.state.isRunning) return;

    this.updateState({ isRunning: true });

    try {
      while (true) {
        if (this.state.isPaused) break;

        const nextJob = this.state.jobs.find(job => job.status === 'pending');
        if (!nextJob) break;

        await this.processJob(nextJob.id);
      }
    } finally {
      this.updateState({ isRunning: false });
    }
  }

  private async processJob(jobId: string): Promise<void> {
    const job = this.state.jobs.find(item => item.id === jobId);
    if (!job) return;

    this.patchJob(jobId, {
      status: 'running',
      progress: 5,
      startedAt: new Date().toISOString(),
      error: undefined,
    });
    this.addLog('info', `开始渲染：${job.frameTitle}`, jobId);

    try {
      await this.tickProgress(jobId, [20, 45, 70]);

      const result = await imageGenerationService.generateImage(job.prompt, {
        model: job.model,
        size: '1K',
        style: 'anime',
        quality: 'standard',
      });

      this.patchJob(jobId, {
        status: 'completed',
        progress: 100,
        imageUrl: result.url,
        finishedAt: new Date().toISOString(),
      });
      costService.recordVideoCost(job.model, 5, '1K', {
        operation: 'frame_render',
        frameId: job.frameId,
        projectId: job.projectId
      });
      this.addLog('info', `渲染完成：${job.frameTitle}`, jobId);
    } catch (error) {
      // 回退为占位图，保障流程可继续演示
      const fallbackUrl = this.buildFallbackImage(job.frameTitle);
      const errorMessage = error instanceof Error ? error.message : '渲染失败';

      if (job.retries < job.maxRetries) {
        this.patchJob(jobId, {
          status: 'pending',
          progress: 0,
          retries: job.retries + 1,
          error: errorMessage,
        });
        this.addLog('warning', `渲染失败，自动重试(${job.retries + 1}/${job.maxRetries})：${job.frameTitle}`, jobId);
        return;
      }

      this.patchJob(jobId, {
        status: 'completed',
        progress: 100,
        imageUrl: fallbackUrl,
        error: errorMessage,
        finishedAt: new Date().toISOString(),
      });
      this.addLog('warning', `渲染失败，已使用占位图：${job.frameTitle}`, jobId);
    }
  }

  private async tickProgress(jobId: string, points: number[]): Promise<void> {
    for (const value of points) {
      if (this.state.isPaused) return;
      await sleep(120);
      this.patchJob(jobId, { progress: value });
    }
  }

  private buildFallbackImage(title: string): string {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'>
      <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop stop-color='#0ea5e9' offset='0'/><stop stop-color='#2563eb' offset='1'/></linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='46' font-family='sans-serif'>${title}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private patchJob(jobId: string, patch: Partial<FrameRenderJob>): void {
    const jobs = this.state.jobs.map(job => (job.id === jobId ? { ...job, ...patch } : job));
    this.updateState({ jobs });
  }

  private addLog(level: RenderLogLevel, message: string, jobId?: string): void {
    const log: RenderLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      level,
      message,
      jobId,
      timestamp: new Date().toISOString(),
    };

    const logs = [log, ...this.state.logs].slice(0, 500);
    this.updateState({ logs });
  }

  private updateState(patch: Partial<RenderQueueState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const renderQueueService = new RenderQueueService();
export default RenderQueueService;
