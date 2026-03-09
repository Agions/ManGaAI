import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import {
  CameraOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  ToolOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import styles from './WorkflowSteps.module.less';

const { Title, Paragraph } = Typography;

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: <CameraOutlined />,
    title: '上传视频',
    description: '上传您的原始视频素材'
  },
  {
    number: 2,
    icon: <ThunderboltOutlined />,
    title: 'AI分析',
    description: '智能分析视频内容和结构'
  },
  {
    number: 3,
    icon: <CodeOutlined />,
    title: '自动生成脚本',
    description: '基于分析生成专业短视频脚本'
  },
  {
    number: 4,
    icon: <ToolOutlined />,
    title: '智能剪辑',
    description: '一键生成精美短视频成品'
  }
];

/**
 * 工作流程步骤组件
 * 展示产品使用流程
 */
const WorkflowSteps: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={styles.workflow}>
      <Title level={3} className={styles.sectionTitle}>
        <FireOutlined /> 使用流程
      </Title>
      <div className={styles.steps}>
        <Row gutter={[24, 24]}>
          {steps.map((step, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                className={`${styles.stepCard} ${isDarkMode ? styles.darkCard : ''}`}
                bordered={false}
              >
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <Title level={4}>{step.title}</Title>
                <Paragraph>{step.description}</Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default WorkflowSteps;
