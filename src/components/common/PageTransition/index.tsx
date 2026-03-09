/**
 * 页面切换过渡组件
 * 提供流畅的页面切换动画
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type TransitionType = 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoom' | 'none';

export interface PageTransitionProps {
  /** 子元素 */
  children: ReactNode;
  /** 过渡动画类型 */
  type?: TransitionType;
  /** 过渡时长(毫秒) */
  duration?: number;
  /** 是否显示 */
  visible?: boolean;
  /** 卸载时是否等待动画完成 */
  mountOnShow?: boolean;
  /** 动画结束后回调 */
  onExited?: () => void;
}

// 过渡类型对应的类名映射
const transitionClassMap: Record<TransitionType, string> = {
  fade: 'm-fade-in',
  slideUp: 'm-slide-up-in',
  slideDown: 'm-slide-down-in',
  slideLeft: 'm-slide-left-in',
  slideRight: 'm-slide-right-in',
  zoom: 'm-zoom-in',
  none: '',
};

/**
 * 页面切换过渡组件
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  type = 'slideUp',
  duration = 300,
  visible = true,
  mountOnShow = true,
  onExited,
}) => {
  const [status, setStatus] = useState<'enter' | 'active' | 'leave'>('enter');
  const [show, setShow] = useState(visible);

  // 处理显示状态变化
  useEffect(() => {
    if (visible) {
      setShow(true);
      // 短暂延迟后触发动画
      setTimeout(() => setStatus('active'), 10);
    } else {
      setStatus('leave');
    }
  }, [visible]);

  // 处理动画结束
  useEffect(() => {
    if (status === 'leave') {
      const timer = setTimeout(() => {
        setShow(false);
        onExited?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [status, duration, onExited]);

  // 如果不显示且不保持挂载
  if (!show && !mountOnShow) {
    return null;
  }

  // 构建动画样式
  const animationStyle: React.CSSProperties = {
    animationDuration: `${duration}ms`,
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    animationFillMode: 'forwards',
  };

  // 入场动画
  if (status === 'enter' || status === 'active') {
    animationStyle.opacity = 0;

    switch (type) {
      case 'fade':
        animationStyle.animationName = 'm-fade-in';
        break;
      case 'slideUp':
        animationStyle.animationName = 'm-slide-up-in';
        break;
      case 'slideDown':
        animationStyle.animationName = 'm-slide-down-in';
        break;
      case 'slideLeft':
        animationStyle.animationName = 'm-slide-left-in';
        break;
      case 'slideRight':
        animationStyle.animationName = 'm-slide-right-in';
        break;
      case 'zoom':
        animationStyle.animationName = 'm-zoom-in';
        break;
    }
  }

  // 使用portal渲染到body
  if (typeof document !== 'undefined') {
    return createPortal(
      <div
        className="page-transition-wrapper"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          pointerEvents: status === 'leave' ? 'none' : 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            ...animationStyle,
          }}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', ...animationStyle }}>
      {children}
    </div>
  );
};

/**
 * 带过渡效果的路由容器
 */
export interface TransitionRouterProps {
  /** 当前激活的key */
  activeKey?: string;
  /** 子元素 */
  children: ReactNode;
  /** 过渡类型 */
  type?: TransitionType;
  /** 过渡时长 */
  duration?: number;
}

/**
 * 路由过渡容器组件
 */
export const TransitionRouter: React.FC<TransitionRouterProps> = ({
  activeKey,
  children,
  type = 'slideUp',
  duration = 300,
}) => {
  const [currentKey, setCurrentKey] = useState(activeKey);
  const [prevKey, setPrevKey] = useState(activeKey);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (activeKey !== currentKey) {
      setPrevKey(currentKey);
      setTransitioning(true);
      setTimeout(() => {
        setCurrentKey(activeKey);
        setTransitioning(false);
      }, duration);
    }
  }, [activeKey, currentKey, duration]);

  // 找到当前激活的children
  const child = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.key === currentKey
  );

  return (
    <div className="transition-router">
      {transitioning && prevKey && (
        <div
          className="transition-exit"
          style={{
            animation: `${type === 'fade' ? 'm-fade-out' : 'm-fade-out'} ${duration}ms forwards`,
          }}
        >
          {React.Children.toArray(children).find(
            (child) => React.isValidElement(child) && child.key === prevKey
          )}
        </div>
      )}
      {child && (
        <div
          className="transition-enter"
          style={{
            animation: `${transitionClassMap[type]} ${duration}ms forwards`,
          }}
        >
          {child}
        </div>
      )}
    </div>
  );
};

/**
 * 入场动画包装器
 * 为组件添加入场动画
 */
export interface AnimateInProps {
  /** 子元素 */
  children: ReactNode;
  /** 动画类型 */
  type?: NonNullable<TransitionType>;
  /** 延迟时间(毫秒) */
  delay?: number;
  /** 是否立即显示 */
  show?: boolean;
  /** 动画时长 */
  duration?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 入场动画包装器组件
 */
export const AnimateIn: React.FC<AnimateInProps> = ({
  children,
  type = 'slideUp',
  delay = 0,
  show = true,
  duration = 300,
  className,
}) => {
  const [visible, setVisible] = useState(!show);

  useEffect(() => {
    if (show) {
      setTimeout(() => setVisible(true), delay);
    } else {
      setVisible(false);
    }
  }, [show, delay]);

  if (!visible) {
    return null;
  }

  const animationStyle: React.CSSProperties = {
    animationDuration: `${duration}ms`,
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    animationFillMode: 'forwards',
    animationDelay: `${delay}ms`,
    opacity: 0,
  };

  switch (type) {
    case 'fade':
      animationStyle.animationName = 'm-fade-in';
      break;
    case 'slideUp':
      animationStyle.animationName = 'm-slide-up-in';
      break;
    case 'slideDown':
      animationStyle.animationName = 'm-slide-down-in';
      break;
    case 'slideLeft':
      animationStyle.animationName = 'm-slide-left-in';
      break;
    case 'slideRight':
      animationStyle.animationName = 'm-slide-right-in';
      break;
    case 'zoom':
      animationStyle.animationName = 'm-zoom-in';
      break;
  }

  return (
    <div className={className} style={animationStyle}>
      {children}
    </div>
  );
};

export default PageTransition;
