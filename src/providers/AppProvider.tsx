import React, { ReactNode } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { SettingsProvider } from '../context/SettingsContext';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTheme } from '../context/ThemeContext';
import useTranslation from '../utils/i18n';
import { generateAntdTheme } from '@/styles/design-tokens';

// App Provider Props
interface AppProviderProps {
  children: ReactNode;
}

/**
 * 全局主题配置获取器
 * 使用设计令牌系统配置Ant Design主题
 */
const ThemeConfigurator: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isDarkMode } = useTheme();
  const { language } = useTranslation();

  // 根据语言选择Ant Design的语言包
  const antdLocale = language === 'zh' ? zhCN : enUS;

  // 使用设计令牌生成主题配置
  const antdTheme = generateAntdTheme(isDarkMode);

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={antdTheme}
    >
      <AntdApp>
        {children}
      </AntdApp>
    </ConfigProvider>
  );
};

/**
 * 应用根Provider组件
 * 包含所有需要的Context Provider
 */
const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <ThemeConfigurator>
          {children}
        </ThemeConfigurator>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default AppProvider;
