/**
 * 项目和集数管理工作流编辑器
 * 每集独立工作流管理界面
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Space,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Progress,
  Typography,
  Dropdown,
  Menu,
  message,
  Empty,
  Spin,
  Tabs,
  Divider
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SettingOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  MoreOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Project, Episode, WorkflowDefinition, WorkflowExecutionStatus } from '@/core/services/n8n-workflow/types';
import { projectManager } from '@/core/services/n8n-workflow/projectManager';
import { workflowManager } from '@/core/services/n8n-workflow';
import styles from './ProjectWorkflowManager.module.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ========== 集数状态标签 ==========
const getStatusTag = (status?: WorkflowExecutionStatus) => {
  const config = {
    idle: { color: 'default', icon: <ClockCircleOutlined />, text: '未开始' },
    running: { color: 'processing', icon: <SyncOutlined />, text: '运行中' },
    completed: { color: 'success', icon: <CheckCircleOutlined />, text: '已完成' },
    error: { color: 'error', icon: <ExclamationCircleOutlined />, text: '失败' }
  };

  const s = status || 'idle';
  const c = config[s] || config.idle;

  return (
    <Tag color={c.color} icon={c.icon}>
      {c.text}
    </Tag>
  );
};

// ========== 项目表单 ==========
const ProjectForm: React.FC<{
  project?: Project;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}> = ({ project, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (project) {
      form.setFieldsValue(project);
    }
  }, [project, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
    >
      <Form.Item
        label="项目名称"
        name="name"
        rules={[{ required: true, message: '请输入项目名称' }]}
      >
        <Input placeholder="如：我的漫剧项目" />
      </Form.Item>

      <Form.Item
        label="项目描述"
        name="description"
      >
        <TextArea rows={3} placeholder="描述这个项目的用途..." />
      </Form.Item>

      <Form.Item
        label="小说标题"
        name="novelTitle"
      >
        <Input placeholder="源小说标题（可选）" />
      </Form.Item>

      <Form.Item
        label="总章节数"
        name="totalChapters"
      >
        <InputNumber min={1} max={1000} style={{ width: '100%' }} placeholder="小说的总章节数" />
      </Form.Item>

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">
            {project ? '保存' : '创建'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

// ========== 集数表单 ==========
const EpisodeForm: React.FC<{
  episode?: Episode;
  maxChapter: number;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}> = ({ episode, maxChapter, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (episode) {
      form.setFieldsValue(episode);
    }
  }, [episode, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
    >
      <Form.Item
        label="集标题"
        name="title"
        rules={[{ required: true, message: '请输入集标题' }]}
      >
        <Input placeholder="如：第 1 集" />
      </Form.Item>

      <Form.Item
        label="起始章节"
        name="chapterStart"
        rules={[{ required: true, message: '请输入起始章节' }]}
      >
        <InputNumber min={1} max={maxChapter} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label="结束章节"
        name="chapterEnd"
        rules={[{ required: true, message: '请输入结束章节' }]}
      >
        <InputNumber min={1} max={maxChapter} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">
            {episode ? '保存' : '添加'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

// ========== 主组件 ==========
export const ProjectWorkflowManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [episodeModalVisible, setEpisodeModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('episodes');

  // 加载项目列表
  const loadProjects = useCallback(() => {
    const allProjects = projectManager.getAllProjects();
    setProjects(allProjects);
  }, []);

  // 加载集数列表
  const loadEpisodes = useCallback((projectId: string) => {
    const eps = projectManager.getEpisodes(projectId);
    setEpisodes(eps);
  }, []);

  // 加载集数时同时加载工作流
  const loadEpisodeWorkflow = useCallback((episode: Episode) => {
    const wf = workflowManager.getWorkflowByEpisode(episode.id);
    setWorkflow(wf || null);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadEpisodes(selectedProject.id);
    } else {
      setEpisodes([]);
    }
  }, [selectedProject, loadEpisodes]);

  useEffect(() => {
    if (selectedEpisode) {
      loadEpisodeWorkflow(selectedEpisode);
    } else {
      setWorkflow(null);
    }
  }, [selectedEpisode, loadEpisodeWorkflow]);

  // 创建项目
  const handleCreateProject = (values: Record<string, unknown>) => {
    const project = projectManager.createProject(
      String(values.name ?? ''),
      String(values.description ?? '')
    );
    if (values.novelTitle) {
      projectManager.updateProject(project.id, {
        novelTitle: String(values.novelTitle),
        totalChapters: Number(values.totalChapters) || undefined
      });
    }
    loadProjects();
    setProjectModalVisible(false);
    message.success('项目创建成功');
  };

  // 创建集数
  const handleCreateEpisode = (values: Record<string, unknown>) => {
    if (!selectedProject) return;

    const episode = projectManager.addEpisode(
      selectedProject.id,
      String(values.title ?? ''),
      Number(values.chapterStart ?? 1),
      Number(values.chapterEnd ?? 1)
    );

    if (episode) {
      loadEpisodes(selectedProject.id);
      setEpisodeModalVisible(false);
      message.success('集数添加成功');
    }
  };

  // 批量创建集数
  const handleBatchCreateEpisodes = (chaptersPerEpisode: number) => {
    if (!selectedProject) return;

    const totalChapters = selectedProject.totalChapters || 100;
    const episodes = projectManager.createEpisodesFromChapters(
      selectedProject.id,
      totalChapters,
      chaptersPerEpisode
    );

    loadEpisodes(selectedProject.id);
    setBatchModalVisible(false);
    message.success(`成功创建 ${episodes.length} 集`);
  };

  // 选择集数
  const handleSelectEpisode = (episode: Episode) => {
    setSelectedEpisode(episode);
  };

  // 创建集数工作流
  const handleCreateWorkflow = (templateId: string) => {
    if (!selectedProject || !selectedEpisode) return;

    const wf = workflowManager.createFromTemplate(
      templateId,
      selectedProject.id,
      selectedEpisode.id,
      selectedEpisode.episodeNumber
    );

    if (wf) {
      setWorkflow(wf);
      message.success('工作流创建成功');
    }
  };

  // 删除集数
  const handleDeleteEpisode = (episode: Episode) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除"${episode.title}"吗？相关工作流也会被删除。`,
      okText: '删除',
      okType: 'danger',
      onOk: () => {
        if (workflow && workflow.episodeId === episode.id) {
          workflowManager.deleteWorkflow(workflow.id);
          setWorkflow(null);
        }
        projectManager.deleteEpisode(selectedProject!.id, episode.id);
        loadEpisodes(selectedProject!.id);
        setSelectedEpisode(null);
        message.success('集数已删除');
      }
    });
  };

  // 集数表格列
  const episodeColumns: ColumnsType<Episode> = [
    {
      title: '集数',
      dataIndex: 'episodeNumber',
      width: 80,
      render: (num) => <Tag color="blue">第 {num} 集</Tag>
    },
    {
      title: '标题',
      dataIndex: 'title'
    },
    {
      title: '章节范围',
      render: (_, record) => (
        <Text type="secondary">
          第 {record.chapterStart} - {record.chapterEnd} 章
        </Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'workflowStatus',
      render: (status) => getStatusTag(status)
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleSelectEpisode(record)}
          >
            {workflow?.episodeId === record.id ? '编辑工作流' : '配置'}
          </Button>
          <Dropdown
            overlay={
              <Menu
                items={[
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: '删除',
                    danger: true,
                    onClick: () => handleDeleteEpisode(record)
                  }
                ]}
              />
            }
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ];

  return (
    <div className={styles.container}>
      {/* 左侧项目列表 */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Title level={5}>项目</Title>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setProjectModalVisible(true)}
          >
            新建项目
          </Button>
        </div>

        <div className={styles.projectList}>
          {projects.length === 0 ? (
            <Empty description="暂无项目" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            projects.map(p => (
              <Card
                key={p.id}
                size="small"
                className={`${styles.projectCard} ${selectedProject?.id === p.id ? styles.selected : ''}`}
                onClick={() => {
                  setSelectedProject(p);
                  setSelectedEpisode(null);
                }}
              >
                <div className={styles.projectInfo}>
                  <Text strong>{p.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {p.episodes.length} 集
                  </Text>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 中间集数列表 */}
      <div className={styles.episodeList}>
        {selectedProject ? (
          <>
            <div className={styles.episodeHeader}>
              <div>
                <Title level={4}>{selectedProject.name}</Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {selectedProject.novelTitle && `小说: ${selectedProject.novelTitle}`}
                  {selectedProject.totalChapters && ` (${selectedProject.totalChapters} 章)`}
                </Paragraph>
              </div>
              <Space>
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setBatchModalVisible(true)}
                >
                  批量添加
                </Button>
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setEpisodeModalVisible(true)}
                >
                  添加集
                </Button>
              </Space>
            </div>

            <Table
              columns={episodeColumns}
              dataSource={episodes}
              rowKey="id"
              size="small"
              pagination={false}
              className={styles.episodeTable}
              onRow={(record) => ({
                onClick: () => handleSelectEpisode(record),
                style: { cursor: 'pointer' }
              })}
            />
          </>
        ) : (
          <Empty description="请选择项目" />
        )}
      </div>

      {/* 右侧工作流编辑器 */}
      <div className={styles.workflowPanel}>
        {selectedEpisode ? (
          <>
            <div className={styles.workflowHeader}>
              <div>
                <Title level={4}>{selectedEpisode.title}</Title>
                <Text type="secondary">
                  章节 {selectedEpisode.chapterStart} - {selectedEpisode.chapterEnd}
                </Text>
              </div>
              {getStatusTag(selectedEpisode.workflowStatus)}
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              className={styles.workflowTabs}
            >
              <Tabs.TabPane tab="工作流" key="workflow">
                {workflow ? (
                  <div className={styles.workflowInfo}>
                    <Text>已有工作流: {workflow.name}</Text>
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await workflowManager.runWorkflow(workflow.id);
                          message.success('工作流执行完成');
                          // 刷新状态
                          const updatedEpisode = projectManager.getEpisode(selectedProject!.id, selectedEpisode!.id);
                          if (updatedEpisode) {
                            setSelectedEpisode(updatedEpisode);
                          }
                        } catch (e) {
                          message.error('工作流执行失败');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      loading={loading}
                    >
                      运行工作流
                    </Button>
                  </div>
                ) : (
                  <div className={styles.createWorkflow}>
                    <Text type="secondary">请选择工作流模板</Text>
                    <div className={styles.templateGrid}>
                      {[
                        { id: 'basic-manga', name: '基础漫剧', desc: '完整流程' },
                        { id: 'quick-preview', name: '快速预览', desc: '测试用' },
                        { id: 'high-quality', name: '高质量', desc: '最佳效果' }
                      ].map(t => (
                        <Card
                          key={t.id}
                          hoverable
                          size="small"
                          onClick={() => handleCreateWorkflow(t.id)}
                        >
                          <Text strong>{t.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>{t.desc}</Text>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </Tabs.TabPane>

              <Tabs.TabPane tab="配置" key="config">
                <Form layout="vertical">
                  <Form.Item label="输出质量">
                    <Select
                      defaultValue="high"
                      options={[
                        { value: 'low', label: '低' },
                        { value: 'medium', label: '中' },
                        { value: 'high', label: '高' }
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="分辨率">
                    <Select
                      defaultValue="1920x1080"
                      options={[
                        { value: '1280x720', label: '720p' },
                        { value: '1920x1080', label: '1080p' },
                        { value: '3840x2160', label: '4K' }
                      ]}
                    />
                  </Form.Item>
                </Form>
              </Tabs.TabPane>
            </Tabs>
          </>
        ) : (
          <Empty description="请选择集数以配置工作流" />
        )}
      </div>

      {/* 新建项目弹窗 */}
      <Modal
        title="新建项目"
        open={projectModalVisible}
        onCancel={() => setProjectModalVisible(false)}
        footer={null}
        width={480}
      >
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setProjectModalVisible(false)}
        />
      </Modal>

      {/* 添加集数弹窗 */}
      <Modal
        title="添加集数"
        open={episodeModalVisible}
        onCancel={() => setEpisodeModalVisible(false)}
        footer={null}
        width={400}
      >
        <EpisodeForm
          maxChapter={selectedProject?.totalChapters || 100}
          onSubmit={handleCreateEpisode}
          onCancel={() => setEpisodeModalVisible(false)}
        />
      </Modal>

      {/* 批量添加弹窗 */}
      <Modal
        title="批量添加集数"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label="每集章节数">
            <InputNumber
              min={1}
              max={50}
              defaultValue={10}
              style={{ width: '100%' }}
              id="chaptersPerEpisode"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              block
              onClick={() => {
                const input = document.getElementById('chaptersPerEpisode') as HTMLInputElement;
                handleBatchCreateEpisodes(parseInt(input.value) || 10);
              }}
            >
              批量创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectWorkflowManager;
