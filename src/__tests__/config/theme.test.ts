/**
 * 主题配置测试
 */

import { theme, antTheme, darkTheme, darkAntTheme, styles } from '@/styles/theme';

describe('theme', () => {
  describe('colors', () => {
    it('should have primary color', () => {
      expect(theme.colors.primary).toBe('#6366f1');
    });

    it('should have secondary color', () => {
      expect(theme.colors.secondary).toBe('#ec4899');
    });

    it('should have accent color', () => {
      expect(theme.colors.accent).toBe('#14b8a6');
    });

    it('should have semantic colors', () => {
      expect(theme.colors.success).toBe('#10b981');
      expect(theme.colors.warning).toBe('#f59e0b');
      expect(theme.colors.error).toBe('#ef4444');
      expect(theme.colors.info).toBe('#3b82f6');
    });

    it('should have gray scale', () => {
      expect(theme.colors.gray[50]).toBe('#f9fafb');
      expect(theme.colors.gray[100]).toBe('#f3f4f6');
      expect(theme.colors.gray[900]).toBe('#111827');
    });
  });

  describe('backgrounds', () => {
    it('should have background colors', () => {
      expect(theme.backgrounds.card).toBe('#ffffff');
      expect(theme.backgrounds.page).toBe('#f8fafc');
      expect(theme.backgrounds.sidebar).toBe('#1e293b');
    });
  });

  describe('text', () => {
    it('should have text colors', () => {
      expect(theme.text.primary).toBe('#1e293b');
      expect(theme.text.secondary).toBe('#64748b');
      expect(theme.text.tertiary).toBe('#94a3b8');
    });
  });

  describe('borders', () => {
    it('should have border colors', () => {
      expect(theme.borders.light).toBe('#e2e8f0');
      expect(theme.borders.medium).toBe('#cbd5e1');
    });
  });

  describe('shadows', () => {
    it('should have shadow values', () => {
      expect(theme.shadows.sm).toContain('0 1px 2px');
      expect(theme.shadows.md).toContain('0 4px 6px');
      expect(theme.shadows.lg).toContain('0 10px 15px');
      expect(theme.shadows.xl).toContain('0 20px 25px');
    });

    it('should have focus shadow', () => {
      expect(theme.shadows.focus).toContain('99, 102, 241');
    });
  });

  describe('radius', () => {
    it('should have radius values', () => {
      expect(theme.radius.sm).toBe('4px');
      expect(theme.radius.md).toBe('8px');
      expect(theme.radius.lg).toBe('12px');
      expect(theme.radius.full).toBe('9999px');
    });
  });

  describe('spacing', () => {
    it('should have spacing values', () => {
      expect(theme.spacing.xs).toBe('4px');
      expect(theme.spacing.sm).toBe('8px');
      expect(theme.spacing.md).toBe('16px');
      expect(theme.spacing.lg).toBe('24px');
      expect(theme.spacing.xl).toBe('32px');
    });
  });

  describe('fontSizes', () => {
    it('should have font sizes', () => {
      expect(theme.fontSizes.xs).toBe('12px');
      expect(theme.fontSizes.sm).toBe('14px');
      expect(theme.fontSizes.base).toBe('16px');
      expect(theme.fontSizes.lg).toBe('18px');
    });
  });

  describe('transitions', () => {
    it('should have transition values', () => {
      expect(theme.transitions.fast).toBe('150ms');
      expect(theme.transitions.normal).toBe('250ms');
      expect(theme.transitions.slow).toBe('350ms');
    });
  });

  describe('zIndex', () => {
    it('should have z-index values', () => {
      expect(theme.zIndex.dropdown).toBe(1000);
      expect(theme.zIndex.modal).toBe(1050);
      expect(theme.zIndex.tooltip).toBe(1070);
    });
  });
});

describe('antTheme', () => {
  it('should have primary color', () => {
    expect(antTheme.token.colorPrimary).toBe('#6366f1');
  });

  it('should have semantic colors', () => {
    expect(antTheme.token.colorSuccess).toBe('#10b981');
    expect(antTheme.token.colorWarning).toBe('#f59e0b');
    expect(antTheme.token.colorError).toBe('#ef4444');
    expect(antTheme.token.colorInfo).toBe('#3b82f6');
  });

  it('should have border radius', () => {
    expect(antTheme.token.borderRadius).toBe(8);
  });

  it('should have font family', () => {
    expect(antTheme.token.fontFamily).toContain('Inter');
  });

  it('should have component overrides', () => {
    expect(antTheme.components.Button).toBeDefined();
    expect(antTheme.components.Card).toBeDefined();
    expect(antTheme.components.Input).toBeDefined();
  });
});

describe('darkTheme', () => {
  it('should have dark background colors', () => {
    expect(darkTheme.backgrounds.page).toBe('#0f172a');
    expect(darkTheme.backgrounds.card).toBe('#1e293b');
  });

  it('should have dark text colors', () => {
    expect(darkTheme.text.primary).toBe('#f1f5f9');
  });
});

describe('darkAntTheme', () => {
  it('should have dark background colors', () => {
    expect(darkAntTheme.token.colorBgContainer).toBe('#1e293b');
    expect(darkAntTheme.token.colorBgLayout).toBe('#0f172a');
  });
});

describe('styles', () => {
  it('should have card style', () => {
    expect(styles.card.background).toBe('#ffffff');
    expect(styles.card.borderRadius).toBe('12px');
  });

  it('should have flex utilities', () => {
    expect(styles.flexBetween).toHaveProperty('display', 'flex');
    expect(styles.flexBetween).toHaveProperty('justifyContent', 'space-between');
    expect(styles.flexCenter).toHaveProperty('display', 'flex');
    expect(styles.flexCenter).toHaveProperty('justifyContent', 'center');
  });

  it('should have text ellipsis', () => {
    expect(styles.textEllipsis.overflow).toBe('hidden');
    expect(styles.textEllipsis.textOverflow).toBe('ellipsis');
  });
});
