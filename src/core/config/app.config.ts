/**
 * 应用配置
 * 集中管理所有配置项，禁止硬编码
 */

// 应用信息
export const APP_CONFIG = Object.freeze({
  name: 'ManGa AI',
  nameZh: 'ManGa AI',
  version: '2.0.0',
  description: 'AI-Powered Comic Drama Video Creation Platform',
  repository: 'https://github.com/Agions/ManGaAI',
  license: 'MIT'
} as const);

// 存储配置
export const STORAGE_CONFIG = Object.freeze({
  prefix: 'manga_ai_',
  keys: Object.freeze({
    store: 'manga_ai_store',
    settings: 'manga_ai_settings',
    projects: 'manga_ai_projects',
    cache: 'manga_ai_cache'
  })
} as const);

// API 配置
export const API_CONFIG = Object.freeze({
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000
} as const);

// 支持的 AI 模型
export const AI_MODELS = Object.freeze({
  qwen: {
    id: 'qwen',
    name: '通义千问',
    provider: '阿里云',
    description: '阿里云通义千问大模型',
    apiKeyFormat: 'API_KEY',
    defaultModel: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  },
  baidu: {
    id: 'baidu',
    name: '文心一言',
    provider: '百度',
    description: '百度文心大模型',
    apiKeyFormat: 'API_KEY:SECRET_KEY',
    defaultModel: 'ernie-5.0',
    baseUrl: 'https://qianfan.baidubce.com/v2'
  },
  glm5: {
    id: 'glm5',
    name: '智谱 GLM-5',
    provider: '智谱AI',
    description: '智谱最新 GLM-5 大模型',
    apiKeyFormat: 'API_KEY',
    defaultModel: 'glm-5',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4'
  },
  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    provider: 'MiniMax',
    description: 'MiniMax M2.5 大模型',
    apiKeyFormat: 'API_KEY',
    defaultModel: 'minimax-m2.5',
    baseUrl: 'https://api.minimax.chat/v1'
  }
} as const);

// 视频处理配置
export const VIDEO_CONFIG = Object.freeze({
  maxFileSize: 1024 * 1024 * 1024, // 1GB
  supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  maxDuration: 3600, // 1小时
  thumbnailSize: { width: 320, height: 180 }
} as const);

// 导出配置
export const EXPORT_CONFIG = Object.freeze({
  formats: ['mp4', 'mov', 'webm'],
  qualities: ['low', 'medium', 'high', 'ultra'],
  defaultQuality: 'high'
} as const);

// 主题配置
export const THEME_CONFIG = Object.freeze({
  colors: Object.freeze({
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d'
  })
} as const);
