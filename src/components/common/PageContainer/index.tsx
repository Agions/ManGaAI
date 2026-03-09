/**
 * 页面容器组件
 * 统一页面布局结构，提供标准化的页面框架
 */

import React, { ReactNode } from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { useTheme } from '@/context/ThemeContext';
import styles from './PageContainer.module.less';

const { Title, Paragraph, Text } = Typography;

// ============================================
// 类型定义
// ============================================

export interface PageContainerProps {
  /** 页面标题 */
  title?: React.ReactNode;
  /** 页面描述 */
  description?: string;
  /** 页面操作区 */
  extra?: React.ReactNode;
  /** 页面内容 */
  children?: React.ReactNode;
  /** 是否显示背景卡片 */
  showCard?: boolean;
  /** 是否显示动画 */
  animated?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 页面底部 */
  footer?: React.ReactNode;
  /** 紧凑模式 */
  compact?: boolean;
  /** 两侧边距 */
  padding?: number | 'none';
}

export interface PageSectionProps {
  /** 区块标题 */
  title?: React.ReactNode;
  /** 区块描述 */
  description?: string;
  /** 区块操作 */
  extra?: React.ReactNode;
  /** 区块内容 */
  children: React.ReactNode;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否使用卡片样式 */
  card?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 底部内容 */
  footer?: React.ReactNode;
}

export interface StatisticCardProps {
  /** 标题 */
  title?: React.ReactNode;
  /** 数值 */
  value?: React.ReactNode;
  /** 图标 */
  icon?: React.ReactNode;
  /** 趋势（up/down） */
  trend?: 'up' | 'down' | 'none';
  /** 趋势值 */
  trendValue?: string;
  /** 颜色主题 */
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** 是否加载中 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

export interface ActionCardProps {
  /** 标题 */
  title?: React.ReactNode;
  /** 描述 */
  description?: React.ReactNode;
  /** 图标 */
  icon?: React.ReactNode;
  /** 操作按钮 */
  actions?: React.ReactNode;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 底部内容 */
  footer?: React.ReactNode;
}

// ============================================
// 页面容器组件
// ============================================

/**
 * 页面容器组件
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  extra,
  children,
  showCard = false,
  animated = true,
  className,
  footer,
  compact = false,
  padding,
}) => {
  const { isDarkMode } = useTheme();

  const containerStyle: React.CSSProperties = {};
  if (padding !== undefined && padding !== 'none') {
    containerStyle.padding = typeof padding === 'number' ? `${padding}px` : padding;
  }

  const content = (
    <>
      {(title || description || extra) && (
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {title && (
              typeof title === 'string' ? (
                <Title level={3} className={styles.title}>{title}</Title>
              ) : (
                <div className={styles.title}>{title}</div>
              )
            )}
            {description && (
              <Paragraph type="secondary" className={styles.description}>
                {description}
              </Paragraph>
            )}
          </div>
          {extra && <div className={styles.extra}>{extra}</div>}
        </div>
      )}
      <div className={styles.content} style={containerStyle}>
        {children}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </>
  );

  if (showCard) {
    return (
      <Card
        className={`${styles.container} ${isDarkMode ? styles.dark : ''} ${compact ? styles.compact : ''} ${className || ''}`}
        bordered={false}
      >
        {animated ? <div className={styles.animated}>{content}</div> : content}
      </Card>
    );
  }

  return (
    <div className={`${styles.container} ${isDarkMode ? styles.dark : ''} ${compact ? styles.compact : ''} ${className || ''}`}>
      {animated ? <div className={styles.animated}>{content}</div> : content}
    </div>
  );
};

// ============================================
// 页面区块组件
// ============================================

/**
 * 页面区块组件
 */
export const PageSection: React.FC<PageSectionProps> = ({
  title,
  description,
  extra,
  children,
  bordered = true,
  card = false,
  className,
  footer,
}) => {
  if (card) {
    return (
      <Card
        className={`${styles.section} ${bordered ? '' : styles.noBorder} ${className || ''}`}
        title={title && (
          <div className={styles.sectionHeader}>
            <span>{title}</span>
            {extra && <span className={styles.sectionExtra}>{extra}</span>}
          </div>
        )}
        extra={!title && extra ? extra : undefined}
      >
        {description && (
          <Paragraph type="secondary" className={styles.sectionDesc}>
            {description}
          </Paragraph>
        )}
        {children}
        {footer && <div className={styles.sectionFooter}>{footer}</div>}
      </Card>
    );
  }

  return (
    <div className={`${styles.sectionPlain} ${bordered ? styles.bordered : ''} ${className || ''}`}>
      {(title || extra) && (
        <div className={styles.sectionHeader}>
          {title && <Text strong>{title}</Text>}
          {extra && <span className={styles.sectionExtra}>{extra}</span>}
        </div>
      )}
      {description && (
        <Paragraph type="secondary" className={styles.sectionDesc}>
          {description}
        </Paragraph>
      )}
      {children}
      {footer && <div className={styles.sectionFooter}>{footer}</div>}
    </div>
  );
};

// ============================================
// 统计卡片组件
// ============================================

/**
 * 统计卡片组件
 */
export const StatisticCard: React.FC<StatisticCardProps> = ({
  title,
  value,
  icon,
  trend = 'none',
  trendValue,
  color = 'primary',
  loading = false,
  onClick,
  className,
}) => {
  const { isDarkMode } = useTheme();

  const colorMap = {
    primary: '#1E88E5',
    success: '#26A69A',
    warning: '#FF9800',
    error: '#FF5252',
    info: '#42A5F5',
  };

  return (
    <Card
      className={`${styles.statCard} ${onClick ? styles.clickable : ''} ${className || ''}`}
      loading={loading}
      onClick={onClick}
      hoverable={!!onClick}
    >
      <div className={styles.statContent}>
        {icon && (
          <div
            className={styles.statIcon}
            style={{ backgroundColor: `${colorMap[color]}15`, color: colorMap[color] }}
          >
            {icon}
          </div>
        )}
        <div className={styles.statInfo}>
          {title && <Text type="secondary">{title}</Text>}
          <div className={styles.statValue}>{value}</div>
          {trend !== 'none' && trendValue && (
            <Text className={styles.statTrend} style={{ color: trend === 'up' ? '#52c41a' : '#ff4d4f' }}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};

// ============================================
// 操作卡片组件
// ============================================

/**
 * 操作卡片组件
 */
export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  actions,
  clickable = false,
  loading = false,
  onClick,
  className,
  footer,
}) => {
  return (
    <Card
      className={`${styles.actionCard} ${clickable ? styles.clickable : ''} ${className || ''}`}
      loading={loading}
      hoverable={clickable}
      onClick={onClick}
    >
      <div className={styles.actionContent}>
        {icon && <div className={styles.actionIcon}>{icon}</div>}
        <div className={styles.actionInfo}>
          {title && <div className={styles.actionTitle}>{title}</div>}
          {description && <div className={styles.actionDesc}>{description}</div>}
        </div>
        {actions && <div className={styles.actionButtons}>{actions}</div>}
      </div>
      {footer && <div className={styles.actionFooter}>{footer}</div>}
    </Card>
  );
};

// ============================================
// 网格统计卡片组件
// ============================================

export interface GridStatisticProps {
  /** 数据项 */
  items: StatisticCardProps[];
  /** 列数 */
  columns?: number;
  /** 间距 */
  gutter?: [number, number];
  /** 自定义类名 */
  className?: string;
}

/**
 * 网格统计卡片组件
 */
export const GridStatistic: React.FC<GridStatisticProps> = ({
  items,
  columns = 4,
  gutter = [16, 16],
  className,
}) => {
  return (
    <Row gutter={gutter} className={className}>
      {items.map((item, index) => (
        <Col key={index} xs={24} sm={12} md={24 / columns}>
          <StatisticCard {...item} />
        </Col>
      ))}
    </Row>
  );
};

// ============================================
// 导出
// ============================================

export default PageContainer;
