/**
 * 漫剧工作流页面
 */

import React, { useState } from 'react';
import { Card, Typography, Space, Tabs, Button, Steps, message } from 'antd';
import { ThunderboltOutlined, PlayCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.less';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const WORKFLOW_STEPS = [
  { key: 'import', title: '导入', description: '小说/剧本' },
  { key: 'generate', title: '生成', description: 'AI 剧本' },
  { key: 'storyboard', title: '分镜', description: '漫画分镜' },
  { key: 'character', title: '角色', description: '角色形象' },
  { key: 'render', title: '渲染', description: '场景渲染' },
  { key: 'animate', title: '合成', description: '动态效果' },
  { key: 'export', title: '导出', description: '视频导出' },
];

const WorkflowPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('workflow');
  const [currentStep, setCurrentStep] = useState(0);

  const handleStartWorkflow = () => {
    message.info('开始创建工作流...');
    navigate('/video-studio');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space>
          <ThunderboltOutlined style={{ fontSize: 24, color: '#faad14' }} />
          <Title level={3} style={{ margin: 0 }}>漫剧工作流</Title>
        </Space>
        <Space>
          <Button icon={<SettingOutlined />}>设置</Button>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartWorkflow}>
            开始创建
          </Button>
        </Space>
      </div>

      <Card className={styles.workflowCard}>
        <Steps 
          current={currentStep} 
          items={WORKFLOW_STEPS}
          className={styles.steps}
        />
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className={styles.tabs}
      >
        <TabPane tab="工作流" key="workflow">
          <Card>
            <Text>选择或创建新的工作流</Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleStartWorkflow}>
                创建新工作流
              </Button>
            </div>
          </Card>
        </TabPane>
        <TabPane tab="历史记录" key="history">
          <Card>
            <Text type="secondary">暂无历史记录</Text>
          </Card>
        </TabPane>
        <TabPane tab="模板" key="templates">
          <Card>
            <Text type="secondary">暂无模板</Text>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default WorkflowPage;
