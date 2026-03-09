/**
 * ManGa AI - 工作流配置
 * 包含工作流步骤定义和详细配置
 */

import React from 'react';
import { 
  UploadOutlined, 
  FileTextOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  ExportOutlined,
  PictureOutlined
} from '@ant-design/icons';

// 工作流步骤定义
export const WORKFLOW_STEPS = [
  { 
    key: 'import', 
    title: '📥 导入', 
    icon: <UploadOutlined />,
    color: '#6366f1',
    description: '上传小说/漫画素材'
  },
  { 
    key: 'generate', 
    title: '🤖 生成', 
    icon: <ThunderboltOutlined />,
    color: '#8b5cf6',
    description: 'AI 智能生成内容'
  },
  { 
    key: 'storyboard', 
    title: '🎬 分镜', 
    icon: <PictureOutlined />,
    color: '#ec4899',
    description: 'AI 智能分镜设计'
  },
  { 
    key: 'character', 
    title: '👤 角色', 
    icon: <FileTextOutlined />,
    color: '#f59e0b',
    description: '角色形象设计'
  },
  { 
    key: 'render', 
    title: '🎨 渲染', 
    icon: <PlayCircleOutlined />,
    color: '#10b981',
    description: '场景与角色渲染'
  },
  { 
    key: 'animate', 
    title: '✨ 合成', 
    icon: <SettingOutlined />,
    color: '#06b6d4',
    description: '动态合成与转场'
  },
  { 
    key: 'export', 
    title: '📤 导出', 
    icon: <ExportOutlined />,
    color: '#f97316',
    description: '导出视频/合集'
  },
];

// 工作流步骤配置接口
export interface WorkflowStep {
  key: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  settings?: StepSetting[];
}

export interface StepSetting {
  key: string;
  label: string;
  type: 'select' | 'slider' | 'toggle' | 'input' | 'color';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  default: unknown;
}

// 导入步骤配置
export const IMPORT_SETTINGS: StepSetting[] = [
  {
    key: 'importType',
    label: '导入类型',
    type: 'select',
    options: [
      { value: 'novel', label: '小说文件' },
      { value: 'script', label: '剧本文件' },
      { value: 'prompt', label: 'AI提示词' },
    ],
    default: 'novel'
  },
  {
    key: 'fileEncoding',
    label: '文件编码',
    type: 'select',
    options: [
      { value: 'auto', label: '自动检测' },
      { value: 'utf-8', label: 'UTF-8' },
      { value: 'gbk', label: 'GBK' },
    ],
    default: 'auto'
  },
  {
    key: 'parseChapter',
    label: '智能分章',
    type: 'toggle',
    default: true
  },
  {
    key: 'extractCharacters',
    label: '提取角色',
    type: 'toggle',
    default: true
  }
];

// 生成步骤配置 (剧本生成)
export const GENERATE_SETTINGS: StepSetting[] = [
  {
    key: 'model',
    label: 'AI模型',
    type: 'select',
    options: [
      { value: 'auto', label: '🤖 自动选择 (根据API Key)' },
      { value: 'glm-5', label: 'GLM-5 (智谱)' },
      { value: 'minimax-m2.5', label: 'MiniMax M2.5' },
      { value: 'kimi-k2.5', label: 'Kimi K2.5 (月之暗面)' },
      { value: 'doubao-2.0', label: '豆包 2.0 (字节)' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'claude-3.5', label: 'Claude 3.5' },
      { value: 'qwen-2.5', label: 'Qwen 2.5 (阿里)' },
    ],
    default: 'auto'
  },
  {
    key: 'episodes',
    label: '生成集数',
    type: 'slider',
    min: 1,
    max: 200,
    default: 12
  },
  {
    key: 'episodesPerChapter',
    label: '每章集数',
    type: 'slider',
    min: 1,
    max: 10,
    default: 2
  },
  {
    key: 'scriptStyle',
    label: '剧本风格',
    type: 'select',
    options: [
      { value: 'standard', label: '标准格式' },
      { value: 'dramatic', label: '戏剧化' },
      { value: 'comic', label: '漫画分镜式' },
    ],
    default: 'comic'
  },
  {
    key: 'dialogueDetail',
    label: '对白详细度',
    type: 'slider',
    min: 1,
    max: 5,
    default: 3
  },
  {
    key: 'autoReview',
    label: '自动审核',
    type: 'toggle',
    default: true
  }
];

// 分镜步骤配置
export const STORYBOARD_SETTINGS: StepSetting[] = [
  {
    key: 'aspectRatio',
    label: '画面比例',
    type: 'select',
    options: [
      { value: '9:16', label: '竖屏 (9:16) - 抖音/快手' },
      { value: '16:9', label: '横屏 (16:9) - YouTube' },
      { value: '1:1', label: '方形 (1:1) - Instagram' },
      { value: '4:3', label: '经典 (4:3)' },
    ],
    default: '9:16'
  },
  {
    key: 'resolution',
    label: '分辨率',
    type: 'select',
    options: [
      { value: '720p', label: '720p (HD)' },
      { value: '1080p', label: '1080p (Full HD)' },
      { value: '4k', label: '4K (Ultra HD)' },
    ],
    default: '1080p'
  },
  {
    key: 'framesPerScene',
    label: '每场景镜头数',
    type: 'slider',
    min: 1,
    max: 9,
    default: 3
  },
  {
    key: 'transitionStyle',
    label: '转场风格',
    type: 'select',
    options: [
      { value: 'auto', label: '自动匹配' },
      { value: 'smooth', label: '平滑过渡' },
      { value: 'sharp', label: '快速切换' },
      { value: 'dramatic', label: '戏剧化' },
    ],
    default: 'auto'
  },
  {
    key: 'cameraMovement',
    label: '镜头运动',
    type: 'toggle',
    default: true
  },
  {
    key: 'addPanz',
    label: '分镜标注',
    type: 'toggle',
    default: true
  }
];

// 角色步骤配置
export const CHARACTER_SETTINGS: StepSetting[] = [
  {
    key: 'style',
    label: '角色风格',
    type: 'select',
    options: [
      { value: 'anime', label: '日漫风' },
      { value: 'western', label: '美漫风' },
      { value: 'chinese', label: '国漫画风' },
      { value: 'realistic', label: '写实风' },
    ],
    default: 'anime'
  },
  {
    key: 'consistency',
    label: '一致性引擎',
    type: 'toggle',
    default: true
  },
  {
    key: 'expressionVariation',
    label: '表情变化数',
    type: 'slider',
    min: 3,
    max: 12,
    default: 6
  },
  {
    key: 'poseVariation',
    label: '姿态变化数',
    type: 'slider',
    min: 2,
    max: 8,
    default: 4
  },
  {
    key: 'clothingVariation',
    label: '服装变化',
    type: 'toggle',
    default: true
  },
  {
    key: 'voiceMatch',
    label: '声线匹配',
    type: 'toggle',
    default: true
  }
];

// 渲染步骤配置 (图像生成)
export const RENDER_SETTINGS: StepSetting[] = [
  {
    key: 'imageModel',
    label: '图像模型',
    type: 'select',
    options: [
      { value: 'auto', label: '🤖 自动选择 (根据API Key)' },
      { value: 'seedream-5.0', label: 'Seedream 5.0 (字节)' },
      { value: 'kling-1.6', label: '可灵 1.6 (快手)' },
      { value: 'vidu-2.0', label: 'Vidu 2.0 (生数)' },
      { value: 'flux-pro', label: 'Flux Pro (BlackForest)' },
      { value: 'ideogram-3', label: 'Ideogram 3.0' },
      { value: 'recraft-v3', label: 'Recraft V3' },
    ],
    default: 'auto'
  },
  {
    key: 'engine',
    label: '渲染引擎',
    type: 'select',
    options: [
      { value: 'fast', label: '快速渲染' },
      { value: 'quality', label: '高质量' },
      { value: 'realtime', label: '实时预览' },
    ],
    default: 'fast'
  },
  {
    key: 'backgroundStyle',
    label: '背景风格',
    type: 'select',
    options: [
      { value: 'ai-generated', label: 'AI生成' },
      { value: 'template', label: '模板库' },
      { value: 'custom', label: '自定义' },
    ],
    default: 'ai-generated'
  },
  {
    key: 'lighting',
    label: '光照效果',
    type: 'select',
    options: [
      { value: 'auto', label: '自动' },
      { value: 'bright', label: '明亮' },
      { value: 'moody', label: '氛围' },
      { value: 'dramatic', label: '戏剧化' },
    ],
    default: 'auto'
  },
  {
    key: 'colorGrade',
    label: '色调',
    type: 'select',
    options: [
      { value: 'auto', label: '自动匹配' },
      { value: 'warm', label: '暖色调' },
      { value: 'cool', label: '冷色调' },
      { value: 'vibrant', label: '鲜艳' },
      { value: 'muted', label: '低调' },
    ],
    default: 'auto'
  },
  {
    key: 'renderQuality',
    label: '渲染质量',
    type: 'slider',
    min: 1,
    max: 100,
    default: 80
  }
];

// 合成步骤配置 (包含配音和视频生成)
export const ANIMATE_SETTINGS: StepSetting[] = [
  {
    key: 'videoModel',
    label: '视频生成模型',
    type: 'select',
    options: [
      { value: 'auto', label: '🤖 自动选择 (根据API Key)' },
      { value: 'seedance-2.0', label: 'Seedance 2.0 (字节)' },
      { value: 'kling-1.6', label: '可灵 1.6 (快手)' },
      { value: 'vidu-2.0', label: 'Vidu 2.0 (生数)' },
      { value: 'runway-gen3', label: 'Gen-3 (Runway)' },
      { value: 'pika-1.0', label: 'Pika 1.0' },
    ],
    default: 'auto'
  },
  {
    key: 'animationType',
    label: '动画类型',
    type: 'select',
    options: [
      { value: 'auto', label: '自动匹配' },
      { value: 'lip-sync', label: '对口型' },
      { value: 'gesture', label: '肢体动作' },
      { value: 'full', label: '全身动画' },
    ],
    default: 'auto'
  },
  {
    key: 'fps',
    label: '帧率',
    type: 'select',
    options: [
      { value: '24', label: '24 fps (电影)' },
      { value: '30', label: '30 fps (标准)' },
      { value: '60', label: '60 fps (流畅)' },
    ],
    default: '30'
  },
  {
    key: 'transitionEffect',
    label: '转场效果',
    type: 'select',
    options: [
      { value: 'none', label: '无' },
      { value: 'fade', label: '淡入淡出' },
      { value: 'slide', label: '滑动' },
      { value: 'zoom', label: '缩放' },
      { value: 'blur', label: '模糊' },
    ],
    default: 'fade'
  },
  {
    key: 'addEffects',
    label: '添加特效',
    type: 'toggle',
    default: true
  },
  {
    key: 'addParticles',
    label: '粒子效果',
    type: 'toggle',
    default: false
  },
  // 语音合成配置
  {
    key: 'ttsProvider',
    label: '语音合成',
    type: 'select',
    options: [
      { value: 'edge-tts', label: 'Edge TTS (微软)' },
      { value: 'azure-tts', label: 'Azure TTS (微软)' },
      { value: 'alibaba-tts', label: '阿里云 TTS' },
      { value: 'baidu-tts', label: '百度 TTS' },
      { value: 'tencent-tts', label: '腾讯云 TTS' },
      { value: 'iflytek-tts', label: '讯飞 TTS' },
    ],
    default: 'edge-tts'
  },
  {
    key: 'ttsVoice',
    label: '配音音色',
    type: 'select',
    options: [
      { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女声)' },
      { value: 'zh-CN-YunxiNeural', label: '云希 (男声)' },
      { value: 'zh-CN-YunyangNeural', label: '云扬 (男声)' },
      { value: 'zh-CN-XiaoyiNeural', label: '小艺 (女声)' },
      { value: 'zh-CN-XiaomengNeural', label: '小梦 (女声)' },
    ],
    default: 'zh-CN-XiaoxiaoNeural'
  },
  {
    key: 'ttsSpeed',
    label: '语速',
    type: 'slider',
    min: 0.5,
    max: 2.0,
    default: 1.0
  },
  {
    key: 'ttsPitch',
    label: '音调',
    type: 'slider',
    min: -2,
    max: 2,
    default: 0
  },
  {
    key: 'addBackgroundMusic',
    label: '添加背景音乐',
    type: 'toggle',
    default: true
  },
  {
    key: 'bgmVolume',
    label: 'BGM 音量',
    type: 'slider',
    min: 0,
    max: 100,
    default: 30
  }
];

// 导出步骤配置
export const EXPORT_SETTINGS: StepSetting[] = [
  {
    key: 'format',
    label: '视频格式',
    type: 'select',
    options: [
      { value: 'mp4', label: 'MP4 (H.264)' },
      { value: 'webm', label: 'WebM (VP9)' },
      { value: 'mov', label: 'MOV (ProRes)' },
    ],
    default: 'mp4'
  },
  {
    key: 'quality',
    label: '视频质量',
    type: 'select',
    options: [
      { value: 'low', label: '低 (压缩)' },
      { value: 'medium', label: '中 (平衡)' },
      { value: 'high', label: '高 (无损)' },
    ],
    default: 'medium'
  },
  {
    key: 'addSubtitles',
    label: '添加字幕',
    type: 'toggle',
    default: true
  },
  {
    key: 'subtitleStyle',
    label: '字幕样式',
    type: 'select',
    options: [
      { value: 'classic', label: '经典' },
      { value: 'modern', label: '现代' },
      { value: 'animated', label: '动画' },
    ],
    default: 'modern'
  },
  {
    key: 'addWatermark',
    label: '添加水印',
    type: 'toggle',
    default: false
  },
  {
    key: 'exportThumbnails',
    label: '导出缩略图',
    type: 'toggle',
    default: true
  },
  {
    key: 'splitEpisodes',
    label: '分集导出',
    type: 'toggle',
    default: true
  }
];

// 导出所有配置
export const WORKFLOW_CONFIGS: Record<string, StepSetting[]> = {
  import: IMPORT_SETTINGS,
  generate: GENERATE_SETTINGS,
  storyboard: STORYBOARD_SETTINGS,
  character: CHARACTER_SETTINGS,
  render: RENDER_SETTINGS,
  animate: ANIMATE_SETTINGS,
  export: EXPORT_SETTINGS
};
