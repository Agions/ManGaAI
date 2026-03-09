/**
 * 骨架屏组件
 * 用于加载过程中的占位显示，提升用户体验
 */

import React from 'react';
import { Skeleton as AntSkeleton, Card, Avatar, Button, Typography } from 'antd';
import type { SkeletonProps } from 'antd';
import styles from './Skeleton.module.less';

const { Image } = AntSkeleton;
const { Title } = Typography;

// ============================================
// 基础骨架屏
// ============================================

/**
 * 基础骨架屏属性
 */
export interface BasicSkeletonProps extends SkeletonProps {
  /** 是否显示动画 */
  active?: boolean;
}

/**
 * 基础骨架屏组件
 */
export const BasicSkeleton: React.FC<BasicSkeletonProps> = ({
  active = true,
  ...props
}) => {
  return (
    <AntSkeleton
      active={active}
      {...props}
    />
  );
};

// ============================================
// 卡片骨架屏
// ============================================

/**
 * 卡片骨架屏属性
 */
export interface CardSkeletonProps {
  /** 是否显示标题 */
  title?: boolean;
  /** 是否显示头像 */
  avatar?: boolean;
  /** 是否显示封面图 */
  cover?: boolean;
  /** 是否显示操作按钮 */
  actions?: boolean;
  /** 是否显示动画 */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 卡片骨架屏组件
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  title = true,
  avatar = true,
  cover = false,
  actions = false,
  active = true,
  className,
}) => {
  return (
    <Card className={`${styles.cardSkeleton} ${className || ''}`}>
      <AntSkeleton
        active={active}
        avatar={avatar}
        title={title}
        paragraph={{ rows: 3 }}
      >
        {cover && (
          <div className={styles.cover}>
            <Image />
          </div>
        )}
      </AntSkeleton>
      {actions && (
        <div className={styles.actions}>
          <Button type="text" disabled>编辑</Button>
          <Button type="text" disabled>删除</Button>
        </div>
      )}
    </Card>
  );
};

// ============================================
// 列表骨架屏
// ============================================

/**
 * 列表骨架屏属性
 */
export interface ListSkeletonProps {
  /** 列表项数量 */
  count?: number;
  /** 是否显示头像 */
  avatar?: boolean;
  /** 是否显示封面图 */
  cover?: boolean;
  /** 是否显示操作 */
  actions?: boolean;
  /** 是否显示动画 */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 列表骨架屏组件
 */
export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 3,
  avatar = true,
  cover = false,
  actions = false,
  active = true,
  className,
}) => {
  return (
    <div className={`${styles.listSkeleton} ${className || ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.listItem}>
          {cover ? (
            <Image className={styles.coverImage} />
          ) : avatar ? (
            <Avatar size="large" className={styles.avatar} />
          ) : null}
          <div className={styles.content}>
            <AntSkeleton
              active={active}
              title={{ width: '60%' }}
              paragraph={{ rows: 2 }}
            />
          </div>
          {actions && (
            <div className={styles.itemActions}>
              <Button type="text" size="small" disabled />
              <Button type="text" size="small" disabled />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================
// 表单骨架屏
// ============================================

/**
 * 表单骨架屏属性
 */
export interface FormSkeletonProps {
  /** 表单项数量 */
  count?: number;
  /** 是否显示标签 */
  labels?: boolean;
  /** 是否显示按钮 */
  button?: boolean;
  /** 是否显示动画 */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 表单骨架屏组件
 */
export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  count = 4,
  labels = true,
  button = true,
  active = true,
  className,
}) => {
  return (
    <div className={`${styles.formSkeleton} ${className || ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.formItem}>
          {labels && (
            <AntSkeleton.Input active={active} style={{ width: 80 }} />
          )}
          <AntSkeleton.Input active={active} style={{ width: '100%' }} />
        </div>
      ))}
      {button && (
        <div className={styles.formButton}>
          <Button type="primary" disabled>保存</Button>
        </div>
      )}
    </div>
  );
};

// ============================================
// 统计卡片骨架屏
// ============================================

/**
 * 统计卡片骨架屏属性
 */
export interface StatisticSkeletonProps {
  /** 卡片数量 */
  count?: number;
  /** 是否显示图标 */
  icon?: boolean;
  /** 是否显示标题 */
  title?: boolean;
  /** 是否显示数值 */
  value?: boolean;
  /** 是否显示动画 */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 统计卡片骨架屏组件
 */
export const StatisticSkeleton: React.FC<StatisticSkeletonProps> = ({
  count = 4,
  icon = true,
  title = true,
  value = true,
  active = true,
  className,
}) => {
  return (
    <div className={`${styles.statisticSkeleton} ${className || ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} size="small">
          <div className={styles.statisticContent}>
            {icon && (
              <div className={styles.icon}>
                <AntSkeleton.Avatar active={active} size="small" />
              </div>
            )}
            <div className={styles.statisticText}>
              {title && (
                <AntSkeleton.Input active={active} size="small" style={{ width: 60 }} />
              )}
              {value && (
                <Title level={4} style={{ margin: 0 }}>
                  <AntSkeleton active={active} paragraph={{ rows: 0 }} />
                </Title>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ============================================
// 主骨架屏组件（组合）
// ============================================

/**
 * 骨架屏类型
 */
export type SkeletonType = 'basic' | 'card' | 'list' | 'form' | 'statistic';

/**
 * 统一骨架屏属性
 */
export interface UnifiedSkeletonProps {
  /** 骨架屏类型 */
  type?: SkeletonType;
  /** 通用属性 */
  active?: boolean;
  className?: string;
  /** Card类型属性 */
  title?: boolean;
  avatar?: boolean;
  cover?: boolean;
  actions?: boolean;
  /** List类型属性 */
  count?: number;
  /** Form类型属性 */
  labels?: boolean;
  button?: boolean;
  /** Statistic类型属性 */
  icon?: boolean;
  value?: boolean;
}

/**
 * 统一骨架屏组件
 * 根据type属性渲染不同类型的骨架屏
 */
export const Skeleton: React.FC<UnifiedSkeletonProps> = ({
  type = 'basic',
  active = true,
  className,
  ...props
}) => {
  switch (type) {
    case 'card':
      return (
        <CardSkeleton
          {...props}
          active={active}
          className={className}
        />
      );
    case 'list':
      return (
        <ListSkeleton
          {...props}
          active={active}
          className={className}
        />
      );
    case 'form':
      return (
        <FormSkeleton
          {...props}
          active={active}
          className={className}
        />
      );
    case 'statistic':
      return (
        <StatisticSkeleton
          {...props}
          active={active}
          className={className}
        />
      );
    default:
      return (
        <BasicSkeleton
          active={active}
          className={className}
        />
      );
  }
};

// 导出
export default Skeleton;
