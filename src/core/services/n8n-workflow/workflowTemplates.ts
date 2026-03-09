/**
 * n8n 风格工作流引擎 - 漫剧视频生成
 * 预设工作流模板
 */

import type { WorkflowDefinition, WorkflowTemplate, NodePosition } from './types';

// 生成唯一ID
const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 创建节点辅助函数
const createNode = (
  type: string,
  name: string,
  position: NodePosition,
  config: Record<string, any> = {}
) => ({
  id: generateId(),
  type,
  name,
  position,
  inputs: [],
  outputs: [],
  config
});

// ========== 预设工作流模板 ==========

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'basic-manga',
    name: '基础漫剧生成',
    description: '从小说文本生成漫剧视频的完整流程',
    category: '漫剧生成',
    workflow: {
      name: '基础漫剧生成',
      description: '从小说文本生成漫剧视频的完整流程',
      nodes: [
        {
          id: 'node_1',
          type: 'novel-input',
          name: '小说输入',
          position: { x: 100, y: 200 },
          inputs: [],
          outputs: [{ id: 'out_1', name: 'novel', type: 'main', label: '小说内容' }],
          config: { source: 'upload' }
        },
        {
          id: 'node_2',
          type: 'novel-parser',
          name: '小说解析',
          position: { x: 350, y: 200 },
          inputs: [{ id: 'in_1', name: 'novel', type: 'main', label: '小说内容', required: true }],
          outputs: [
            { id: 'out_2', name: 'chapters', type: 'main', label: '章节列表' },
            { id: 'out_3', name: 'characters', type: 'main', label: '角色列表' },
            { id: 'out_4', name: 'scenes', type: 'main', label: '场景列表' }
          ],
          config: { provider: 'openai', model: 'gpt-4', extractCharacters: true }
        },
        {
          id: 'node_3',
          type: 'script-generator',
          name: '剧本生成',
          position: { x: 600, y: 150 },
          inputs: [{ id: 'in_2', name: 'chapters', type: 'main', label: '章节内容' }],
          outputs: [{ id: 'out_5', name: 'script', type: 'main', label: '剧本' }],
          config: { provider: 'openai', model: 'gpt-4', style: 'dramatic' }
        },
        {
          id: 'node_4',
          type: 'storyboard-generator',
          name: '分镜生成',
          position: { x: 850, y: 150 },
          inputs: [{ id: 'in_3', name: 'script', type: 'main', label: '剧本', required: true }],
          outputs: [{ id: 'out_6', name: 'storyboards', type: 'main', label: '分镜列表' }],
          config: { provider: 'openai', model: 'gpt-4', panelsPerScene: 4 }
        },
        {
          id: 'node_5',
          type: 'character-generator',
          name: '角色生成',
          position: { x: 600, y: 300 },
          inputs: [{ id: 'in_4', name: 'characters', type: 'main', label: '角色列表', required: true }],
          outputs: [{ id: 'out_7', name: 'characterImages', type: 'main', label: '角色图片' }],
          config: { provider: 'stability', model: 'sdxl', style: 'anime' }
        },
        {
          id: 'node_6',
          type: 'scene-generator',
          name: '场景生成',
          position: { x: 850, y: 300 },
          inputs: [{ id: 'in_5', name: 'scenes', type: 'main', label: '场景描述', required: true }],
          outputs: [{ id: 'out_8', name: 'sceneImages', type: 'main', label: '场景图片' }],
          config: { provider: 'stability', model: 'sdxl', style: 'anime' }
        },
        {
          id: 'node_7',
          type: 'video-composer',
          name: '视频合成',
          position: { x: 1100, y: 200 },
          inputs: [
            { id: 'in_6', name: 'images', type: 'main', label: '图片序列', required: true },
            { id: 'in_7', name: 'audio', type: 'main', label: '音频' }
          ],
          outputs: [{ id: 'out_9', name: 'video', type: 'main', label: '合成视频' }],
          config: { fps: 30, resolution: '1920x1080' }
        },
        {
          id: 'node_8',
          type: 'video-export',
          name: '视频导出',
          position: { x: 1350, y: 200 },
          inputs: [{ id: 'in_8', name: 'video', type: 'main', label: '视频', required: true }],
          outputs: [{ id: 'out_10', name: 'file', type: 'main', label: '输出文件' }],
          config: { format: 'mp4', quality: 'high' }
        }
      ],
      connections: [
        { id: 'conn_1', sourceNodeId: 'node_1', sourcePort: 'out_1', targetNode: 'node_2', targetPort: 'in_1' },
        { id: 'conn_2', sourceNodeId: 'node_2', sourcePort: 'out_2', targetNode: 'node_3', targetPort: 'in_2' },
        { id: 'conn_3', sourceNodeId: 'node_2', sourcePort: 'out_3', targetNode: 'node_5', targetPort: 'in_4' },
        { id: 'conn_4', sourceNodeId: 'node_2', sourcePort: 'out_4', targetNode: 'node_6', targetPort: 'in_5' },
        { id: 'conn_5', sourceNodeId: 'node_3', sourcePort: 'out_5', targetNode: 'node_4', targetPort: 'in_3' },
        { id: 'conn_6', sourceNodeId: 'node_4', sourcePort: 'out_6', targetNode: 'node_7', targetPort: 'in_6' },
        { id: 'conn_7', sourceNodeId: 'node_7', sourcePort: 'out_9', targetNode: 'node_8', targetPort: 'in_8' }
      ],
      settings: {
        executionMode: 'sequential',
        errorHandling: 'stop',
        maxRetries: 3,
        timeout: 600000,
        enableLogging: true
      }
    }
  },
  {
    id: 'quick-preview',
    name: '快速预览',
    description: '快速生成预览视频，用于测试工作流',
    category: '预览',
    workflow: {
      name: '快速预览',
      description: '快速生成预览视频',
      nodes: [
        {
          id: 'node_1',
          type: 'script-input',
          name: '剧本输入',
          position: { x: 100, y: 200 },
          inputs: [],
          outputs: [{ id: 'out_1', name: 'script', type: 'main', label: '剧本' }],
          config: {}
        },
        {
          id: 'node_2',
          type: 'storyboard-generator',
          name: '分镜生成',
          position: { x: 350, y: 200 },
          inputs: [{ id: 'in_1', name: 'script', type: 'main', label: '剧本', required: true }],
          outputs: [{ id: 'out_2', name: 'storyboards', type: 'main', label: '分镜' }],
          config: { provider: 'openai', panelsPerScene: 2 }
        },
        {
          id: 'node_3',
          type: 'image-generator',
          name: '图片生成',
          position: { x: 600, y: 200 },
          inputs: [{ id: 'in_2', name: 'prompt', type: 'main', label: '提示词' }],
          outputs: [{ id: 'out_3', name: 'image', type: 'main', label: '图片' }],
          config: { provider: 'stability', size: '512x512' }
        },
        {
          id: 'node_4',
          type: 'video-composer',
          name: '视频合成',
          position: { x: 850, y: 200 },
          inputs: [{ id: 'in_3', name: 'images', type: 'main', label: '图片' }],
          outputs: [{ id: 'out_4', name: 'video', type: 'main', label: '视频' }],
          config: { fps: 15, resolution: '1280x720' }
        },
        {
          id: 'node_5',
          type: 'video-export',
          name: '导出',
          position: { x: 1100, y: 200 },
          inputs: [{ id: 'in_4', name: 'video', type: 'main', label: '视频' }],
          outputs: [{ id: 'out_5', name: 'file', type: 'main', label: '文件' }],
          config: { format: 'mp4', quality: 'medium' }
        }
      ],
      connections: [
        { id: 'conn_1', sourceNodeId: 'node_1', sourcePort: 'out_1', targetNode: 'node_2', targetPort: 'in_1' },
        { id: 'conn_2', sourceNodeId: 'node_2', sourcePort: 'out_2', targetNode: 'node_3', targetPort: 'in_2' },
        { id: 'conn_3', sourceNodeId: 'node_3', sourcePort: 'out_3', targetNode: 'node_4', targetPort: 'in_3' },
        { id: 'conn_4', sourceNodeId: 'node_4', sourcePort: 'out_4', targetNode: 'node_5', targetPort: 'in_4' }
      ],
      settings: {
        executionMode: 'sequential',
        errorHandling: 'continue',
        timeout: 300000,
        enableLogging: true
      }
    }
  },
  {
    id: 'high-quality',
    name: '高质量制作',
    description: '生成高质量漫剧视频，包含完整一致性检查',
    category: '高质量',
    workflow: {
      name: '高质量制作',
      description: '完整的高质量漫剧视频生成流程',
      nodes: [
        {
          id: 'node_1',
          type: 'novel-input',
          name: '小说输入',
          position: { x: 100, y: 200 },
          inputs: [],
          outputs: [{ id: 'out_1', name: 'novel', type: 'main', label: '小说' }],
          config: {}
        },
        {
          id: 'node_2',
          type: 'novel-parser',
          name: '解析',
          position: { x: 300, y: 200 },
          inputs: [{ id: 'in_1', name: 'novel', type: 'main', label: '小说' }],
          outputs: [
            { id: 'out_chapters', name: 'chapters', type: 'main', label: '章节' },
            { id: 'out_characters', name: 'characters', type: 'main', label: '角色' },
            { id: 'out_scenes', name: 'scenes', type: 'main', label: '场景' }
          ],
          config: {}
        },
        {
          id: 'node_3',
          type: 'character-generator',
          name: '角色生成',
          position: { x: 500, y: 100 },
          inputs: [{ id: 'in_char', name: 'characters', type: 'main', label: '角色' }],
          outputs: [{ id: 'out_char_img', name: 'characterImages', type: 'main', label: '角色图' }],
          config: { size: '1024x1024' }
        },
        {
          id: 'node_4',
          type: 'consistency-check',
          name: '一致性检查',
          position: { x: 700, y: 100 },
          inputs: [
            { id: 'in_img', name: 'images', type: 'main', label: '图片' },
            { id: 'in_ref', name: 'reference', type: 'main', label: '参考' }
          ],
          outputs: [
            { id: 'out_pass', name: 'passed', type: 'main', label: '通过' },
            { id: 'out_fix', name: 'fixed', type: 'main', label: '修复' }
          ],
          config: { strictness: 0.9, autoFix: true }
        },
        {
          id: 'node_5',
          type: 'scene-generator',
          name: '场景生成',
          position: { x: 500, y: 300 },
          inputs: [{ id: 'in_scenes', name: 'scenes', type: 'main', label: '场景' }],
          outputs: [{ id: 'out_scene_img', name: 'sceneImages', type: 'main', label: '场景图' }],
          config: { size: '1024x1024' }
        },
        {
          id: 'node_6',
          type: 'script-generator',
          name: '剧本',
          position: { x: 500, y: 450 },
          inputs: [{ id: 'in_chap', name: 'chapters', type: 'main', label: '章节' }],
          outputs: [{ id: 'out_script', name: 'script', type: 'main', label: '剧本' }],
          config: {}
        },
        {
          id: 'node_7',
          type: 'storyboard-generator',
          name: '分镜',
          position: { x: 700, y: 450 },
          inputs: [{ id: 'in_script', name: 'script', type: 'main', label: '剧本' }],
          outputs: [{ id: 'out_story', name: 'storyboards', type: 'main', label: '分镜' }],
          config: { panelsPerScene: 6 }
        },
        {
          id: 'node_8',
          type: 'lip-sync-generator',
          name: '口型同步',
          position: { x: 900, y: 300 },
          inputs: [
            { id: 'in_audio', name: 'audio', type: 'main', label: '音频' },
            { id: 'in_char_img2', name: 'characterImage', type: 'main', label: '角色图' }
          ],
          outputs: [{ id: 'out_anim', name: 'animated', type: 'main', label: '动画' }],
          config: {}
        },
        {
          id: 'node_9',
          type: 'video-composer',
          name: '合成',
          position: { x: 1100, y: 300 },
          inputs: [{ id: 'in_vid', name: 'images', type: 'main', label: '图片' }],
          outputs: [{ id: 'out_vid', name: 'video', type: 'main', label: '视频' }],
          config: { fps: 60, resolution: '1920x1080' }
        },
        {
          id: 'node_10',
          type: 'subtitle-generator',
          name: '字幕',
          position: { x: 1100, y: 450 },
          inputs: [{ id: 'in_sub', name: 'script', type: 'main', label: '剧本' }],
          outputs: [{ id: 'out_sub', name: 'subtitles', type: 'main', label: '字幕' }],
          config: {}
        },
        {
          id: 'node_11',
          type: 'video-export',
          name: '导出',
          position: { x: 1300, y: 350 },
          inputs: [
            { id: 'in_final_vid', name: 'video', type: 'main', label: '视频' },
            { id: 'in_final_sub', name: 'subtitles', type: 'main', label: '字幕' }
          ],
          outputs: [{ id: 'out_file', name: 'file', type: 'main', label: '文件' }],
          config: { quality: 'high' }
        }
      ],
      connections: [
        { id: 'c1', sourceNodeId: 'node_1', sourcePort: 'out_1', targetNode: 'node_2', targetPort: 'in_1' },
        { id: 'c2', sourceNodeId: 'node_2', sourcePort: 'out_characters', targetNode: 'node_3', targetPort: 'in_char' },
        { id: 'c3', sourceNodeId: 'node_2', sourcePort: 'out_scenes', targetNode: 'node_5', targetPort: 'in_scenes' },
        { id: 'c4', sourceNodeId: 'node_2', sourcePort: 'out_chapters', targetNode: 'node_6', targetPort: 'in_chap' },
        { id: 'c5', sourceNodeId: 'node_3', sourcePort: 'out_char_img', targetNode: 'node_4', targetPort: 'in_img' },
        { id: 'c6', sourceNodeId: 'node_4', sourcePort: 'out_pass', targetNode: 'node_8', targetPort: 'in_char_img2' },
        { id: 'c7', sourceNodeId: 'node_5', sourcePort: 'out_scene_img', targetNode: 'node_9', targetPort: 'in_vid' },
        { id: 'c8', sourceNodeId: 'node_6', sourcePort: 'out_script', targetNode: 'node_7', targetPort: 'in_script' },
        { id: 'c9', sourceNodeId: 'node_7', sourcePort: 'out_story', targetNode: 'node_9', targetPort: 'in_vid' },
        { id: 'c10', sourceNodeId: 'node_9', sourcePort: 'out_vid', targetNode: 'node_11', targetPort: 'in_final_vid' },
        { id: 'c11', sourceNodeId: 'node_10', sourcePort: 'out_sub', targetNode: 'node_11', targetPort: 'in_final_sub' }
      ],
      settings: {
        executionMode: 'parallel',
        errorHandling: 'retry',
        maxRetries: 5,
        timeout: 1200000,
        enableLogging: true
      }
    }
  }
];

// ========== 获取模板列表 ==========
export function getWorkflowTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES;
}

// ========== 获取模板 ==========
export function getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.id === id);
}

// ========== 从模板创建工作流 ==========
export function createWorkflowFromTemplate(templateId: string): WorkflowDefinition | undefined {
  const template = getWorkflowTemplate(templateId);
  if (!template) return undefined;

  return {
    projectId: '',
    id: generateId(),
    name: template.workflow.name,
    description: template.workflow.description,
    nodes: template.workflow.nodes.map(node => ({
      ...node,
      id: generateId()
    })),
    connections: template.workflow.connections.map(conn => ({
      ...conn,
      id: generateId()
    })),
    settings: { ...template.workflow.settings }
  };
}
