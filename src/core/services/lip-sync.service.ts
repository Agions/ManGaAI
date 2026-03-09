/**
 * 唇同步服务 - 音画对齐
 * 支持：Sync.so API、Wav2Lip (本地)
 */

import axios from 'axios';

// ========== 类型定义 ==========

export type LipSyncModel = 'lipsync-2' | 'wav2lip';

export interface LipSyncOptions {
  /** 同步模式 */
  syncMode?: 'cut_off' | 'loop' | 'smooth';
  /** 模型版本 */
  model?: LipSyncModel;
  /** 清晰度 */
  clarity?: 'fast' | 'balanced' | 'hd';
  /** 唇形强度 */
  lipStrength?: number;
}

export interface LipSyncResult {
  /** 结果视频 URL */
  url: string;
  /** 封面图 */
  coverUrl?: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 时长 */
  duration: number;
  /** 任务 ID */
  taskId?: string;
  /** 状态 */
  status: 'processing' | 'completed' | 'failed';
  /** 错误信息 */
  error?: string;
}

export interface TalkingFaceOptions {
  /** 驱动方式 */
  driver?: 'audio' | 'video';
  /** 表情强度 */
  expressionStrength?: number;
  /** 头部姿态 */
  headPose?: boolean;
}

export interface TalkingFaceResult {
  /** 结果视频 URL */
  url: string;
  /** 封面图 */
  coverUrl?: string;
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
  const storageService = await import('./storage.service');
  const keys = await storageService.storageService.get('api_keys');

  if (keys && typeof keys === 'object') {
    const keyObj = keys as Record<string, string>;
    return keyObj[service] || keyObj[`${service}_api_key`] || '';
  }

  return '';
}

// ========== Sync.so API ==========

/**
 * 使用 Sync.so 进行唇同步
 */
export async function syncLipWithSyncSo(
  videoUrl: string,
  audioUrl: string,
  options: LipSyncOptions = {}
): Promise<LipSyncResult> {
  const {
    syncMode = 'cut_off',
    model = 'lipsync-2',
    clarity = 'balanced'
  } = options;

  const apiKey = await getAPIKey('sync');

  const response = await axios({
    method: 'post',
    url: 'https://api.sync.so/v2/lipsync',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      input: [
        { type: 'video', url: videoUrl },
        { type: 'audio', url: audioUrl }
      ],
      model,
      options: {
        sync_mode: syncMode,
        clarity,
        lip_strength: options.lipStrength || 1.0
      }
    }
  });

  const data = response.data || response;

  return {
    url: data?.url || '',
    coverUrl: data?.cover_url,
    width: data?.width || 1920,
    height: data?.height || 1080,
    duration: data?.duration || 0,
    taskId: data?.task_id,
    status: data?.status || 'processing'
  };
}

// ========== SadTalker (本地/云端) ==========

/**
 * 使用 SadTalker 生成说话人脸
 * 需要本地部署 SadTalker 服务或使用云端 API
 */
export async function generateTalkingFace(
  imageUrl: string,
  audioUrl: string,
  options: TalkingFaceOptions = {}
): Promise<TalkingFaceResult> {
  const apiKey = await getAPIKey('sadtalker');

  const response = await axios({
    method: 'post',
    url: 'https://api.sadtalker.io/v1/generate',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      source_image: imageUrl,
      driven_audio: audioUrl,
      driver: options.driver || 'audio',
      expression_strength: options.expressionStrength || 1.0,
      head_pose: options.headPose !== false
    }
  });

  const data = response.data || response;

  return {
    url: data?.url || '',
    coverUrl: data?.cover_url,
    taskId: data?.task_id,
    status: data?.status || 'processing'
  };
}

// ========== 统一 API ==========

/**
 * 唇同步 - 统一入口
 */
export async function syncLip(
  videoUrl: string,
  audioUrl: string,
  options: LipSyncOptions = {}
): Promise<LipSyncResult> {
  return syncLipWithSyncSo(videoUrl, audioUrl, options);
}

/**
 * 生成说话人脸 - 统一入口
 */
export async function generateTalkingHead(
  imageUrl: string,
  audioUrl: string,
  options: TalkingFaceOptions = {}
): Promise<TalkingFaceResult> {
  return generateTalkingFace(imageUrl, audioUrl, options);
}

/**
 * 查询唇同步状态
 */
export async function getLipSyncStatus(taskId: string): Promise<LipSyncResult> {
  const apiKey = await getAPIKey('sync');

  const response = await axios({
    method: 'get',
    url: `https://api.sync.so/v2/lipsync/${taskId}`,
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const data = response.data || response;

  return {
    url: data?.url || '',
    coverUrl: data?.cover_url,
    width: data?.width || 1920,
    height: data?.height || 1080,
    duration: data?.duration || 0,
    taskId,
    status: data?.status || 'processing',
    error: data?.error
  };
}

/**
 * 查询说话人脸状态
 */
export async function getTalkingFaceStatus(taskId: string): Promise<TalkingFaceResult> {
  const apiKey = await getAPIKey('sadtalker');

  const response = await axios({
    method: 'get',
    url: `https://api.sadtalker.io/v1/generate/${taskId}`,
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const data = response.data || response;

  return {
    url: data?.url || '',
    coverUrl: data?.cover_url,
    taskId,
    status: data?.status || 'processing'
  };
}

// ========== 服务导出 ==========

export const lipSyncService = {
  syncLip,
  generateTalkingHead,
  getLipSyncStatus,
  getTalkingFaceStatus,
  // 底层方法
  syncWithSyncSo: syncLipWithSyncSo,
  generateWithSadTalker: generateTalkingFace
};

export default lipSyncService;
