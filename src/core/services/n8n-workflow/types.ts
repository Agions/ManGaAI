/**
 * n8n 风格工作流引擎 - 漫剧视频生成
 * 核心类型定义 - 支持每集独立工作流
 */

import type { ReactNode } from 'react';

// ========== 节点类别 ==========
export type NodeCategory =
  | 'input'      // 输入节点
  | 'ai'         // AI 处理节点
  | 'media'      // 媒体处理节点
  | 'transform'  // 转换节点
  | 'output'     // 输出节点
  | 'logic'      // 逻辑控制节点
  | 'utility';   // 工具节点

// ========== 节点类型 ==========
export type MangaNodeType =
  // 输入
  | 'novel-input'           // 小说输入
  | 'script-input'          // 剧本输入
  | 'image-input'           // 图片输入
  | 'video-input'           // 视频输入
  | 'audio-input'           // 音频输入
  // AI 处理
  | 'novel-parser'          // 小说解析
  | 'script-generator'      // 剧本生成
  | 'storyboard-generator'  // 分镜生成
  | 'character-generator'   // 角色生成
  | 'scene-generator'       // 场景生成
  | 'image-generator'       // 图片生成
  | 'consistency-check'     // 一致性检查
  | 'lip-sync-generator'    // 口型同步
  // 媒体处理
  | 'image-renderer'        // 图片渲染
  | 'video-composer'        // 视频合成
  | 'audio-mixer'          // 音频混音
  | 'subtitle-generator'   // 字幕生成
  | 'transition-adder'      // 转场添加
  | 'effects-adder'        // 特效添加
  // 输出
  | 'video-export'          // 视频导出
  | 'image-export'          // 图片导出
  | 'audio-export'          // 音频导出
  // 逻辑控制
  | 'condition'            // 条件分支
  | 'loop'                 // 循环
  | 'parallel'             // 并行执行
  | 'merge'                // 合并
  | 'delay'                // 延迟
  // 工具
  | 'variable-set'         // 变量设置
  | 'variable-get'         // 变量获取
  | 'http-request'         // HTTP 请求
  | 'transform';           // 数据转换

// ========== 连接点类型 ==========
export type ConnectionPortType = 'input' | 'output';

// ========== 连接定义 ==========
export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNode: string;
  targetPort: string;
}

// ========== 节点端口 ==========
export interface WorkflowPort {
  id: string;
  name: string;
  type: 'main' | 'error' | 'async';
  label?: string;
  required?: boolean;
  schema?: PortSchema;
}

export interface PortSchema {
  type: string;
  properties?: Record<string, unknown>;
}

// ========== 节点位置 ==========
export interface NodePosition {
  x: number;
  y: number;
}

// ========== 节点配置 ==========
export interface NodeConfig {
  // AI 配置
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  prompt?: string;

  // 处理配置
  quality?: 'low' | 'medium' | 'high';
  format?: string;
  resolution?: string;
  fps?: number;

  // 角色配置
  characterStyle?: string;
  consistencyLevel?: number;

  // 场景配置
  sceneStyle?: string;
  lighting?: string;

  // 音频配置
  voiceType?: string;
  voiceSpeed?: number;
  backgroundMusic?: string;
  volume?: number;

  // 条件配置
  condition?: string;
  operator?: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less';
  value?: unknown;

  // 循环配置
  iterations?: number;
  iteratorVariable?: string;

  // 延迟配置
  delayMs?: number;

  // HTTP 配置
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;

  // 变量配置
  variableName?: string;
  variableValue?: unknown;

  // 转换配置
  transformType?: 'map' | 'filter' | 'reduce' | 'custom';
  transformFn?: string;

  // 通用配置
  [key: string]: unknown;
}

// ========== 节点执行状态 ==========
export type NodeExecutionStatus =
  | 'pending'   // 待执行
  | 'running'   // 执行中
  | 'success'   // 成功
  | 'error'     // 错误
  | 'skipped';  // 跳过

// ========== 节点执行结果 ==========
export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  output?: unknown;
  error?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

// ========== 节点实例 ==========
export interface WorkflowNode {
  id: string;
  type: MangaNodeType;
  name: string;
  position: NodePosition;
  inputs: WorkflowPort[];
  outputs: WorkflowPort[];
  config: NodeConfig;
  disabled?: boolean;
  metadata?: Record<string, unknown>;
}

// ========== 工作流执行状态 ==========
export type WorkflowExecutionStatus =
  | 'idle'       // 空闲
  | 'running'    // 运行中
  | 'paused'     // 暂停
  | 'completed'  // 完成
  | 'error';     // 错误

// ========== 工作流定义 ==========
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;

  // ========== 集数关联 ==========
  projectId: string;      // 所属项目
  episodeId?: string;     // 关联的集 ID
  episodeNumber?: number; // 集数编号 (1, 2, 3...)
  episodeTitle?: string;   // 集标题

  // ========== 源内容 ==========
  sourceNovelId?: string;      // 源小说 ID
  sourceChapterStart?: number; // 起始章节
  sourceChapterEnd?: number;   // 结束章节

  // ========== 节点和连接 ==========
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];

  // ========== 设置 ==========
  settings: WorkflowSettings;

  // ========== 元数据 ==========
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;

  // ========== 执行状态 ==========
  executionStatus?: WorkflowExecutionStatus;
  lastExecutedAt?: string;
}

// ========== 项目/剧集 ==========
export interface Project {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;

  // 小说源
  novelId?: string;
  novelTitle?: string;
  totalChapters?: number;

  // 集数信息
  episodes: Episode[];

  // 设置
  settings: ProjectSettings;

  createdAt?: string;
  updatedAt?: string;
}

export interface Episode {
  id: string;
  projectId: string;
  episodeNumber: number;
  title: string;

  // 源章节范围
  chapterStart: number;
  chapterEnd: number;

  // 工作流
  workflowId?: string;
  workflowStatus?: WorkflowExecutionStatus;

  // 输出
  outputVideo?: string;
  outputImages?: string[];

  // 元数据
  createdAt?: string;
  updatedAt?: string;
  executedAt?: string;
}

// ========== 项目设置 ==========
export interface ProjectSettings {
  defaultProvider?: string;
  defaultModel?: string;
  defaultQuality?: 'low' | 'medium' | 'high';
  defaultResolution?: string;
  defaultFps?: number;
}

// ========== 工作流设置 ==========
export interface WorkflowSettings {
  executionMode: 'sequential' | 'parallel' | 'hybrid';
  errorHandling: 'stop' | 'continue' | 'retry';
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  enableLogging?: boolean;
}

// ========== 工作流执行状态 ==========
export interface WorkflowExecutionState {
  workflowId: string;
  episodeId?: string;
  status: WorkflowExecutionStatus;
  currentNodes: string[];
  completedNodes: string[];
  nodeResults: Record<string, NodeExecutionResult>;
  startTime?: number;
  endTime?: number;
  error?: string;
}

// ========== 节点模板 ==========
export interface NodeTemplate {
  type: MangaNodeType;
  name: string;
  category: NodeCategory;
  description: string;
  icon: string;
  inputs: Omit<WorkflowPort, 'id'>[];
  outputs: Omit<WorkflowPort, 'id'>[];
  defaultConfig: NodeConfig;
  docsUrl?: string;
}

// ========== 节点定义映射 ==========
export interface NodeDefinitionMap {
  [key: string]: NodeTemplate;
}

// ========== 节点执行上下文 ==========
export interface NodeExecutionContext {
  workflowId: string;
  episodeId?: string;
  executionId: string;
  node: WorkflowNode;
  inputs: Record<string, unknown>;
  getVariable: (name: string) => unknown;
  setVariable: (name: string, value: unknown) => void;
  getNodeResult: (nodeId: string) => NodeExecutionResult | undefined;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
}

// ========== 节点执行函数类型 ==========
export type NodeExecutor = (
  context: NodeExecutionContext
) => Promise<any> | any;

// ========== 预设模板 ==========
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  workflow: Omit<WorkflowDefinition, 'id' | 'projectId' | 'episodeId' | 'episodeNumber' | 'createdAt' | 'updatedAt'>;
}
