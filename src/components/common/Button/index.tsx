/**
 * 通用按钮组件
 * 统一按钮样式和行为
 */

import React from 'react';
import { Button as AntButton } from 'antd';
import classNames from 'classnames';
import styles from './index.module.less';

// 简化接口，避免与 antd 冲突
interface ButtonProps {
  /** 变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 按钮类型 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /** 是否加载中 */
  loading?: boolean | { delay?: number };
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否块级 */
  block?: boolean;
  /** 图标 */
  icon?: React.ReactNode;
  /** 点击事件 */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /** 子元素 */
  children?: React.ReactNode;
  /** className */
  className?: string;
  /** 其他 antd Button 属性 */
  [key: string]: unknown;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  type = 'primary',
  loading = false,
  disabled = false,
  block = false,
  icon,
  onClick,
  children,
  className,
  ...props
}) => {
  return (
    <AntButton
      type={type}
      size={size === 'medium' ? 'middle' : size}
      danger={variant === 'danger'}
      loading={loading}
      disabled={disabled}
      block={block}
      icon={icon}
      onClick={onClick}
      className={classNames(
        styles.button,
        className
      )}
      {...props}
    >
      {children}
    </AntButton>
  );
};

export default Button;
