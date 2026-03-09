import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { VideoCameraOutlined, StarOutlined, FireOutlined } from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import styles from './StatsCards.module.less';

interface Project {
  id: string;
  status: 'draft' | 'processing' | 'completed';
}

/**
 * 统计卡片组件
 * 展示项目数量、已完成、处理中统计
 */
interface StatsCardsProps {
  projects: Project[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ projects }) => {
  const { isDarkMode } = useTheme();

  const completedCount = projects.filter(p => p.status === 'completed').length;
  const processingCount = projects.filter(p => p.status === 'processing').length;

  return (
    <Row gutter={[24, 24]} className={styles.stats}>
      <Col xs={24} sm={8}>
        <Card className={`${styles.statsCard} ${isDarkMode ? styles.darkCard : ''}`}>
          <Statistic
            title="项目总数"
            value={projects.length}
            prefix={<VideoCameraOutlined className={styles.statIcon} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className={`${styles.statsCard} ${isDarkMode ? styles.darkCard : ''}`}>
          <Statistic
            title="已完成项目"
            value={completedCount}
            prefix={<StarOutlined className={styles.statIcon} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card className={`${styles.statsCard} ${isDarkMode ? styles.darkCard : ''}`}>
          <Statistic
            title="处理中项目"
            value={processingCount}
            prefix={<FireOutlined className={styles.statIcon} />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatsCards;
