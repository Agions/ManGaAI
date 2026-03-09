import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import styles from './CTASection.module.less';

const { Title, Paragraph } = Typography;

/**
 * CTA (Call to Action) 组件
 * 引导用户创建项目
 */
const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const handleCreateProject = () => {
    navigate('/project/new');
  };

  return (
    <Card
      className={`${styles.cta} ${isDarkMode ? styles.darkCta : ''}`}
      bordered={false}
    >
      <Title level={3}>准备好开始创作了吗？</Title>
      <Paragraph className={styles.ctaText}>
        使用ManGa AI，让AI为您的创作提供灵感和效率
      </Paragraph>
      <Button
        type="primary"
        size="large"
        icon={<PlusOutlined />}
        onClick={handleCreateProject}
        className={styles.ctaButton}
      >
        立即创建项目
      </Button>
    </Card>
  );
};

export default CTASection;
