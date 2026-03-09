/**
 * n8n 风格工作流引擎 - 漫剧视频生成
 * 节点定义和模板
 */

import type { NodeTemplate, NodeDefinitionMap, NodeCategory } from './types';

// ========== 节点模板定义 ==========

export const NODE_TEMPLATES: NodeDefinitionMap = {
  // ========== 输入节点 ==========
  'novel-input': {
    type: 'novel-input',
    name: '小说输入',
    category: 'input',
    description: '上传小说文件或输入小说内容',
    icon: 'FileTextOutlined',
    inputs: [],
    outputs: [
      { name: 'novel', type: 'main', label: '小说内容', required: true }
    ],
    defaultConfig: {
      source: 'upload',
      encoding: 'utf-8'
    }
  },

  'script-input': {
    type: 'script-input',
    name: '剧本输入',
    category: 'input',
    description: '导入已有剧本或手动输入',
    icon: 'ReadOutlined',
    inputs: [],
    outputs: [
      { name: 'script', type: 'main', label: '剧本', required: true }
    ],
    defaultConfig: {
      format: 'json'
    }
  },

  'image-input': {
    type: 'image-input',
    name: '图片输入',
    category: 'input',
    description: '导入角色图片、场景图片等',
    icon: 'PictureOutlined',
    inputs: [],
    outputs: [
      { name: 'images', type: 'main', label: '图片列表' }
    ],
    defaultConfig: {
      multiple: true
    }
  },

  'video-input': {
    type: 'video-input',
    name: '视频输入',
    category: 'input',
    description: '导入视频素材',
    icon: 'VideoCameraOutlined',
    inputs: [],
    outputs: [
      { name: 'video', type: 'main', label: '视频' }
    ],
    defaultConfig: {}
  },

  'audio-input': {
    type: 'audio-input',
    name: '音频输入',
    category: 'input',
    description: '导入背景音乐、音效',
    icon: 'SoundOutlined',
    inputs: [],
    outputs: [
      { name: 'audio', type: 'main', label: '音频' }
    ],
    defaultConfig: {}
  },

  // ========== AI 处理节点 ==========
  'novel-parser': {
    type: 'novel-parser',
    name: '小说解析',
    category: 'ai',
    description: 'AI 解析小说内容，提取章节、角色、场景',
    icon: 'RobotOutlined',
    inputs: [
      { name: 'novel', type: 'main', label: '小说内容', required: true }
    ],
    outputs: [
      { name: 'chapters', type: 'main', label: '章节列表' },
      { name: 'characters', type: 'main', label: '角色列表' },
      { name: 'scenes', type: 'main', label: '场景列表' },
      { name: 'error', type: 'error', label: '错误输出' }
    ],
    defaultConfig: {
      provider: 'openai',
      model: 'gpt-4',
      extractCharacters: true,
      extractScenes: true
    }
  },

  'script-generator': {
    type: 'script-generator',
    name: '剧本生成',
    category: 'ai',
    description: '基于小说内容生成剧本',
    icon: 'ThunderboltOutlined',
    inputs: [
      { name: 'chapters', type: 'main', label: '章节内容' }
    ],
    outputs: [
      { name: 'script', type: 'main', label: '生成的剧本' },
      { name: 'error', type: 'error', label: '错误输出' }
    ],
    defaultConfig: {
      provider: 'openai',
      model: 'gpt-4',
      style: 'dramatic',
      dialogueRatio: 0.6
    }
  },

  'storyboard-generator': {
    type: 'storyboard-generator',
    name: '分镜生成',
    category: 'ai',
    description: '将剧本转换为漫画分镜',
    icon: 'PictureOutlined',
    inputs: [
      { name: 'script', type: 'main', label: '剧本', required: true }
    ],
    outputs: [
      { name: 'storyboards', type: 'main', label: '分镜列表' },
      { name: 'error', type: 'error', label: '错误输出' }
    ],
    defaultConfig: {
      provider: 'openai',
      model: 'gpt-4',
      panelsPerScene: 4,
      aspectRatio: '16:9'
    }
  },

  'character-generator': {
    type: 'character-generator',
    name: '角色生成',
    category: 'ai',
    description: 'AI 生成角色形象图',
    icon: 'RobotOutlined',
    inputs: [
      { name: 'characters', type: 'main', label: '角色列表', required: true }
    ],
    outputs: [
      { name: 'characterImages', type: 'main', label: '角色图片' },
      { name: 'error', type: 'error', label: '错误输出' }
    ],
    defaultConfig: {
      provider: 'stability',
      model: 'sdxl',
      style: 'anime',
      size: '1024x1024'
    }
  },

  'scene-generator': {
    type: 'scene-generator',
    name: '场景生成',
    category: 'ai',
    description: 'AI 生成场景背景图',
    icon: 'ThunderboltOutlined',
    inputs: [
      { name: 'scenes', type: 'main', label: '场景描述', required: true }
    ],
    outputs: [
      { name: 'sceneImages', type: 'main', label: '场景图片' },
      { name: 'error', type: 'error', label: '错误输出' }
    ],
    defaultConfig: {
      provider: 'stability',
      model: 'sdxl',
      style: 'anime',
      lighting: 'natural'
    }
  },

  'image-generator': {
    type: 'image-generator',
    name: '图片生成',
    category: 'ai',
    description: '通用 AI 图片生成',
    icon: 'PictureOutlined',
    inputs: [
      { name: 'prompt', type: 'main', label: '提示词', required: true }
    ],
    outputs: [
      { name: 'image', type: 'main', label: '生成的图片' }
    ],
    defaultConfig: {
      provider: 'stability',
      model: 'sdxl',
      size: '1024x1024',
      quality: 'high'
    }
  },

  'consistency-check': {
    type: 'consistency-check',
    name: '一致性检查',
    category: 'ai',
    description: '检查角色和场景的一致性',
    icon: 'FilterOutlined',
    inputs: [
      { name: 'images', type: 'main', label: '图片列表', required: true },
      { name: 'reference', type: 'main', label: '参考图片' }
    ],
    outputs: [
      { name: 'passed', type: 'main', label: '通过' },
      { name: 'issues', type: 'main', label: '问题列表' },
      { name: 'fixed', type: 'main', label: '修复后图片' }
    ],
    defaultConfig: {
      strictness: 0.8,
      autoFix: true
    }
  },

  'lip-sync-generator': {
    type: 'lip-sync-generator',
    name: '口型同步',
    category: 'ai',
    description: '生成匹配音频的口型动画',
    icon: 'SoundOutlined',
    inputs: [
      { name: 'audio', type: 'main', label: '音频', required: true },
      { name: 'characterImage', type: 'main', label: '角色图片', required: true }
    ],
    outputs: [
      { name: 'animated', type: 'main', label: '动画结果' }
    ],
    defaultConfig: {
      method: 'POST',
      quality: 'high'
    }
  },

  // ========== 媒体处理节点 ==========
  'image-renderer': {
    type: 'image-renderer',
    name: '图片渲染',
    category: 'media',
    description: '渲染分镜为高质量图片',
    icon: 'PictureOutlined',
    inputs: [
      { name: 'storyboards', type: 'main', label: '分镜', required: true }
    ],
    outputs: [
      { name: 'images', type: 'main', label: '渲染结果' }
    ],
    defaultConfig: {
      renderer: 'stable-diffusion',
      quality: 'high',
      format: 'png'
    }
  },

  'video-composer': {
    type: 'video-composer',
    name: '视频合成',
    category: 'media',
    description: '合成图片和音频为视频',
    icon: 'PlayCircleOutlined',
    inputs: [
      { name: 'images', type: 'main', label: '图片序列', required: true },
      { name: 'audio', type: 'main', label: '音频' }
    ],
    outputs: [
      { name: 'video', type: 'main', label: '合成视频' }
    ],
    defaultConfig: {
      fps: 30,
      resolution: '1920x1080',
      duration: 3
    }
  },

  'audio-mixer': {
    type: 'audio-mixer',
    name: '音频混音',
    category: 'media',
    description: '混合背景音乐和配音',
    icon: 'SoundOutlined',
    inputs: [
      { name: 'voiceover', type: 'main', label: '配音', required: true },
      { name: 'background', type: 'main', label: '背景音乐' },
      { name: 'effects', type: 'main', label: '音效' }
    ],
    outputs: [
      { name: 'mixed', type: 'main', label: '混合音频' }
    ],
    defaultConfig: {
      voiceVolume: 1.0,
      bgmVolume: 0.3,
      effectsVolume: 0.5
    }
  },

  'subtitle-generator': {
    type: 'subtitle-generator',
    name: '字幕生成',
    category: 'media',
    description: '根据剧本生成字幕',
    icon: 'CodeOutlined',
    inputs: [
      { name: 'script', type: 'main', label: '剧本', required: true },
      { name: 'audio', type: 'main', label: '音频' }
    ],
    outputs: [
      { name: 'subtitles', type: 'main', label: '字幕文件' }
    ],
    defaultConfig: {
      format: 'srt',
      language: 'zh-CN',
      style: 'default'
    }
  },

  'transition-adder': {
    type: 'transition-adder',
    name: '转场添加',
    category: 'media',
    description: '为视频添加转场效果',
    icon: 'SwapOutlined',
    inputs: [
      { name: 'video', type: 'main', label: '视频', required: true }
    ],
    outputs: [
      { name: 'result', type: 'main', label: '添加转场后' }
    ],
    defaultConfig: {
      type: 'fade',
      duration: 0.5
    }
  },

  'effects-adder': {
    type: 'effects-adder',
    name: '特效添加',
    category: 'media',
    description: '添加视觉特效',
    icon: 'ExperimentOutlined',
    inputs: [
      { name: 'video', type: 'main', label: '视频', required: true }
    ],
    outputs: [
      { name: 'result', type: 'main', label: '添加特效后' }
    ],
    defaultConfig: {
      effects: []
    }
  },

  // ========== 输出节点 ==========
  'video-export': {
    type: 'video-export',
    name: '视频导出',
    category: 'output',
    description: '导出最终视频文件',
    icon: 'ExportOutlined',
    inputs: [
      { name: 'video', type: 'main', label: '视频', required: true },
      { name: 'subtitles', type: 'main', label: '字幕' }
    ],
    outputs: [
      { name: 'file', type: 'main', label: '输出文件' }
    ],
    defaultConfig: {
      format: 'mp4',
      codec: 'h264',
      quality: 'high',
      resolution: '1920x1080'
    }
  },

  'image-export': {
    type: 'image-export',
    name: '图片导出',
    category: 'output',
    description: '导出图片文件',
    icon: 'CloudDownloadOutlined',
    inputs: [
      { name: 'images', type: 'main', label: '图片', required: true }
    ],
    outputs: [
      { name: 'files', type: 'main', label: '输出文件' }
    ],
    defaultConfig: {
      format: 'png',
      quality: "high"
    }
  },

  'audio-export': {
    type: 'audio-export',
    name: '音频导出',
    category: 'output',
    description: '导出音频文件',
    icon: 'SoundOutlined',
    inputs: [
      { name: 'audio', type: 'main', label: '音频', required: true }
    ],
    outputs: [
      { name: 'file', type: 'main', label: '输出文件' }
    ],
    defaultConfig: {
      format: 'mp3',
      bitrate: '192k'
    }
  },

  // ========== 逻辑控制节点 ==========
  'condition': {
    type: 'condition',
    name: '条件分支',
    category: 'logic',
    description: '根据条件分支执行',
    icon: 'BranchesOutlined',
    inputs: [
      { name: 'input', type: 'main', label: '输入', required: true }
    ],
    outputs: [
      { name: 'true', type: 'main', label: '满足条件' },
      { name: 'false', type: 'main', label: '不满足条件' }
    ],
    defaultConfig: {
      condition: '',
      operator: 'equals'
    }
  },

  'loop': {
    type: 'loop',
    name: '循环',
    category: 'logic',
    description: '循环执行节点',
    icon: 'SyncOutlined',
    inputs: [
      { name: 'input', type: 'main', label: '输入数据' }
    ],
    outputs: [
      { name: 'output', type: 'main', label: '每次迭代' },
      { name: 'done', type: 'main', label: '完成后' }
    ],
    defaultConfig: {
      iterations: 3,
      mode: 'foreach'
    }
  },

  'parallel': {
    type: 'parallel',
    name: '并行执行',
    category: 'logic',
    description: '并行执行多个分支',
    icon: 'BranchesOutlined',
    inputs: [
      { name: 'input', type: 'main', label: '输入', required: true }
    ],
    outputs: [
      { name: 'branch1', type: 'main', label: '分支1' },
      { name: 'branch2', type: 'main', label: '分支2' }
    ],
    defaultConfig: {
      branches: 2
    }
  },

  'merge': {
    type: 'merge',
    name: '合并',
    category: 'logic',
    description: '合并多个输入',
    icon: 'SwapOutlined',
    inputs: [
      { name: 'input1', type: 'main', label: '输入1', required: true },
      { name: 'input2', type: 'main', label: '输入2' }
    ],
    outputs: [
      { name: 'output', type: 'main', label: '合并结果' }
    ],
    defaultConfig: {
      mode: 'append'
    }
  },

  'delay': {
    type: 'delay',
    name: '延迟',
    category: 'logic',
    description: '延迟执行',
    icon: 'ClockCircleOutlined',
    inputs: [
      { name: 'input', type: 'main', label: '输入' }
    ],
    outputs: [
      { name: 'output', type: 'main', label: '延迟后输出' }
    ],
    defaultConfig: {
      delayMs: 1000
    }
  },

  // ========== 工具节点 ==========
  'variable-set': {
    type: 'variable-set',
    name: '变量设置',
    category: 'utility',
    description: '设置变量值',
    icon: 'DatabaseOutlined',
    inputs: [
      { name: 'input', type: 'main', label: '输入' }
    ],
    outputs: [
      { name: 'output', type: 'main', label: '输出' }
    ],
    defaultConfig: {
      variableName: '',
      variableValue: ''
    }
  },

  'variable-get': {
    type: 'variable-get',
    name: '变量获取',
    category: 'utility',
    description: '获取变量值',
    icon: 'DatabaseOutlined',
    inputs: [],
    outputs: [
      { name: 'value', type: 'main', label: '变量值' }
    ],
    defaultConfig: {
      variableName: ''
    }
  },

  'http-request': {
    type: 'http-request',
    name: 'HTTP 请求',
    category: 'utility',
    description: '发送 HTTP 请求',
    icon: 'ApiOutlined',
    inputs: [
      { name: 'body', type: 'main', label: '请求体' }
    ],
    outputs: [
      { name: 'response', type: 'main', label: '响应' },
      { name: 'error', type: 'error', label: '错误' }
    ],
    defaultConfig: {
      url: '',
      method: 'GET',
      headers: {}
    }
  },

  'transform': {
    type: 'transform',
    name: '数据转换',
    category: 'utility',
    description: '转换数据格式',
    icon: 'TransformOutlined',
    inputs: [
      { name: 'input', type: 'main', label: '输入', required: true }
    ],
    outputs: [
      { name: 'output', type: 'main', label: '转换结果' }
    ],
    defaultConfig: {
      transformType: 'map'
    }
  }
};

// ========== 图标映射 ==========
const ICON_MAP: Record<string, React.ReactNode> = {};

// ========== 获取节点模板 ==========
export function getNodeTemplate(type: string): NodeTemplate | undefined {
  return NODE_TEMPLATES[type];
}

// ========== 按类别获取节点 ==========
export function getNodesByCategory(category: NodeCategory): NodeTemplate[] {
  return Object.values(NODE_TEMPLATES).filter(
    node => node.category === category
  );
}

// ========== 类别信息 ==========
export const CATEGORY_INFO: Record<NodeCategory, { label: string; color: string }> = {
  input: { label: '输入', color: '#52c41a' },
  ai: { label: 'AI 处理', color: '#1890ff' },
  media: { label: '媒体处理', color: '#722ed1' },
  output: { label: '输出', color: '#fa541c' },
  logic: { label: '逻辑控制', color: '#faad14' },
  utility: { label: '工具', color: '#8c8c8c' },
  transform: { label: '转换', color: '#13c2c2' }
};
