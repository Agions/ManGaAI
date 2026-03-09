/**
 * 设计令牌 (Design Tokens)
 * 统一管理所有设计变量，提供类型安全的Token访问
 */

import type { ThemeConfig } from 'antd';

// ============================================
// 颜色系统
// ============================================

export const colors = {
  // 主色
  primary: {
    default: '#1E88E5',
    hover: '#42A5F5',
    active: '#1565C0',
    light: '#E3F2FD',
  },
  // 辅助色
  secondary: {
    default: '#5C6BC0',
    hover: '#7986CB',
    active: '#3F51B5',
  },
  // 功能色
  success: '#26A69A',
  warning: '#FF9800',
  error: '#FF5252',
  info: '#42A5F5',

  // 中性色 - 亮色模式
  neutral: {
    light: {
      bg: {
        base: '#ffffff',
        elevated: '#ffffff',
        container: '#f5f7fa',
        highlighted: '#fafafa',
      },
      text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.65)',
        tertiary: 'rgba(0, 0, 0, 0.45)',
        disabled: 'rgba(0, 0, 0, 0.25)',
      },
      border: {
        default: '#e0e0e0',
        secondary: '#f0f0f0',
      },
    },
    // 中性色 - 暗色模式
    dark: {
      bg: {
        base: '#121212',
        elevated: '#1f1f1f',
        container: '#141414',
        highlighted: '#2d2d2d',
      },
      text: {
        primary: 'rgba(255, 255, 255, 0.87)',
        secondary: 'rgba(255, 255, 255, 0.65)',
        tertiary: 'rgba(255, 255, 255, 0.45)',
        disabled: 'rgba(255, 255, 255, 0.25)',
      },
      border: {
        default: '#424242',
        secondary: '#303030',
      },
    },
  },

  // 品牌渐变
  gradient: {
    primary: 'linear-gradient(135deg, #1890ff, #722ed1)',
    professional: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },

  // 强调色
  accent: {
    cyan: '#13c2c2',
    purple: '#722ed1',
    orange: '#FA8C16',
    pink: '#FF5252',
  },
} as const;

// ============================================
// 字体系统
// ============================================

export const typography = {
  // 字体家族
  fontFamily: {
    default: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace",
  },

  // 字号
  fontSize: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 30,
    '5xl': 38,
  },

  // 字重
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // 行高
  lineHeight: {
    tight: 1.25,
    base: 1.5,
    relaxed: 1.6,
    loose: 1.75,
  },

  // 标题字号
  heading: {
    h1: 38,
    h2: 30,
    h3: 24,
    h4: 20,
    h5: 18,
    h6: 16,
  },
} as const;

// ============================================
// 间距系统
// ============================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ============================================
// 圆角系统
// ============================================

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 6,
  default: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

// ============================================
// 阴影系统
// ============================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  base: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
  xl: '0 12px 40px rgba(0, 0, 0, 0.2)',

  // 特定场景
  card: '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.03), 0 4px 8px rgba(0, 0, 0, 0.03)',
  dropdown: '0 6px 16px rgba(0, 0, 0, 0.12)',
  modal: '0 8px 32px rgba(0, 0, 0, 0.2)',

  // 暗色模式
  dark: {
    base: '0 2px 8px rgba(0, 0, 0, 0.5)',
    md: '0 4px 12px rgba(0, 0, 0, 0.6)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.7)',
  },
} as const;

// ============================================
// 动画系统
// ============================================

export const transitions = {
  duration: {
    instant: '0.1s',
    fast: '0.15s',
    base: '0.2s',
    slow: '0.3s',
    slower: '0.5s',
  },

  easing: {
    base: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ============================================
// 布局尺寸
// ============================================

export const layout = {
  headerHeight: 64,
  siderWidth: 220,
  siderCollapsedWidth: 80,
  contentMaxWidth: 1200,
  containerPadding: 24,

  // 响应式断点
  breakpoints: {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
  },
} as const;

// ============================================
// Z-Index 层级
// ============================================

export const zIndex = {
  base: 1,
  dropdown: 1050,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  notification: 1600,
} as const;

// ============================================
// Ant Design 主题配置生成器
// ============================================

/**
 * 生成 Ant Design 主题配置
 */
export const generateAntdTheme = (isDark: boolean): ThemeConfig => {
  const neutral = isDark ? colors.neutral.dark : colors.neutral.light;

  return {
    token: {
      colorPrimary: colors.primary.default,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.error,
      colorInfo: colors.info,
      borderRadius: borderRadius.default,
      wireframe: false,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.default,
      colorTextBase: neutral.text.primary,
      colorBgBase: neutral.bg.base,
      colorBgElevated: neutral.bg.elevated,
      colorBorder: neutral.border.default,
    },
    components: {
      Button: {
        borderRadius: borderRadius.default,
        controlHeight: 40,
        fontWeight: typography.fontWeight.medium,
        primaryShadow: isDark ? 'none' : '0 2px 6px rgba(30, 136, 229, 0.2)',
      },
      Card: {
        borderRadiusLG: borderRadius.xl,
        boxShadow: isDark ? shadows.dark.base : shadows.card,
      },
      Input: {
        borderRadius: borderRadius.default,
        controlHeight: 40,
      },
      Select: {
        borderRadius: borderRadius.default,
        controlHeight: 40,
      },
      Menu: {
        itemBorderRadius: borderRadius.lg,
        itemHeight: 48,
      },
      Modal: {
        borderRadiusLG: borderRadius.xl,
      },
      Tabs: {
        cardGutter: 4,
        inkBarColor: colors.primary.default,
      },
      Table: {
        borderRadius: borderRadius.xl,
        headerBg: isDark ? 'rgba(255, 255, 255, 0.04)' : colors.neutral.light.bg.container,
      },
    },
  };
};

// ============================================
// 便捷工具函数
// ============================================

/**
 * 获取响应式断点
 */
export const getBreakpoint = (width: number): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' => {
  if (width < layout.breakpoints.sm) return 'xs';
  if (width < layout.breakpoints.md) return 'sm';
  if (width < layout.breakpoints.lg) return 'md';
  if (width < layout.breakpoints.xl) return 'lg';
  if (width < layout.breakpoints.xxl) return 'xl';
  return 'xxl';
};

/**
 * 检查是否为暗色模式断点
 */
export const isDarkBreakpoint = (width: number): boolean => {
  return width < layout.breakpoints.md;
};

// ============================================
// 导出类型
// ============================================

export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Transitions = typeof transitions;
export type Layout = typeof layout;
export type ZIndex = typeof zIndex;
