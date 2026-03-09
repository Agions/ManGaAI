/**
 * 通用卡片组件
 * 统一卡片样式和行为
 */

import React from 'react';
import { Card as AntCard } from 'antd';
import classNames from 'classnames';
import styles from './index.module.less';

// 简化接口，避免与 antd 冲突
interface CardProps {
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 是否选中 */
  selected?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 变体 */
  variant?: 'default' | 'outlined' | 'filled';
  /** 标题 */
  title?: React.ReactNode;
  /** 额外内容 */
  extra?: React.ReactNode;
  /** 内容 */
  children?: React.ReactNode;
  /** body样式 */
  bodyStyle?: React.CSSProperties;
  /** 其他 antd Card 属性 */
  [key: string]: unknown;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  selected = false,
  className,
  size = 'default',
  variant = 'default',
  ...props
}) => {
  return (
    <AntCard
      className={classNames(
        styles.card,
        {
          [styles.hoverable]: hoverable,
          [styles.selected]: selected
        },
        className
      )}
      {...props}
    >
      {children}
    </AntCard>
  );
};

export default Card;
