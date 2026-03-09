/**
 * 图像生成服务 - 国产大模型集成
 * 支持：字节 Seedream、快手可灵、生数 Vidu
 */

import axios from 'axios';

// ========== 类型定义 ==========

export type ImageModel = 'seedream-5.0' | 'kling-1.6' | 'kling-3.0' | 'vidu-2.0';

export type ImageSize = '1K' | '2K' | '4K' | `${number}x${number}`;

export interface ImageGenerationOptions {
  /** 图像模型 */
  model?: ImageModel;
  /** 图像尺寸 */
  size?: ImageSize;
  /** 生成数量 */
  numImages?: number;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 风格 */
  style?: 'anime' | 'realistic' | 'cartoon' | '3d';
  /** 图像质量 */
  quality?: 'standard' | 'high' | 'premium';
}

export interface ImageGenerationResult {
  /** 图片 URL */
  url: string;
  /** 图片 base64 */
  base64?: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 生成的模型 */
  model: string;
  /** 耗时 (ms) */
  processingTime?: number;
}

export interface VideoGenerationOptions {
  /** 视频模型 */
  model?: 'seedance-2.0' | 'kling-1.6' | 'kling-3.0' | 'vidu-2.0';
  /** 视频时长 (秒) */
  duration?: number;
  /** 帧率 */
  fps?: number;
  /** 参考图片 */
  referenceImage?: string;
  /** 提示词 */
  prompt?: string;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 画面比例 */
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
}

export interface VideoGenerationResult {
  /** 视频 URL */
  url: string;
  /** 封面图 URL */
  coverUrl?: string;
  /** 视频时长 (秒) */
  duration: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 生成的模型 */
  model: string;
  /** 任务 ID */
  taskId?: string;
  /** 状态 */
  status: 'processing' | 'completed' | 'failed';
}

// ========== 工具函数 ==========

/**
 * 获取 API Key
 */
async function getAPIKey(service: string): Promise<string> {
  // 从存储服务获取 API Key
  const storageService = await import('./storage.service');
  const keys = await storageService.storageService.get('api_keys');

  if (keys && typeof keys === 'object') {
    const keyObj = keys as Record<string, string>;
    return keyObj[service] || keyObj[`${service}_api_key`] || '';
  }

  return '';
}

/**
 * 解析图像尺寸
 */
function parseSize(size: ImageSize): { width: number; height: number } {
  if (size === '1K') return { width: 1024, height: 1024 };
  if (size === '2K') return { width: 2048, height: 2048 };
  if (size === '4K') return { width: 4096, height: 4096 };

  const [w, h] = size.split('x').map(Number);
  return { width: w || 1024, height: h || 1024 };
}

/**
 * 映射可灵尺寸
 */
function mapKlingSize(size: ImageSize): string {
  const map: Record<string, string> = {
    '1K': '1024x1024',
    '2K': '2048x2048',
    '4K': '4096x4096'
  };
  return map[size] || size;
}

/**
 * 映射 Vidu 尺寸
 */
function mapViduSize(size: ImageSize): string {
  const map: Record<string, string> = {
    '1K': '1024x1024',
    '2K': '1920x1920',
    '4K': '3840x2160'
  };
  return map[size] || size;
}

// ========== 字节 Seedream 服务 ==========

/**
 * 字节 Seedream 图像生成
 * 文档: https://www.volcengine.com/docs/6792
 */
export async function generateWithSeedream(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const {
    size = '2K',
    numImages = 1,
    negativePrompt,
    quality = 'standard'
  } = options;

  const apiKey = await getAPIKey('seedream');
  const startTime = Date.now();

  const response = await axios({
    method: 'post',
    url: 'https://ark.cn-beijing.volces.com/api/v3/images/generations',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: 'doubao-seedream-4-0-250828',
      prompt,
      size,
      n: numImages,
      negative_prompt: negativePrompt,
      response_format: 'url',
      quality
    }
  });

  const imageData = response.data?.data?.[0];

  return {
    url: imageData?.url || '',
    width: parseSize(size).width,
    height: parseSize(size).height,
    model: 'seedream-5.0',
    processingTime: Date.now() - startTime
  };
}

// ========== 快手可灵服务 ==========

/**
 * 快手可灵图像生成
 */
export async function generateWithKling(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const {
    size = '2K',
    numImages = 1,
    negativePrompt
  } = options;

  const apiKey = await getAPIKey('kling');
  const startTime = Date.now();

  const response = await axios({
    method: 'post',
    url: 'https://api.klingai.com/v1/images/generations',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: 'kling-v1-6',
      prompt,
      image_count: numImages,
      negative_prompt: negativePrompt,
      size: mapKlingSize(size)
    }
  });

  const imageData = response.data?.images?.[0];

  return {
    url: imageData?.url || '',
    width: imageData?.width || 1024,
    height: imageData?.height || 1024,
    model: 'kling-1.6',
    processingTime: Date.now() - startTime
  };
}

/**
 * 快手可灵视频生成
 */
export async function generateVideoWithKling(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  const {
    duration = 5,
    referenceImage,
    negativePrompt,
    aspectRatio = '16:9'
  } = options;

  const apiKey = await getAPIKey('kling');

  const response = await axios({
    method: 'post',
    url: 'https://api.klingai.com/v1/videos/generations',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: 'kling-v1-6',
      prompt,
      negative_prompt: negativePrompt,
      duration,
      image_url: referenceImage,
      aspect_ratio: aspectRatio
    }
  });

  const videoData = response.data;

  return {
    url: videoData?.url || '',
    coverUrl: videoData?.cover_url,
    duration,
    width: videoData?.width || 1920,
    height: videoData?.height || 1080,
    model: 'kling-1.6',
    taskId: videoData?.task_id,
    status: 'processing'
  };
}

// ========== 生数 Vidu 服务 ==========

/**
 * Vidu 图像生成
 */
export async function generateWithVidu(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const {
    size = '2K',
    numImages = 1,
    negativePrompt
  } = options;

  const apiKey = await getAPIKey('vidu');
  const startTime = Date.now();

  const response = await axios({
    method: 'post',
    url: 'https://api.vidu.cn/v1/images/generations',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: 'vidu-2-0',
      prompt,
      num_images: numImages,
      negative_prompt: negativePrompt,
      size: mapViduSize(size)
    }
  });

  const imageData = response.data?.data?.[0];

  return {
    url: imageData?.url || '',
    width: imageData?.width || 1024,
    height: imageData?.height || 1024,
    model: 'vidu-2.0',
    processingTime: Date.now() - startTime
  };
}

/**
 * Vidu 视频生成
 */
export async function generateVideoWithVidu(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  const {
    duration = 5,
    referenceImage,
    negativePrompt,
    aspectRatio = '16:9'
  } = options;

  const apiKey = await getAPIKey('vidu');

  const response = await axios({
    method: 'post',
    url: 'https://api.vidu.cn/v1/videos/generations',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: 'vidu-2-0',
      prompt,
      negative_prompt: negativePrompt,
      duration,
      first_frame_image: referenceImage,
      aspect_ratio: aspectRatio
    }
  });

  const videoData = response.data;

  return {
    url: videoData?.url || '',
    coverUrl: videoData?.cover_image_url,
    duration,
    width: videoData?.width || 1920,
    height: videoData?.height || 1080,
    model: 'vidu-2.0',
    taskId: videoData?.task_id,
    status: 'processing'
  };
}

// ========== Seedance 视频生成 (字节) ==========

/**
 * Seedance 视频生成 (字节)
 */
export async function generateVideoWithSeedance(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  const {
    duration = 5,
    referenceImage,
    negativePrompt,
    aspectRatio = '16:9'
  } = options;

  const apiKey = await getAPIKey('seedance');

  const response = await axios({
    method: 'post',
    url: 'https://ark.cn-beijing.volces.com/api/v3/video/generations',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: 'seedance-2-0-250212',
      prompt,
      negative_prompt: negativePrompt,
      duration,
      image_url: referenceImage,
      aspect_ratio: aspectRatio
    }
  });

  const videoData = response.data?.data?.[0];

  return {
    url: videoData?.url || '',
    coverUrl: videoData?.cover_image_url,
    duration,
    width: videoData?.width || 1920,
    height: videoData?.height || 1080,
    model: 'seedance-2.0',
    taskId: videoData?.task_id,
    status: 'processing'
  };
}

// ========== 统一 API ==========

/**
 * 图像生成 - 统一入口
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const model = options.model || 'seedream-5.0';

  switch (model) {
    case 'seedream-5.0':
      return generateWithSeedream(prompt, options);
    case 'kling-1.6':
      return generateWithKling(prompt, options);
    case 'vidu-2.0':
      return generateWithVidu(prompt, options);
    default:
      // 默认使用 Seedream
      return generateWithSeedream(prompt, options);
  }
}

/**
 * 视频生成 - 统一入口
 */
export async function generateVideo(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  const model = options.model || 'seedance-2.0';

  switch (model) {
    case 'seedance-2.0':
      return generateVideoWithSeedance(prompt, options);
    case 'kling-1.6':
      return generateVideoWithKling(prompt, options);
    case 'vidu-2.0':
      return generateVideoWithVidu(prompt, options);
    default:
      return generateVideoWithSeedance(prompt, options);
  }
}

/**
 * 查询视频生成状态
 */
export async function getVideoStatus(taskId: string, model: string = 'seedance-2.0'): Promise<VideoGenerationResult> {
  let url = '';
  let apiKey = '';

  switch (model) {
    case 'seedance-2.0':
      url = `https://ark.cn-beijing.volces.com/api/v3/video/tasks/${taskId}`;
      apiKey = await getAPIKey('seedance');
      break;
    case 'kling-1.6':
      url = `https://api.klingai.com/v1/videos/tasks/${taskId}`;
      apiKey = await getAPIKey('kling');
      break;
    case 'vidu-2.0':
      url = `https://api.vidu.cn/v1/videos/tasks/${taskId}`;
      apiKey = await getAPIKey('vidu');
      break;
  }

  const response = await axios({
    method: 'get',
    url,
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const data = response.data?.data || response.data;

  return {
    url: data?.url || '',
    coverUrl: data?.cover_image_url || data?.cover_url,
    duration: data?.duration || 5,
    width: data?.width || 1920,
    height: data?.height || 1080,
    model,
    taskId,
    status: data?.status || 'processing'
  };
}

// ========== 服务导出 ==========

export const imageGenerationService = {
  generateImage,
  generateVideo,
  getVideoStatus,
  // 单独服务
  seedream: generateWithSeedream,
  kling: {
    image: generateWithKling,
    video: generateVideoWithKling
  },
  vidu: {
    image: generateWithVidu,
    video: generateVideoWithVidu
  },
  seedance: generateVideoWithSeedance
};

export default imageGenerationService;
