/**
 * 工作流编辑器类型定义
 */

import type { ReactNode } from 'react';

// 节点类型分类
export type NodeCategory = 'input' | 'output' | 'ai' | 'video' | 'audio' | 'logic' | 'utility';

// 节点执行状态
export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'error' | '';

// 端口定义
export interface WorkflowPort {
  id: string;
  name: string;
  label?: string;
  type: string;
  required?: boolean;
}

// 节点定义
export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  inputs: WorkflowPort[];
  outputs: WorkflowPort[];
  config: Record<string, unknown>;
  disabled?: boolean;
}

// 连接定义
export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

// 工作流定义
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings?: WorkflowSettings;
  createdAt: string;
  updatedAt: string;
}

// 工作流设置
export interface WorkflowSettings {
  executionMode?: 'sequential' | 'parallel';
  errorHandling?: 'stop' | 'continue' | 'retry';
  timeout?: number;
}

// 节点配置类型
export type NodeConfig = Record<string, unknown>;

// 节点模板
export interface NodeTemplate {
  type: string;
  name: string;
  description?: string;
  category: NodeCategory;
  icon: ReactNode;
  inputs: Omit<WorkflowPort, 'id'>[];
  outputs: Omit<WorkflowPort, 'id'>[];
  defaultConfig: NodeConfig;
  configSchema?: Record<string, unknown>;
}

// 工作流执行结果
export interface WorkflowExecutionResult {
  status: 'completed' | 'error' | 'cancelled';
  nodeOutputs: Record<string, unknown>;
  error?: string;
  executionTime?: number;
}

// 工作流管理器接口
export interface IWorkflowManager {
  createWorkflow(name: string): WorkflowDefinition;
  getWorkflow(id: string): WorkflowDefinition | null;
  updateWorkflow(id: string, workflow: WorkflowDefinition): void;
  deleteWorkflow(id: string): void;
  runWorkflow(id: string, onProgress?: (nodeId: string, status: NodeExecutionStatus) => void): Promise<WorkflowExecutionResult>;
  createFromTemplate(templateId: string): WorkflowDefinition | null;
}
