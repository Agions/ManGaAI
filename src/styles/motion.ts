/**
 * 动效系统
 * 统一管理页面切换动画、组件入场动画和微交互反馈
 */

import { CSSProperties } from 'react';

// ============================================
// 动画时长
// ============================================

export const motionDuration = {
  instant: '0.1s',
  fast: '0.15s',
  base: '0.2s',
  slow: '0.3s',
  slower: '0.5s',
} as const;

// ============================================
// 缓动函数
// ============================================

export const motionEasing = {
  // 线性
  linear: 'linear',
  // 标准缓动
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // 入场缓动
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  // 出场缓动
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  // 出场缓动 (别名)
  out: 'cubic-bezier(0.4, 0, 1, 1)',
  // 来回缓动
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // 弹性缓动
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  // 柔和弹性
  softBounce: 'cubic-bezier(0.23, 1, 0.32, 1)',
} as const;

// ============================================
// 基础动画样式
// ============================================

/**
 * 淡入动画
 */
export const fadeIn = (duration: string = motionDuration.slow): CSSProperties => ({
  animation: `fadeIn ${duration} ${motionEasing.enter} forwards`,
});

/**
 * 淡出动画
 */
export const fadeOut = (duration: string = motionDuration.slow): CSSProperties => ({
  animation: `fadeOut ${duration} ${motionEasing.exit} forwards`,
});

/**
 * 上浮动画
 */
export const slideUpIn = (duration: string = motionDuration.slow): CSSProperties => ({
  animation: `slideUpIn ${duration} ${motionEasing.out} forwards`,
});

/**
 * 下滑动画
 */
export const slideDownIn = (duration: string = motionDuration.slow): CSSProperties => ({
  animation: `slideDownIn ${duration} ${motionEasing.out} forwards`,
});

/**
 * 左滑入动画
 */
export const slideLeftIn = (duration: string = motionDuration.slow): CSSProperties => ({
  animation: `slideLeftIn ${duration} ${motionEasing.out} forwards`,
});

/**
 * 右滑入动画
 */
export const slideRightIn = (duration: string = motionDuration.slow): CSSProperties => ({
  animation: `slideRightIn ${duration} ${motionEasing.out} forwards`,
});

/**
 * 缩放淡入动画
 */
export const zoomIn = (duration: string = motionDuration.base): CSSProperties => ({
  animation: `zoomIn ${duration} ${motionEasing.standard} forwards`,
});

/**
 * 弹性出现动画
 */
export const bounceIn = (duration: string = motionDuration.slow): CSSProperties => ({
  animation: `bounceIn ${duration} ${motionEasing.bounce} forwards`,
});

// ============================================
// 动画关键帧（需要配合CSS使用）
// ============================================

export const keyframes = `
  /* 淡入 */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* 淡出 */
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  /* 上浮 */
  @keyframes slideUpIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 下滑 */
  @keyframes slideDownIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 左滑入 */
  @keyframes slideLeftIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* 右滑入 */
  @keyframes slideRightIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* 缩放淡入 */
  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* 弹性出现 */
  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
    }
  }

  /* 脉冲 */
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  /* 摇晃 */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  /* 旋转 */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* 闪光 */
  @keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* 浮动 */
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  /* 呼吸 */
  @keyframes breathe {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* 渐变流动 */
  @keyframes gradientFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

// ============================================
// 预制动画类
// ============================================

export const motionClasses = {
  // 淡入
  fadeIn: 'm-fade-in',
  fadeOut: 'm-fade-out',

  // 滑动
  slideUpIn: 'm-slide-up-in',
  slideDownIn: 'm-slide-down-in',
  slideLeftIn: 'm-slide-left-in',
  slideRightIn: 'm-slide-right-in',

  // 缩放
  zoomIn: 'm-zoom-in',
  bounceIn: 'm-bounce-in',

  // 脉冲
  pulse: 'm-pulse',
  shake: 'm-shake',
  spin: 'm-spin',
  float: 'm-float',
  breathe: 'm-breathe',

  // 闪光按钮
  shineButton: 'm-shine-button',
};

// ============================================
// React动效Hook
// ============================================

/**
 * 动画状态类型
 */
export type MotionState = 'enter' | 'appear' | 'leave';

/**
 * 入场动画配置
 */
export interface EnterMotion {
  /** 是否启用 */
  enabled?: boolean;
  /** 动画类型 */
  type?: 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoom' | 'bounce';
  /** 动画时长 */
  duration?: string;
  /** 延迟时间 */
  delay?: string;
}

/**
 * 通用入场动画Hook配置
 */
export interface UseMotionOptions {
  /** 入场动画 */
  enter?: EnterMotion;
  /** 出场动画 */
  leave?: EnterMotion;
  /** 是否首次渲染 */
  isFirstMount?: boolean;
}

/**
 * 通用入场动画Hook
 */
export const defaultEnterMotion: EnterMotion = {
  enabled: true,
  type: 'slideUp',
  duration: motionDuration.slow,
};

// ============================================
// 动画工具函数
// ============================================

/**
 * 获取动画样式
 */
export const getMotionStyle = (
  type: EnterMotion['type'],
  duration: string = motionDuration.slow
): CSSProperties => {
  switch (type) {
    case 'fade':
      return fadeIn(duration);
    case 'slideUp':
      return slideUpIn(duration);
    case 'slideDown':
      return slideDownIn(duration);
    case 'slideLeft':
      return slideLeftIn(duration);
    case 'slideRight':
      return slideRightIn(duration);
    case 'zoom':
      return zoomIn(duration);
    case 'bounce':
      return bounceIn(duration);
    default:
      return slideUpIn(duration);
  }
};

/**
 * 获取延迟样式
 */
export const getDelayStyle = (delay: string): CSSProperties => ({
  animationDelay: delay,
});

// ============================================
// 导出类型
// ============================================

export type MotionDuration = typeof motionDuration;
export type MotionEasing = typeof motionEasing;
export type MotionClasses = typeof motionClasses;
export type EnterMotionType = NonNullable<EnterMotion['type']>;
