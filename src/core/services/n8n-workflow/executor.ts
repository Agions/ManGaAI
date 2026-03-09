/**
 * n8n 风格工作流引擎 - 漫剧视频生成
 * 工作流执行引擎
 */

import type {
  WorkflowDefinition,
  WorkflowExecutionState,
  WorkflowNode,
  WorkflowConnection,
  NodeExecutionContext,
  NodeExecutionResult,
  NodeExecutor,
  NodeExecutionStatus
} from './types';
import { getNodeTemplate } from './nodeTemplates';
import { aiService } from '../ai.service';

// 生成唯一执行ID
const generateExecutionId = () => `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ========== 节点执行器映射 ==========
const nodeExecutors: Record<string, NodeExecutor> = {
  // 输入节点
  'novel-input': async (context) => {
    // 返回上传的小说内容
    return { novel: context.inputs.novel || '' };
  },

  'script-input': async (context) => {
    return { script: context.inputs.script || {} };
  },

  'image-input': async (context) => {
    return { images: context.inputs.images || [] };
  },

  'video-input': async (context) => {
    return { video: context.inputs.video || null };
  },

  'audio-input': async (context) => {
    return { audio: context.inputs.audio || null };
  },

  // AI 处理节点 - 这里应该调用实际的 AI 服务
  'novel-parser': async (context) => {
    const novel = context.inputs.novel;
    if (!novel) throw new Error('缺少小说内容输入');

    const result = await aiService.generate(
      `分析以下小说，提取章节、角色和场景信息：${String(novel).substring(0, 1000)}`,
      { provider: context.node.config.provider, model: context.node.config.model }
    );

    // 解析返回的 JSON
    try {
      const parsed = JSON.parse(result);
      return {
        chapters: parsed.chapters || [],
        characters: parsed.characters || [],
        scenes: parsed.scenes || []
      };
    } catch {
      return {
        chapters: [{ title: '第1章', content: novel }],
        characters: [],
        scenes: []
      };
    }
  },

  'script-generator': async (context) => {
    const chapters = context.inputs.chapters;
    if (!chapters) throw new Error('缺少章节内容输入');

    const result = await aiService.generate(
      `根据以下章节内容生成剧本格式：${JSON.stringify(chapters)}`,
      { provider: context.node.config.provider, model: context.node.config.model }
    );

    return { script: { content: result, scenes: [] } };
  },

  'storyboard-generator': async (context) => {
    const script = context.inputs.script;
    if (!script) throw new Error('缺少剧本输入');

    const result = await aiService.generate(
      `将以下剧本转换为漫画分镜描述：${JSON.stringify(script)}`,
      { provider: context.node.config.provider, model: context.node.config.model }
    );

    return { storyboards: [{ panels: [], description: result }] };
  },

  'character-generator': async (context) => {
    // 调用图片生成服务
    return { characterImages: [] };
  },

  'scene-generator': async (context) => {
    return { sceneImages: [] };
  },

  'image-generator': async (context) => {
    return { image: null };
  },

  'consistency-check': async (context) => {
    const images = context.inputs.images || [];
    return {
      passed: images,
      issues: [],
      fixed: images
    };
  },

  'lip-sync-generator': async (context) => {
    return { animated: null };
  },

  // 媒体处理节点
  'image-renderer': async (context) => {
    return { images: [] };
  },

  'video-composer': async (context) => {
    return { video: null };
  },

  'audio-mixer': async (context) => {
    const voiceover = context.inputs.voiceover;
    const background = context.inputs.background;
    const effects = context.inputs.effects;

    return { mixed: { voiceover, background, effects } };
  },

  'subtitle-generator': async (context) => {
    return { subtitles: [] };
  },

  'transition-adder': async (context) => {
    const video = context.inputs.video;
    return { result: video };
  },

  'effects-adder': async (context) => {
    return { result: null };
  },

  // 输出节点
  'video-export': async (context) => {
    return { file: null };
  },

  'image-export': async (context) => {
    return { files: [] };
  },

  'audio-export': async (context) => {
    return { file: null };
  },

  // 逻辑控制节点
  'condition': async (context) => {
    const { condition, operator, value } = context.node.config;
    const input = context.inputs.input;

    let result = false;
    switch (operator) {
      case 'equals':
        result = input === value;
        break;
      case 'not_equals':
        result = input !== value;
        break;
      case 'contains':
        result = String(input).includes(String(value));
        break;
      case 'greater':
        result = Number(input) > Number(value);
        break;
      case 'less':
        result = Number(input) < Number(value);
        break;
    }

    return { condition: result, input };
  },

  'loop': async (context) => {
    const { iterations } = context.node.config;
    const input = context.inputs.input;

    const results = [];
    for (let i = 0; i < iterations; i++) {
      context.setVariable('loopIndex', i);
      results.push(input);
    }

    return { output: results, done: true };
  },

  'parallel': async (context) => {
    return { branch1: context.inputs.input, branch2: context.inputs.input };
  },

  'merge': async (context) => {
    const { mode } = context.node.config;
    if (mode === 'append') {
      return { output: [context.inputs.input1, context.inputs.input2].filter(Boolean) };
    }
    return { output: context.inputs.input1 };
  },

  'delay': async (context) => {
    const { delayMs } = context.node.config;
    await new Promise(resolve => setTimeout(resolve, delayMs || 1000));
    return { output: context.inputs.input };
  },

  // 工具节点
  'variable-set': async (context) => {
    const { variableName, variableValue } = context.node.config;
    context.setVariable(variableName, variableValue);
    return { output: context.inputs.input };
  },

  'variable-get': async (context) => {
    const { variableName } = context.node.config;
    return { value: context.getVariable(variableName) };
  },

  'http-request': async (context) => {
    const { url, method, headers, body } = context.node.config;
    try {
      const response = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await response.json();
      return { response: data };
    } catch (error) {
      return { error: String(error) };
    }
  },

  'transform': async (context) => {
    const { transformType } = context.node.config;
    const input = context.inputs.input;

    switch (transformType) {
      case 'map':
        return { output: input };
      case 'filter':
        return { output: input };
      case 'reduce':
        return { output: input };
      default:
        return { output: input };
    }
  }
};

// ========== 工作流执行器类 ==========
class WorkflowExecutor {
  private workflow: WorkflowDefinition;
  private state: WorkflowExecutionState;
  private variables: Map<string, any> = new Map();
  private abortController: AbortController | null = null;
  private onProgress?: (nodeId: string, status: NodeExecutionStatus, result?: NodeExecutionResult) => void;

  constructor(workflow: WorkflowDefinition) {
    this.workflow = workflow;
    this.state = {
      workflowId: workflow.id,
      status: 'idle',
      currentNodes: [],
      completedNodes: [],
      nodeResults: {}
    };
  }

  // 设置进度回调
  setProgressCallback(callback: (nodeId: string, status: NodeExecutionStatus, result?: NodeExecutionResult) => void) {
    this.onProgress = callback;
  }

  // 获取当前状态
  getState(): WorkflowExecutionState {
    return { ...this.state };
  }

  // 获取变量
  getVariable(name: string): unknown {
    return this.variables.get(name);
  }

  // 设置变量
  setVariable(name: string, value: unknown): void {
    this.variables.set(name, value);
  }

  // 中止执行
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.state.status = 'idle';
  }

  // 获取节点的输入连接
  private getNodeInputs(nodeId: string): WorkflowConnection[] {
    return this.workflow.connections.filter(
      conn => conn.targetNode === nodeId
    );
  }

  // 获取节点的输出连接
  private getNodeOutputs(nodeId: string): WorkflowConnection[] {
    return this.workflow.connections.filter(
      conn => conn.sourceNodeId === nodeId
    );
  }

  // 获取节点执行顺序（拓扑排序）
  private getExecutionOrder(): string[] {
    const nodes = this.workflow.nodes;
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // 初始化
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    });

    // 构建图
    this.workflow.connections.forEach(conn => {
      const currentDegree = inDegree.get(conn.targetNode) || 0;
      inDegree.set(conn.targetNode, currentDegree + 1);

      const neighbors = adjacency.get(conn.sourceNodeId) || [];
      neighbors.push(conn.targetNode);
      adjacency.set(conn.sourceNodeId, neighbors);
    });

    // 拓扑排序 (Kahn算法)
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    const result: string[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const neighbors = adjacency.get(nodeId) || [];
      neighbors.forEach(neighbor => {
        const degree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, degree);
        if (degree === 0) queue.push(neighbor);
      });
    }

    return result;
  }

  // 获取节点的输入数据
  private async getNodeInputsData(node: WorkflowNode): Promise<Record<string, any>> {
    const inputs: Record<string, any> = {};
    const inputConnections = this.getNodeInputs(node.id);

    for (const conn of inputConnections) {
      const sourceResult = this.state.nodeResults[conn.sourceNodeId];
      if (sourceResult && sourceResult.output) {
        // 根据连接获取对应端口的输出
        const sourceNode = this.workflow.nodes.find(n => n.id === conn.sourceNodeId);
        if (sourceNode) {
          const sourcePort = sourceNode.outputs.find(p => p.id === conn.sourcePort);
          if (sourcePort) {
            inputs[sourcePort.name] = sourceResult.output[sourcePort.name];
          }
        }
      }
    }

    return inputs;
  }

  // 执行单个节点
  private async executeNode(node: WorkflowNode): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const result: NodeExecutionResult = {
      nodeId: node.id,
      status: 'running',
      startTime
    };

    this.state.currentNodes.push(node.id);
    this.onProgress?.(node.id, 'running', result);

    try {
      // 获取节点输入
      const inputs = await this.getNodeInputsData(node);

      // 创建执行上下文
      const context: NodeExecutionContext = {
        workflowId: this.workflow.id,
        executionId: generateExecutionId(),
        node,
        inputs,
        getVariable: (name) => this.getVariable(name),
        setVariable: (name, value) => this.setVariable(name, value),
        getNodeResult: (nodeId) => this.state.nodeResults[nodeId],
        log: (message, level = 'info') => {
          console.log(`[${level.toUpperCase()}] ${node.name}: ${message}`);
        }
      };

      // 获取执行器
      const executor = nodeExecutors[node.type];
      if (!executor) {
        throw new Error(`未找到节点类型 ${node.type} 的执行器`);
      }

      // 执行节点
      const output = await executor(context);

      result.status = 'success';
      result.output = output;
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;

    } catch (error) {
      result.status = 'error';
      result.error = error instanceof Error ? error.message : String(error);
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;

      // 根据错误处理策略决定是否继续
      if (this.workflow.settings.errorHandling === 'stop') {
        throw error;
      }
    }

    this.state.currentNodes = this.state.currentNodes.filter(id => id !== node.id);
    this.state.completedNodes.push(node.id);
    this.state.nodeResults[node.id] = result;

    this.onProgress?.(node.id, result.status, result);

    return result;
  }

  // 执行工作流
  async execute(): Promise<WorkflowExecutionState> {
    if (this.state.status === 'running') {
      throw new Error('工作流已在执行中');
    }

    this.abortController = new AbortController();
    this.state.status = 'running';
    this.state.startTime = Date.now();
    this.state.completedNodes = [];
    this.state.nodeResults = {};
    this.state.error = undefined;

    try {
      // 获取执行顺序
      const order = this.getExecutionOrder();

      for (const nodeId of order) {
        if (this.abortController.signal.aborted) {
          this.state.status = 'idle';
          break;
        }

        const node = this.workflow.nodes.find(n => n.id === nodeId);
        if (!node || node.disabled) continue;

        await this.executeNode(node);
      }

      if (this.state.status === 'running') {
        this.state.status = 'completed';
      }

    } catch (error) {
      this.state.status = 'error';
      this.state.error = error instanceof Error ? error.message : String(error);
    }

    this.state.endTime = Date.now();

    return this.getState();
  }

  // 暂停执行
  pause(): void {
    this.state.status = 'paused';
  }

  // 恢复执行
  resume(): void {
    if (this.state.status === 'paused') {
      this.state.status = 'running';
    }
  }
}

// ========== 工作流执行管理器 ==========
class WorkflowExecutionManager {
  private executors: Map<string, WorkflowExecutor> = new Map();

  // 创建执行器
  createExecutor(workflow: WorkflowDefinition): WorkflowExecutor {
    const executor = new WorkflowExecutor(workflow);
    this.executors.set(workflow.id, executor);
    return executor;
  }

  // 获取执行器
  getExecutor(workflowId: string): WorkflowExecutor | undefined {
    return this.executors.get(workflowId);
  }

  // 删除执行器
  removeExecutor(workflowId: string): void {
    const executor = this.executors.get(workflowId);
    if (executor) {
      executor.abort();
      this.executors.delete(workflowId);
    }
  }

  // 获取所有执行器
  getAllExecutors(): Map<string, WorkflowExecutor> {
    return this.executors;
  }
}

// 导出单例
export const workflowExecutionManager = new WorkflowExecutionManager();

// 导出执行器类
export { WorkflowExecutor };

// 导出执行函数
export async function executeWorkflow(
  workflow: WorkflowDefinition,
  onProgress?: (nodeId: string, status: NodeExecutionStatus, result?: NodeExecutionResult) => void
): Promise<WorkflowExecutionState> {
  const executor = workflowExecutionManager.createExecutor(workflow);
  if (onProgress) {
    executor.setProgressCallback(onProgress);
  }
  return executor.execute();
}

// 导出创建执行器函数
export function createWorkflowExecutor(workflow: WorkflowDefinition): WorkflowExecutor {
  return workflowExecutionManager.createExecutor(workflow);
}
