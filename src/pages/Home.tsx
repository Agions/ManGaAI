import React, { useEffect, useState } from 'react';
import { Divider, Space, Typography } from 'antd';
import {
  HeroSection,
  StatsCards,
  ProjectGrid,
  Features,
  WorkflowSteps,
  CTASection,
  Project
} from '@/components/business/Home';
import styles from './Home.module.less';

const { Text } = Typography;

/**
 * 首页组件
 * 展示应用概览、项目管理、功能介绍等内容
 */
const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  // 加载项目数据
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: '产品宣传视频',
          description: '公司新产品宣传短视频',
          createdAt: '2023-05-15T08:00:00.000Z',
          updatedAt: '2023-05-16T10:30:00.000Z',
          status: 'completed',
          thumbnail: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png'
        },
        {
          id: '2',
          name: '社交媒体短视频',
          description: '抖音和小红书推广内容',
          createdAt: '2023-05-10T12:00:00.000Z',
          updatedAt: '2023-05-11T09:15:00.000Z',
          status: 'draft',
          thumbnail: 'https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png'
        },
        {
          id: '3',
          name: '教学视频系列',
          description: '软件使用教程系列视频',
          createdAt: '2023-05-05T15:45:00.000Z',
          updatedAt: '2023-05-08T14:20:00.000Z',
          status: 'processing',
          thumbnail: 'https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg'
        }
      ];

      setProjects(mockProjects);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // 处理项目删除后的刷新
  const handleProjectRefresh = () => {
    // 实际项目中应该调用 API 重新获取数据
    // 这里暂时保留原逻辑
  };

  return (
    <div className={styles.container}>
      {/* 欢迎区 */}
      <HeroSection />

      {/* 统计信息 */}
      <StatsCards projects={projects} />

      {/* 项目列表 */}
      <ProjectGrid
        projects={projects}
        loading={loading}
        onRefresh={handleProjectRefresh}
      />

      {/* 特性展示 */}
      <Features />

      {/* 工作流程 */}
      <WorkflowSteps />

      {/* 行动召唤区 */}
      <CTASection />

      {/* 页脚 */}
      <div className={styles.footer}>
        <Divider />
        <Space split={<Divider type="vertical" />}>
          <Text type="secondary">© 2025 ManGa AI</Text>
          <Text type="secondary">基于 Tauri 和 React 构建</Text>
          <a
            href="https://github.com/agions/blazecut"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </Space>
      </div>
    </div>
  );
};

export default Home;
