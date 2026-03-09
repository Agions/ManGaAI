import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import {
  ThunderboltOutlined,
  CodeOutlined,
  CloudOutlined,
  BulbOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import styles from './Features.module.less';

const { Title, Paragraph } = Typography;

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const featureList: Feature[] = [
  {
    icon: <ThunderboltOutlined />,
    title: '智能分析',
    description: '基于AI技术分析视频内容，智能识别关键场景和情感变化',
    color: '#6366f1'
  },
  {
    icon: <CodeOutlined />,
    title: '脚本生成',
    description: '自动生成专业短视频脚本，支持多种风格和平台定制',
    color: '#ec4899'
  },
  {
    icon: <CloudOutlined />,
    title: '一键剪辑',
    description: '根据脚本一键生成精美短视频，无需复杂操作',
    color: '#14b8a6'
  },
  {
    icon: <BulbOutlined />,
    title: '创意辅助',
    description: 'AI提供创意建议和创作灵感，帮助提升内容质量',
    color: '#f59e0b'
  }
];

/**
 * 功能展示组件
 * 展示产品的核心功能特性
 */
const Features: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={styles.features}>
      <Title level={3} className={styles.sectionTitle}>
        <RocketOutlined /> 强大功能
      </Title>
      <Row gutter={[24, 24]}>
        {featureList.map((feature, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              className={`${styles.featureCard} ${isDarkMode ? styles.darkCard : ''}`}
              bordered={false}
            >
              <div
                className={styles.featureIcon}
                style={{ color: feature.color }}
              >
                {feature.icon}
              </div>
              <Title level={4} className={styles.featureTitle}>{feature.title}</Title>
              <Paragraph className={styles.featureDesc}>
                {feature.description}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Features;
