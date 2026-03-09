/**
 * n8n 风格工作流引擎 - 漫剧视频生成
 * 项目和集数管理服务
 */

import { v4 as uuidv4 } from 'uuid';
import type { Project, Episode, WorkflowDefinition, WorkflowExecutionStatus, ProjectSettings } from './types';

// ========== ID 生成 ==========
const generateId = () => uuidv4();

// ========== 项目管理器 ==========
class ProjectManager {
  private projects: Map<string, Project> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ========== 存储 ==========
  private saveToStorage(): void {
    try {
      const data = Array.from(this.projects.values());
      localStorage.setItem('manga-projects', JSON.stringify(data));
    } catch (e) {
      console.error('保存项目失败:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('manga-projects');
      if (data) {
        const projects = JSON.parse(data) as Project[];
        projects.forEach(p => this.projects.set(p.id, p));
      }
    } catch (e) {
      console.error('加载项目失败:', e);
    }
  }

  // ========== 项目 CRUD ==========
  createProject(name: string, description?: string): Project {
    const project: Project = {
      id: generateId(),
      name,
      description,
      episodes: [],
      settings: {
        defaultProvider: 'openai',
        defaultModel: 'gpt-4',
        defaultQuality: 'high',
        defaultResolution: '1920x1080',
        defaultFps: 30
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.projects.set(project.id, project);
    this.saveToStorage();
    return project;
  }

  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updated = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.projects.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  deleteProject(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  // ========== 集数管理 ==========
  addEpisode(projectId: string, title: string, chapterStart: number, chapterEnd: number): Episode | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const episodeNumber = project.episodes.length + 1;

    const episode: Episode = {
      id: generateId(),
      projectId,
      episodeNumber,
      title,
      chapterStart,
      chapterEnd,
      workflowStatus: 'idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    project.episodes.push(episode);
    project.updatedAt = new Date().toISOString();
    this.saveToStorage();

    return episode;
  }

  updateEpisode(projectId: string, episodeId: string, updates: Partial<Episode>): Episode | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const episodeIndex = project.episodes.findIndex(e => e.id === episodeId);
    if (episodeIndex === -1) return undefined;

    project.episodes[episodeIndex] = {
      ...project.episodes[episodeIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    project.updatedAt = new Date().toISOString();
    this.saveToStorage();

    return project.episodes[episodeIndex];
  }

  deleteEpisode(projectId: string, episodeId: string): boolean {
    const project = this.projects.get(projectId);
    if (!project) return false;

    const originalLength = project.episodes.length;
    project.episodes = project.episodes.filter(e => e.id !== episodeId);

    // 重新编号
    project.episodes.forEach((ep, index) => {
      ep.episodeNumber = index + 1;
    });

    if (project.episodes.length !== originalLength) {
      project.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return true;
    }

    return false;
  }

  getEpisode(projectId: string, episodeId: string): Episode | undefined {
    const project = this.projects.get(projectId);
    if (!project) return undefined;
    return project.episodes.find(e => e.id === episodeId);
  }

  getEpisodes(projectId: string): Episode[] {
    const project = this.projects.get(projectId);
    return project?.episodes || [];
  }

  // ========== 批量操作 ==========
  createEpisodesFromChapters(projectId: string, totalChapters: number, chaptersPerEpisode: number = 10): Episode[] {
    const project = this.projects.get(projectId);
    if (!project) return [];

    const episodes: Episode[] = [];
    let currentChapter = 1;

    while (currentChapter <= totalChapters) {
      const chapterEnd = Math.min(currentChapter + chaptersPerEpisode - 1, totalChapters);
      const episode = this.addEpisode(
        projectId,
        `第 ${this.getEpisodes(projectId).length + 1} 集`,
        currentChapter,
        chapterEnd
      );

      if (episode) {
        episodes.push(episode);
      }

      currentChapter = chapterEnd + 1;
    }

    return episodes;
  }

  // ========== 更新集数工作流状态 ==========
  updateEpisodeWorkflowStatus(
    projectId: string,
    episodeId: string,
    workflowId: string,
    status: WorkflowExecutionStatus
  ): Episode | undefined {
    return this.updateEpisode(projectId, episodeId, {
      workflowId,
      workflowStatus: status,
      executedAt: status === 'completed' ? new Date().toISOString() : undefined
    });
  }
}

// 导出单例
export const projectManager = new ProjectManager();

// 导出类型
export type { Project, Episode, WorkflowDefinition, WorkflowExecutionStatus, ProjectSettings };
