/**
 * n8n 风格工作流引擎 - 漫剧视频生成
 * 工作流管理服务 - 支持每集独立工作流
 */

import type {
  WorkflowDefinition,
  WorkflowExecutionState,
  WorkflowNode,
  WorkflowConnection,
  NodeExecutionResult,
  NodeExecutionStatus,
  WorkflowSettings,
  NodeCategory,
  MangaNodeType,
  NodeConfig,
  NodeTemplate,
  Project,
  Episode,
  ProjectSettings
} from './types';
import {
  NODE_TEMPLATES,
  getNodeTemplate,
  getNodesByCategory,
  CATEGORY_INFO
} from './nodeTemplates';
import {
  getWorkflowTemplates,
  getWorkflowTemplate,
  createWorkflowFromTemplate
} from './workflowTemplates';
import { executeWorkflow, createWorkflowExecutor, workflowExecutionManager } from './executor';
import { projectManager } from './projectManager';

// ========== 工作流状态管理 ==========
class WorkflowManager {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ========== 存储 ==========
  private saveToStorage(): void {
    try {
      const data = Array.from(this.workflows.values());
      localStorage.setItem('manga-workflows', JSON.stringify(data));
    } catch (e) {
      console.error('保存工作流失败:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('manga-workflows');
      if (data) {
        const workflows = JSON.parse(data) as WorkflowDefinition[];
        workflows.forEach(w => this.workflows.set(w.id, w));
      }
    } catch (e) {
      console.error('加载工作流失败:', e);
    }
  }

  // ========== 工作流 CRUD ==========

  /**
   * 创建新工作流（关联到特定集）
   */
  createWorkflow(
    name: string,
    projectId: string,
    episodeId?: string,
    episodeNumber?: number
  ): WorkflowDefinition {
    const workflow: WorkflowDefinition = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: '',
      projectId,
      episodeId,
      episodeNumber,
      nodes: [],
      connections: [],
      settings: {
        executionMode: 'sequential',
        errorHandling: 'stop',
        maxRetries: 3,
        timeout: 300000,
        enableLogging: true
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(workflow.id, workflow);
    this.saveToStorage();

    // 如果有关联集数，更新集数的工作流ID
    if (episodeId) {
      projectManager.updateEpisodeWorkflowStatus(projectId, episodeId, workflow.id, 'idle');
    }

    return workflow;
  }

  /**
   * 从模板创建工作流（关联到特定集）
   */
  createFromTemplate(
    templateId: string,
    projectId: string,
    episodeId?: string,
    episodeNumber?: number
  ): WorkflowDefinition | undefined {
    const template = getWorkflowTemplate(templateId);
    if (!template) return undefined;

    const workflow: WorkflowDefinition = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.workflow.name,
      description: template.workflow.description,
      projectId,
      episodeId,
      episodeNumber,
      nodes: template.workflow.nodes.map(n => ({
        ...n,
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })),
      connections: template.workflow.connections.map(c => ({
        ...c,
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })),
      settings: template.workflow.settings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(workflow.id, workflow);
    this.saveToStorage();

    // 如果有关联集数，更新集数的工作流ID
    if (episodeId) {
      projectManager.updateEpisodeWorkflowStatus(projectId, episodeId, workflow.id, 'idle');
    }

    return workflow;
  }

  /**
   * 获取工作流
   */
  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  /**
   * 获取所有工作流
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * 获取项目的所有工作流
   */
  getWorkflowsByProject(projectId: string): WorkflowDefinition[] {
    return Array.from(this.workflows.values()).filter(
      w => w.projectId === projectId
    );
  }

  /**
   * 获取特定集的工作流
   */
  getWorkflowByEpisode(episodeId: string): WorkflowDefinition | undefined {
    return Array.from(this.workflows.values()).find(
      w => w.episodeId === episodeId
    );
  }

  /**
   * 更新工作流
   */
  updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): WorkflowDefinition | undefined {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const updated = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  /**
   * 删除工作流
   */
  deleteWorkflow(id: string): boolean {
    const workflow = this.workflows.get(id);
    const deleted = this.workflows.delete(id);

    if (deleted && workflow?.episodeId) {
      // 清除集数的工作流关联
      projectManager.updateEpisodeWorkflowStatus(
        workflow.projectId,
        workflow.episodeId,
        '',
        'idle'
      );
      this.saveToStorage();
    }

    return deleted;
  }

  /**
   * 复制工作流
   */
  duplicateWorkflow(id: string): WorkflowDefinition | undefined {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;

    const newWorkflow: WorkflowDefinition = {
      ...JSON.parse(JSON.stringify(workflow)),
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${workflow.name} (副本)`,
      episodeId: undefined, // 复制的不关联到集
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(newWorkflow.id, newWorkflow);
    this.saveToStorage();
    return newWorkflow;
  }

  // ========== 节点操作 ==========

  /**
   * 添加节点
   */
  addNode(
    workflowId: string,
    type: string,
    position: { x: number; y: number },
    name?: string
  ): WorkflowNode | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    const template = getNodeTemplate(type);
    if (!template) return undefined;

    const node: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      name: name || template.name,
      position,
      inputs: template.inputs.map(p => ({ ...p, id: `port_${Math.random().toString(36).substr(2, 9)}` })),
      outputs: template.outputs.map(p => ({ ...p, id: `port_${Math.random().toString(36).substr(2, 9)}` })),
      config: { ...template.defaultConfig }
    };

    workflow.nodes.push(node);
    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return node;
  }

  /**
   * 更新节点
   */
  updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>): WorkflowNode | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return undefined;

    workflow.nodes[nodeIndex] = {
      ...workflow.nodes[nodeIndex],
      ...updates
    };
    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return workflow.nodes[nodeIndex];
  }

  /**
   * 删除节点
   */
  deleteNode(workflowId: string, nodeId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    // 删除节点
    workflow.nodes = workflow.nodes.filter(n => n.id !== nodeId);

    // 删除相关的连接
    workflow.connections = workflow.connections.filter(
      c => c.sourceNodeId !== nodeId && c.targetNode !== nodeId
    );

    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  // ========== 连接操作 ==========

  /**
   * 添加连接
   */
  addConnection(
    workflowId: string,
    sourceNodeId: string,
    sourcePort: string,
    targetNodeId: string,
    targetPort: string
  ): WorkflowConnection | undefined {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    // 检查节点是否存在
    const sourceNode = workflow.nodes.find(n => n.id === sourceNodeId);
    const targetNode = workflow.nodes.find(n => n.id === targetNodeId);
    if (!sourceNode || !targetNode) return undefined;

    // 检查端口是否存在
    const sourcePortExists = sourceNode.outputs.some(p => p.id === sourcePort);
    const targetPortExists = targetNode.inputs.some(p => p.id === targetPort);
    if (!sourcePortExists || !targetPortExists) return undefined;

    // 检查连接是否已存在
    const exists = workflow.connections.some(
      c => c.sourceNodeId === sourceNodeId &&
           c.sourcePort === sourcePort &&
           c.targetNode === targetNodeId &&
           c.targetPort === targetPort
    );
    if (exists) return undefined;

    const connection: WorkflowConnection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceNodeId,
      sourcePort,
      targetNode: targetNodeId,
      targetPort
    };

    workflow.connections.push(connection);
    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return connection;
  }

  /**
   * 删除连接
   */
  deleteConnection(workflowId: string, connectionId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    workflow.connections = workflow.connections.filter(c => c.id !== connectionId);
    workflow.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return true;
  }

  // ========== 执行 ==========

  /**
   * 执行工作流
   */
  async runWorkflow(
    workflowId: string,
    onProgress?: (nodeId: string, status: NodeExecutionStatus, result?: NodeExecutionResult) => void
  ): Promise<WorkflowExecutionState | undefined> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return undefined;

    // 更新工作流状态
    workflow.executionStatus = 'running';
    this.saveToStorage();

    // 如果有集数关联，更新集数状态
    if (workflow.episodeId) {
      projectManager.updateEpisodeWorkflowStatus(
        workflow.projectId,
        workflow.episodeId,
        workflow.id,
        'running'
      );
    }

    try {
      const result = await executeWorkflow(workflow, onProgress);

      // 更新工作流状态
      workflow.executionStatus = result.status;
      workflow.lastExecutedAt = new Date().toISOString();
      this.saveToStorage();

      // 如果有集数关联，更新集数状态
      if (workflow.episodeId) {
        projectManager.updateEpisodeWorkflowStatus(
          workflow.projectId,
          workflow.episodeId,
          workflow.id,
          result.status
        );
      }

      return result;
    } catch (error) {
      workflow.executionStatus = 'error';
      this.saveToStorage();

      if (workflow.episodeId) {
        projectManager.updateEpisodeWorkflowStatus(
          workflow.projectId,
          workflow.episodeId,
          workflow.id,
          'error'
        );
      }

      throw error;
    }
  }

  /**
   * 获取执行器
   */
  getExecutor(workflowId: string) {
    return workflowExecutionManager.getExecutor(workflowId);
  }
}

// 导出单例
export const workflowManager = new WorkflowManager();

// 导出所有值
export {
  // 模板
  NODE_TEMPLATES,
  getNodeTemplate,
  getNodesByCategory,
  CATEGORY_INFO,
  getWorkflowTemplates,
  getWorkflowTemplate,
  // 执行器
  executeWorkflow,
  createWorkflowExecutor,
  workflowExecutionManager,
  // 项目管理
  projectManager,
  // 模板
  createWorkflowFromTemplate
};

// 类型导出
export type {
  WorkflowDefinition,
  WorkflowExecutionState,
  WorkflowNode,
  WorkflowConnection,
  NodeExecutionResult,
  NodeExecutionStatus,
  WorkflowSettings,
  NodeCategory,
  MangaNodeType,
  NodeConfig,
  NodeTemplate,
  Project,
  Episode,
  ProjectSettings
};
