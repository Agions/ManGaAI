/**
 * 工作流节点模板定义
 */

import React from 'react';
import {
  VideoCameraOutlined,
  AudioOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  BranchesOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  ExportOutlined,
  ScissorOutlined,
  FontSizeOutlined,
  SoundOutlined,
  PictureOutlined,
  NodeIndexOutlined,
  ApiOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import type { NodeTemplate, NodeCategory, WorkflowDefinition, NodeExecutionStatus } from './types';

// 节点分类信息
export const CATEGORY_INFO: Record<NodeCategory, { label: string; color: string; description?: string }> = {
  input: { label: '输入', color: '#3b82f6', description: '数据输入节点' },
  output: { label: '输出', color: '#10b981', description: '数据输出节点' },
  ai: { label: 'AI', color: '#8b5cf6', description: 'AI 处理节点' },
  video: { label: '视频', color: '#f59e0b', description: '视频处理节点' },
  audio: { label: '音频', color: '#ec4899', description: '音频处理节点' },
  logic: { label: '逻辑', color: '#6366f1', description: '流程控制节点' },
  utility: { label: '工具', color: '#64748b', description: '辅助工具节点' },
};

// 节点模板列表
export const NODE_TEMPLATES: NodeTemplate[] = [
  // 输入节点
  {
    type: 'video-input',
    name: '视频输入',
    description: '导入本地视频文件',
    category: 'input',
    icon: <VideoCameraOutlined />,
    inputs: [],
    outputs: [
      { name: 'video', label: '视频', type: 'video', required: true }
    ],
    defaultConfig: {
      filePath: '',
      autoDetect: true
    }
  },
  {
    type: 'image-input',
    name: '图片输入',
    description: '导入图片序列',
    category: 'input',
    icon: <PictureOutlined />,
    inputs: [],
    outputs: [
      { name: 'images', label: '图片', type: 'image', required: true }
    ],
    defaultConfig: {
      filePath: '',
      format: 'png'
    }
  },
  {
    type: 'text-input',
    name: '文本输入',
    description: '输入文本内容',
    category: 'input',
    icon: <FileTextOutlined />,
    inputs: [],
    outputs: [
      { name: 'text', label: '文本', type: 'text', required: true }
    ],
    defaultConfig: {
      content: '',
      format: 'plain'
    }
  },

  // 输出节点
  {
    type: 'video-export',
    name: '视频导出',
    description: '导出为视频文件',
    category: 'output',
    icon: <ExportOutlined />,
    inputs: [
      { name: 'video', label: '视频', type: 'video', required: true }
    ],
    outputs: [],
    defaultConfig: {
      format: 'mp4',
      quality: 'high',
      resolution: '1920x1080',
      fps: 30
    }
  },
  {
    type: 'audio-export',
    name: '音频导出',
    description: '导出为音频文件',
    category: 'output',
    icon: <SoundOutlined />,
    inputs: [
      { name: 'audio', label: '音频', type: 'audio', required: true }
    ],
    outputs: [],
    defaultConfig: {
      format: 'mp3',
      quality: 'high',
      bitrate: '192k'
    }
  },

  // AI 节点
  {
    type: 'script-generator',
    name: '脚本生成',
    description: '使用 AI 生成视频脚本',
    category: 'ai',
    icon: <ApiOutlined />,
    inputs: [
      { name: 'prompt', label: '提示词', type: 'text', required: false }
    ],
    outputs: [
      { name: 'script', label: '脚本', type: 'text', required: true }
    ],
    defaultConfig: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000
    }
  },
  {
    type: 'image-generator',
    name: '图片生成',
    description: '使用 AI 生成图片',
    category: 'ai',
    icon: <PictureOutlined />,
    inputs: [
      { name: 'prompt', label: '提示词', type: 'text', required: true }
    ],
    outputs: [
      { name: 'image', label: '图片', type: 'image', required: true }
    ],
    defaultConfig: {
      provider: 'stability',
      model: 'sdxl',
      size: '1024x1024',
      quality: 'standard'
    }
  },
  {
    type: 'voice-generator',
    name: '语音合成',
    description: '使用 AI 生成语音',
    category: 'ai',
    icon: <SoundOutlined />,
    inputs: [
      { name: 'text', label: '文本', type: 'text', required: true }
    ],
    outputs: [
      { name: 'audio', label: '音频', type: 'audio', required: true }
    ],
    defaultConfig: {
      provider: 'openai',
      voice: 'alloy',
      speed: 1.0
    }
  },
  {
    type: 'subtitle-generator',
    name: '字幕生成',
    description: '自动生成视频字幕',
    category: 'ai',
    icon: <FontSizeOutlined />,
    inputs: [
      { name: 'video', label: '视频', type: 'video', required: true }
    ],
    outputs: [
      { name: 'subtitles', label: '字幕', type: 'text', required: true }
    ],
    defaultConfig: {
      language: 'zh',
      format: 'srt'
    }
  },

  // 视频处理节点
  {
    type: 'video-composer',
    name: '视频合成',
    description: '合成多个视频片段',
    category: 'video',
    icon: <VideoCameraOutlined />,
    inputs: [
      { name: 'video1', label: '视频1', type: 'video', required: true },
      { name: 'video2', label: '视频2', type: 'video', required: false }
    ],
    outputs: [
      { name: 'video', label: '视频', type: 'video', required: true }
    ],
    defaultConfig: {
      transition: 'cut',
      fps: 30,
      resolution: '1920x1080'
    }
  },
  {
    type: 'video-editor',
    name: '视频剪辑',
    description: '剪辑和裁剪视频',
    category: 'video',
    icon: <ScissorOutlined />,
    inputs: [
      { name: 'video', label: '视频', type: 'video', required: true }
    ],
    outputs: [
      { name: 'video', label: '视频', type: 'video', required: true }
    ],
    defaultConfig: {
      startTime: 0,
      endTime: -1,
      trim: false
    }
  },
  {
    type: 'video-effects',
    name: '视频特效',
    description: '添加视频特效',
    category: 'video',
    icon: <ThunderboltOutlined />,
    inputs: [
      { name: 'video', label: '视频', type: 'video', required: true }
    ],
    outputs: [
      { name: 'video', label: '视频', type: 'video', required: true }
    ],
    defaultConfig: {
      effects: [],
      intensity: 100
    }
  },

  // 音频处理节点
  {
    type: 'audio-mixer',
    name: '音频混合',
    description: '混合多个音轨',
    category: 'audio',
    icon: <AudioOutlined />,
    inputs: [
      { name: 'audio1', label: '音频1', type: 'audio', required: true },
      { name: 'audio2', label: '音频2', type: 'audio', required: false }
    ],
    outputs: [
      { name: 'audio', label: '音频', type: 'audio', required: true }
    ],
    defaultConfig: {
      volume1: 1.0,
      volume2: 1.0
    }
  },
  {
    type: 'audio-effects',
    name: '音频特效',
    description: '添加音频特效',
    category: 'audio',
    icon: <SoundOutlined />,
    inputs: [
      { name: 'audio', label: '音频', type: 'audio', required: true }
    ],
    outputs: [
      { name: 'audio', label: '音频', type: 'audio', required: true }
    ],
    defaultConfig: {
      effects: [],
      volume: 1.0
    }
  },

  // 逻辑节点
  {
    type: 'condition',
    name: '条件分支',
    description: '根据条件分支执行',
    category: 'logic',
    icon: <BranchesOutlined />,
    inputs: [
      { name: 'input', label: '输入', type: 'any', required: true }
    ],
    outputs: [
      { name: 'true', label: '真', type: 'any', required: false },
      { name: 'false', label: '假', type: 'any', required: false }
    ],
    defaultConfig: {
      condition: '',
      operator: 'equals'
    }
  },
  {
    type: 'loop',
    name: '循环',
    description: '循环执行节点',
    category: 'logic',
    icon: <NodeIndexOutlined />,
    inputs: [
      { name: 'input', label: '输入', type: 'any', required: true }
    ],
    outputs: [
      { name: 'output', label: '输出', type: 'any', required: true }
    ],
    defaultConfig: {
      times: 3,
      delay: 0
    }
  },

  // 工具节点
  {
    type: 'delay',
    name: '延迟',
    description: '延迟执行',
    category: 'utility',
    icon: <ClockCircleOutlined />,
    inputs: [
      { name: 'input', label: '输入', type: 'any', required: true }
    ],
    outputs: [
      { name: 'output', label: '输出', type: 'any', required: true }
    ],
    defaultConfig: {
      delayMs: 1000
    }
  },
  {
    type: 'logger',
    name: '日志',
    description: '输出日志信息',
    category: 'utility',
    icon: <SettingOutlined />,
    inputs: [
      { name: 'input', label: '输入', type: 'any', required: true }
    ],
    outputs: [
      { name: 'output', label: '输出', type: 'any', required: true }
    ],
    defaultConfig: {
      level: 'info',
      message: ''
    }
  },
  {
    type: 'start',
    name: '开始',
    description: '工作流起始节点',
    category: 'utility',
    icon: <PlayCircleOutlined />,
    inputs: [],
    outputs: [
      { name: 'output', label: '输出', type: 'any', required: true }
    ],
    defaultConfig: {
      trigger: 'manual'
    }
  }
];

// 根据分类获取节点
export const getNodesByCategory = (category: NodeCategory): NodeTemplate[] => {
  return NODE_TEMPLATES.filter(template => template.category === category);
};

// 根据类型获取节点模板
export const getNodeTemplate = (type: string): NodeTemplate | undefined => {
  return NODE_TEMPLATES.find(template => template.type === type);
};

// 工作流管理器单例
class WorkflowManagerClass {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  createWorkflow(name: string): WorkflowDefinition {
    const workflow: WorkflowDefinition = {
      id: `wf_${Date.now()}`,
      name,
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  getWorkflow(id: string): WorkflowDefinition | null {
    return this.workflows.get(id) || null;
  }

  updateWorkflow(id: string, workflow: WorkflowDefinition): void {
    const existing = this.workflows.get(id);
    if (existing) {
      this.workflows.set(id, {
        ...workflow,
        updatedAt: new Date().toISOString()
      });
    }
  }

  deleteWorkflow(id: string): void {
    this.workflows.delete(id);
  }

  async runWorkflow(
    id: string,
    onProgress?: (nodeId: string, status: NodeExecutionStatus) => void
  ): Promise<{ status: 'completed' | 'error'; error?: string }> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      return { status: 'error', error: '工作流不存在' };
    }

    // 简化实现 - 模拟执行
    for (const node of workflow.nodes) {
      onProgress?.(node.id, 'running');
      await new Promise(resolve => setTimeout(resolve, 500));
      onProgress?.(node.id, 'completed');
    }

    return { status: 'completed' };
  }

  createFromTemplate(templateId: string): WorkflowDefinition | null {
    const templates: Record<string, Partial<WorkflowDefinition>> = {
      'basic-manga': {
        name: '基础漫剧生成',
        nodes: [
          {
            id: 'start_1',
            type: 'start',
            name: '开始',
            position: { x: 100, y: 200 },
            inputs: [],
            outputs: [{ id: 'o1', name: 'output', label: '输出', type: 'any' }],
            config: {}
          }
        ],
        connections: []
      },
      'quick-preview': {
        name: '快速预览',
        nodes: [],
        connections: []
      },
      'high-quality': {
        name: '高质量制作',
        nodes: [],
        connections: []
      }
    };

    const template = templates[templateId];
    if (!template) return null;

    return this.createWorkflow(template.name || '新工作流');
  }
}

export const workflowManager = new WorkflowManagerClass();
