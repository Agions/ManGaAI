import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button } from 'antd';
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import styles from './HeroSection.module.less';

const { Title, Paragraph } = Typography;

/**
 * 首页英雄区域组件
 * 展示应用名称、主要功能和快捷操作
 */
const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateProject = () => {
    navigate('/project/new');
  };

  const handleEnterWorkspace = () => {
    navigate('/editor');
  };

  return (
    <div className={styles.hero}>
      <div className={styles.heroContent}>
        <Title level={1} className={styles.title}>
          ManGa AI <span className={styles.highlight}>AI漫剧创作</span>
        </Title>
        <Paragraph className={styles.subtitle}>
          AI赋能的短视频创作工具，让视频制作更简单、更高效
        </Paragraph>
        <div className={styles.heroButtons}>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleCreateProject}
            className={styles.primaryButton}
          >
            创建新项目
          </Button>
          <Button
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleEnterWorkspace}
            className={styles.secondaryButton}
          >
            进入工作台
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
