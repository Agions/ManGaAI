/**
 * n8n 风格工作流编辑器
 * 可视化节点编辑器组件
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, Button, Space, Form, Input, Select, Tabs, Empty, Spin, message, Typography } from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  DeleteOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { WorkflowNode, NodeExecutionStatus, WorkflowDefinition, NodeCategory } from './types';
import { CATEGORY_INFO, getNodesByCategory, getNodeTemplate, workflowManager } from './nodeTemplates';
import styles from './WorkflowEditor.module.less';

const { Title, Text } = Typography;

// 类型定义
type NodeConfig = Record<string, unknown>;

interface WorkflowEditorProps {
  workflowId?: string;
  onSave?: (workflow: WorkflowDefinition) => void;
  onRun?: (workflow: WorkflowDefinition) => void;
}

// 节点组件
const NodeComponent: React.FC<{
  node: WorkflowNode;
  isSelected: boolean;
  executionStatus?: NodeExecutionStatus;
  onSelect: () => void;
  onDelete: () => void;
}> = ({ node, isSelected, executionStatus, onSelect, onDelete }) => {
  const template = getNodeTemplate(node.type);
  const category = template?.category || 'utility';
  const categoryInfo = CATEGORY_INFO[category];

  const getIcon = () => {
    if (!template?.icon) return <SettingOutlined />;
    return template.icon;
  };

  return (
    <div
      className={`${styles.node} ${styles[category]} ${isSelected ? styles.selected : ''} ${executionStatus || ''}`}
      style={{ left: node.position.x, top: node.position.y }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      <div className={styles.nodeHeader} style={{ backgroundColor: categoryInfo?.color }}>
        <span className={styles.nodeIcon}>{getIcon()}</span>
        <span className={styles.nodeName}>{node.name}</span>
      </div>
      <div className={styles.nodeBody}>
        <div className={styles.nodePorts}>
          <div className={styles.inputPorts}>
            {node.inputs.map(port => (
              <div key={port.id} className={styles.port}>
                <div className={styles.portDot} data-port={port.id} data-type="input" />
                <span>{port.label || port.name}</span>
              </div>
            ))}
          </div>
          <div className={styles.outputPorts}>
            {node.outputs.map(port => (
              <div key={port.id} className={styles.port}>
                <span>{port.label || port.name}</span>
                <div className={styles.portDot} data-port={port.id} data-type="output" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {isSelected && (
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        />
      )}
    </div>
  );
};

// 节点模板侧边栏
const NodeSidebar: React.FC<{
  onAddNode: (type: string, position: { x: number; y: number }) => void;
}> = ({ onAddNode }) => {
  const [activeCategory, setActiveCategory] = useState<NodeCategory>('input');

  const categories = Object.keys(CATEGORY_INFO) as NodeCategory[];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: string) => {
    e.dataTransfer.setData('nodeType', type);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Title level={5}>节点</Title>
      </div>
      <Tabs
        activeKey={activeCategory}
        onChange={(key) => setActiveCategory(key as NodeCategory)}
        tabPosition="top"
        size="small"
      >
        {categories.map(cat => (
          <Tabs.TabPane tab={CATEGORY_INFO[cat]?.label || cat} key={cat}>
            <div className={styles.nodeList}>
              {getNodesByCategory(cat).map(templateItem => (
                <div
                  key={templateItem.type}
                  className={styles.nodeItem}
                  draggable
                  onDragStart={(e) => handleDragStart(e, templateItem.type)}
                  onClick={() => onAddNode(templateItem.type, { x: 200, y: 200 })}
                >
                  <span className={styles.nodeItemIcon}>{templateItem.icon}</span>
                  <span className={styles.nodeItemName}>{templateItem.name}</span>
                </div>
              ))}
            </div>
          </Tabs.TabPane>
        ))}
      </Tabs>
    </div>
  );
};

// 节点配置面板
const NodeConfigPanel: React.FC<{
  node: WorkflowNode | null;
  onUpdate: (nodeId: string, config: NodeConfig) => void;
  onClose: () => void;
}> = ({ node, onUpdate, onClose }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (node) {
      form.setFieldsValue(node.config);
    }
  }, [node, form]);

  if (!node) {
    return (
      <div className={styles.configPanel}>
        <Text type="secondary">选择节点以查看配置</Text>
      </div>
    );
  }

  const template = getNodeTemplate(node.type);

  return (
    <div className={styles.configPanel}>
      <div className={styles.configHeader}>
        <Title level={5}>{node.name}</Title>
        <Button size="small" onClick={onClose}>关闭</Button>
      </div>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(_changed, all) => {
          onUpdate(node.id, all as NodeConfig);
        }}
      >
        <Form.Item label="节点名称" name="name">
          <Input />
        </Form.Item>

        {node.type.includes('generator') && (
          <>
            <Form.Item label="AI 提供商" name="provider">
              <Select>
                <Select.Option value="openai">OpenAI</Select.Option>
                <Select.Option value="anthropic">Anthropic</Select.Option>
                <Select.Option value="stability">Stability AI</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="模型" name="model">
              <Input placeholder="如: gpt-4, sdxl" />
            </Form.Item>
          </>
        )}

        {node.type === 'video-composer' && (
          <>
            <Form.Item label="帧率" name="fps">
              <Input type="number" />
            </Form.Item>
            <Form.Item label="分辨率" name="resolution">
              <Select>
                <Select.Option value="1280x720">720p</Select.Option>
                <Select.Option value="1920x1080">1080p</Select.Option>
                <Select.Option value="3840x2160">4K</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}

        {node.type === 'video-export' && (
          <>
            <Form.Item label="格式" name="format">
              <Select>
                <Select.Option value="mp4">MP4</Select.Option>
                <Select.Option value="webm">WebM</Select.Option>
                <Select.Option value="avi">AVI</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="质量" name="quality">
              <Select>
                <Select.Option value="low">低</Select.Option>
                <Select.Option value="medium">中</Select.Option>
                <Select.Option value="high">高</Select.Option>
                <Select.Option value="ultra">超清</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}

        {node.type === 'delay' && (
          <Form.Item label="延迟 (毫秒)" name="delayMs">
            <Input type="number" />
          </Form.Item>
        )}

        {node.type === 'condition' && (
          <>
            <Form.Item label="条件" name="condition">
              <Input.TextArea rows={2} placeholder="输入条件表达式" />
            </Form.Item>
            <Form.Item label="操作符" name="operator">
              <Select>
                <Select.Option value="equals">等于</Select.Option>
                <Select.Option value="not_equals">不等于</Select.Option>
                <Select.Option value="contains">包含</Select.Option>
                <Select.Option value="greater">大于</Select.Option>
                <Select.Option value="less">小于</Select.Option>
              </Select>
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  );
};

// 主编辑器组件
export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflowId,
  onSave,
  onRun
}) => {
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [executionStatus, setExecutionStatus] = useState<Record<string, NodeExecutionStatus>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workflowId) {
      const wf = workflowManager.getWorkflow(workflowId);
      if (wf) {
        setWorkflow(wf);
      }
    } else {
      const newWf = workflowManager.createWorkflow('新工作流');
      setWorkflow(newWf);
    }
  }, [workflowId]);

  const handleAddNode = useCallback((type: string, position: { x: number; y: number }) => {
    if (!workflow) return;

    const template = getNodeTemplate(type);
    if (!template) return;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      name: template.name,
      position,
      inputs: template.inputs.map(p => ({ ...p, id: `port_${Math.random()}` })),
      outputs: template.outputs.map(p => ({ ...p, id: `port_${Math.random()}` })),
      config: { ...template.defaultConfig }
    };

    setWorkflow({
      ...workflow,
      nodes: [...workflow.nodes, newNode]
    });
  }, [workflow]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!workflow) return;

    setWorkflow({
      ...workflow,
      nodes: workflow.nodes.filter(n => n.id !== nodeId),
      connections: workflow.connections.filter(
        c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
      )
    });

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [workflow, selectedNode]);

  const handleUpdateNode = useCallback((nodeId: string, config: NodeConfig) => {
    if (!workflow) return;

    setWorkflow({
      ...workflow,
      nodes: workflow.nodes.map(n =>
        n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
      )
    });
  }, [workflow]);

  const handleSave = useCallback(() => {
    if (!workflow) return;

    workflowManager.updateWorkflow(workflow.id, workflow);
    message.success('工作流已保存');
    onSave?.(workflow);
  }, [workflow, onSave]);

  const handleRun = useCallback(async () => {
    if (!workflow) return;

    setIsRunning(true);
    setExecutionStatus({});

    try {
      const result = await workflowManager.runWorkflow(workflow.id, (nodeId, status) => {
        setExecutionStatus(prev => ({ ...prev, [nodeId]: status }));
      });

      if (result?.status === 'completed') {
        message.success('工作流执行完成');
      } else if (result?.status === 'error') {
        message.error(`执行失败: ${result.error}`);
      }
    } catch (error) {
      message.error(`执行失败: ${error}`);
    } finally {
      setIsRunning(false);
    }
  }, [workflow]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    if (nodeType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      handleAddNode(nodeType, position);
    }
  }, [handleAddNode]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  if (!workflow) {
    return (
      <div className={styles.container}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setShowTemplates(true)}>
            从模板创建
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleRun}
            loading={isRunning}
          >
            {isRunning ? '运行中' : '运行'}
          </Button>
        </Space>
      </div>

      <div className={styles.editor}>
        <NodeSidebar onAddNode={handleAddNode} />

        <div
          ref={canvasRef}
          className={styles.canvas}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => setSelectedNode(null)}
        >
          {workflow.nodes.length === 0 ? (
            <div className={styles.emptyCanvas}>
              <Empty
                description="拖拽节点到画布上开始创建工作流"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            workflow.nodes.map(node => (
              <NodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                executionStatus={executionStatus[node.id]}
                onSelect={() => setSelectedNode(node)}
                onDelete={() => handleDeleteNode(node.id)}
              />
            ))
          )}
        </div>

        <NodeConfigPanel
          node={selectedNode}
          onUpdate={handleUpdateNode}
          onClose={() => setSelectedNode(null)}
        />
      </div>

      <div className={styles.templateModal}>
        {showTemplates && (
          <div className={styles.templateOverlay} onClick={() => setShowTemplates(false)} />
        )}
        {showTemplates && (
          <Card
            title="选择工作流模板"
            className={styles.templateCard}
          >
            <div className={styles.templateGrid}>
              {[
                { id: 'basic-manga', name: '基础漫剧生成', desc: '从小说到视频的完整流程' },
                { id: 'quick-preview', name: '快速预览', desc: '快速生成预览视频' },
                { id: 'high-quality', name: '高质量制作', desc: '包含一致性检查的高质量流程' },
              ].map(templateItem => (
                <Card
                  key={templateItem.id}
                  hoverable
                  className={styles.templateItem}
                  onClick={() => {
                    const newWf = workflowManager.createFromTemplate(templateItem.id);
                    if (newWf) {
                      setWorkflow(newWf);
                      setShowTemplates(false);
                      message.success('模板已加载');
                    }
                  }}
                >
                  <Card.Meta
                    title={templateItem.name}
                    description={templateItem.desc}
                  />
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkflowEditor;
