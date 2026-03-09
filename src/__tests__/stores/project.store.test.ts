/**
 * Project Store 测试
 */

import { useProjectStore } from '@/core/stores/project.store';
import type { ProjectData } from '@/core/types';

// 模拟 storage service
jest.mock('@/core/services/storage.service', () => ({
  storageService: {
    projects: {
      save: jest.fn(),
      delete: jest.fn(),
    },
    exportHistory: {
      add: jest.fn(),
      clear: jest.fn(),
    },
  },
}));

describe('Project Store', () => {
  beforeEach(() => {
    // 重置 store
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      searchQuery: '',
      filterStatus: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      exportHistory: [],
    });
  });

  describe('createProject', () => {
    it('应该创建新项目', () => {
      const { createProject } = useProjectStore.getState();

      const project = createProject({
        name: '测试项目',
        description: '这是一个测试项目',
      });

      expect(project).toHaveProperty('id');
      expect(project.name).toBe('测试项目');
      expect(project.description).toBe('这是一个测试项目');
      expect(project.status).toBe('draft');
    });

    it('应该使用默认名称', () => {
      const { createProject } = useProjectStore.getState();

      const project = createProject({});

      expect(project.name).toBe('未命名项目');
    });

    it('应该将新项目设为当前项目', () => {
      const { createProject, currentProject } = useProjectStore.getState();

      createProject({ name: '测试' });

      expect(useProjectStore.getState().currentProject).toBeDefined();
    });
  });

  describe('updateProject', () => {
    it('应该更新项目', () => {
      const { createProject, updateProject, projects } = useProjectStore.getState();

      const project = createProject({ name: '原始名称' });
      updateProject(project.id, { name: '新名称' });

      const updated = useProjectStore.getState().projects.find(p => p.id === project.id);
      expect(updated?.name).toBe('新名称');
    });
  });

  describe('deleteProject', () => {
    it('应该删除项目', () => {
      const { createProject, deleteProject, projects } = useProjectStore.getState();

      const project = createProject({ name: '测试' });
      expect(useProjectStore.getState().projects.length).toBe(1);

      deleteProject(project.id);

      expect(useProjectStore.getState().projects.length).toBe(0);
    });
  });

  describe('filteredProjects', () => {
    it('应该过滤项目', () => {
      const { createProject, setSearchQuery } = useProjectStore.getState();

      createProject({ name: '测试项目A' });
      createProject({ name: '另一个项目' });
      createProject({ name: '测试项目B' });

      setSearchQuery('测试');

      const filtered = useProjectStore.getState().filteredProjects();
      expect(filtered.length).toBe(2);
    });

    it('应该按状态过滤', () => {
      const { createProject, setFilterStatus } = useProjectStore.getState();

      createProject({ name: '草稿1', status: 'draft' });
      createProject({ name: '完成', status: 'completed' });
      createProject({ name: '草稿2', status: 'draft' });

      setFilterStatus('draft');

      const filtered = useProjectStore.getState().filteredProjects();
      expect(filtered.length).toBe(2);
      expect(filtered.every(p => p.status === 'draft')).toBe(true);
    });
  });

  describe('script 操作', () => {
    it('应该添加脚本', () => {
      const { createProject, addScript } = useProjectStore.getState();

      const project = createProject({ name: '测试' });

      const script = {
        id: 'script_1',
        title: '测试脚本',
        content: '脚本内容',
        segments: [],
        metadata: {
          style: 'professional',
          tone: 'neutral',
          length: 'medium' as const,
          targetAudience: 'general',
          language: 'zh-CN',
          wordCount: 100,
          estimatedDuration: 60,
          generatedBy: 'test',
          generatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addScript(project.id, script);

      const updated = useProjectStore.getState().projects.find(p => p.id === project.id);
      expect(updated?.scripts.length).toBe(1);
    });
  });

  describe('video 操作', () => {
    it('应该添加视频', () => {
      const { createProject, addVideo } = useProjectStore.getState();

      const project = createProject({ name: '测试' });

      const video = {
        id: 'video_1',
        path: '/test/video.mp4',
        name: '测试视频',
        duration: 120,
        width: 1920,
        height: 1080,
        fps: 30,
        format: 'mp4',
        size: 1024000,
        createdAt: new Date().toISOString(),
      };

      addVideo(project.id, video);

      const updated = useProjectStore.getState().projects.find(p => p.id === project.id);
      expect(updated?.videos.length).toBe(1);
    });
  });
});
