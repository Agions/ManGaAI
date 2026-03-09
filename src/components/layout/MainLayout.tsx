/**
 * 统一应用布局组件
 * 支持多种布局风格: simple(简洁), professional(专业)
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { Layout as AntLayout, Menu, Button, Tooltip, Avatar, Typography, Dropdown, Badge, Space, Input } from 'antd';
import {
  HomeOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  FireOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { preloadPageByPath } from '@/core/router/page-preload';
import styles from './MainLayout.module.less';

const { Sider, Content, Header } = AntLayout;
const { Title, Text } = Typography;

// 布局风格类型
export type LayoutVariant = 'simple' | 'professional';

// 布局配置接口
export interface MainLayoutProps {
  children: ReactNode;
  variant?: LayoutVariant;
  showHeader?: boolean;
  showSider?: boolean;
}

// 路由配置映射
interface RouteConfig {
  path: string;
  title: string;
  icon: React.ReactNode;
}

const routeConfigs: RouteConfig[] = [
  { path: '/', title: '首页', icon: <HomeOutlined /> },
  { path: '/project', title: '项目管理', icon: <VideoCameraOutlined /> },
  { path: '/workflow', title: '工作流', icon: <VideoCameraOutlined /> },
  { path: '/settings', title: '设置', icon: <SettingOutlined /> },
];

/**
 * 统一布局组件
 * 根据variant属性切换不同风格
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  variant = 'simple',
  showHeader = true,
  showSider = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [browserWidth, setBrowserWidth] = useState(window.innerWidth);

  // 响应式折叠控制
  useEffect(() => {
    const handleResize = () => {
      setBrowserWidth(window.innerWidth);
      if (window.innerWidth < 768 && !collapsed) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1200 && collapsed) {
        setCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed]);

  // 判断当前路径是否匹配
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 获取当前页面标题
  const getPageTitle = () => {
    const currentRoute = routeConfigs.find((route) => isActive(route.path));
    return currentRoute?.title || 'ManGa AI';
  };

  // 导航菜单项
  const menuItems = routeConfigs.map((route) => ({
    key: route.path,
    icon: route.icon,
    label: (
      <span
        onMouseEnter={() => preloadPageByPath(route.path)}
        onFocus={() => preloadPageByPath(route.path)}
      >
        {route.title}
      </span>
    ),
    onClick: () => navigate(route.path),
  }));

  // 切换折叠状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  // 用户下拉菜单
  const userMenu = {
    items: [
      {
        key: 'profile',
        label: '个人信息',
        icon: <UserOutlined />,
      },
      {
        key: 'preferences',
        label: '偏好设置',
        icon: <SettingOutlined />,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        label: '退出登录',
        danger: true,
      },
    ],
    onClick: (e: { key: string }) => {
      if (e.key === 'preferences') {
        navigate('/settings');
      } else if (e.key === 'logout') {
        console.log('用户登出');
      }
    },
  };

  // 通知菜单
  const notificationMenu = {
    items: [
      {
        key: '1',
        label: (
          <div className={styles.notificationItem}>
            <Text strong>视频处理完成</Text>
            <div>
              <Text type="secondary">《夏日海滩》视频已处理完成</Text>
            </div>
          </div>
        ),
      },
      {
        key: '2',
        label: (
          <div className={styles.notificationItem}>
            <Text strong>脚本生成完成</Text>
            <div>
              <Text type="secondary">AI助手已完成脚本生成</Text>
            </div>
          </div>
        ),
      },
      {
        key: '3',
        label: (
          <div className={styles.notificationItem}>
            <Text strong>系统通知</Text>
            <div>
              <Text type="secondary">有新版本可用：v2.1.0</Text>
            </div>
          </div>
        ),
      },
      { type: 'divider' as const },
      {
        key: 'all',
        label: <Text type="secondary">查看全部通知</Text>,
      },
    ],
    onClick: (e: { key: string }) => {
      if (e.key === 'all') {
        navigate('/notifications');
      } else {
        setNotifications((prev) => prev - 1);
      }
    },
  };

  // 简洁风格渲染
  const renderSimpleLayout = () => (
    <>
      <Sider
        className={styles.sider}
        theme="light"
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        breakpoint="lg"
      >
        <div className={styles.logo}>
          {!collapsed ? (
            <Space>
              <FireOutlined style={{ fontSize: '24px', color: '#FF5252' }} />
              <Title level={4} style={{ margin: 0 }}>
                ManGa AI
              </Title>
            </Space>
          ) : (
            <FireOutlined style={{ fontSize: '24px', color: '#FF5252' }} />
          )}
        </div>

        <Menu
          mode="inline"
          className={styles.menu}
          selectedKeys={[
            isActive('/') && !isActive('/project') && !isActive('/editor')
              ? '/'
              : isActive('/project')
                ? '/project'
                : isActive('/templates')
                  ? '/templates'
                  : isActive('/editor')
                    ? '/editor'
                    : isActive('/scripts')
                      ? '/scripts'
                      : isActive('/settings')
                        ? '/settings'
                        : '',
          ]}
          items={menuItems}
        />

        <div className={styles.collapseButton}>
          <Tooltip title={collapsed ? '展开菜单' : '收起菜单'} placement="right">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
            />
          </Tooltip>
        </div>
      </Sider>

      <AntLayout className={`${styles.mainLayout} ${collapsed ? styles.siderCollapsed : ''}`}>
        {showHeader && (
          <Header className={styles.header}>
            <div className={styles.headerTitle}>{getPageTitle()}</div>
            <div className={styles.headerControls}>
              <Tooltip title="帮助中心">
                <Button type="text" shape="circle" icon={<QuestionCircleOutlined />} />
              </Tooltip>

              <Dropdown menu={notificationMenu} trigger={['click']} placement="bottomRight" arrow>
                <Badge count={notifications} overflowCount={99} size="small">
                  <Button type="text" shape="circle" icon={<BellOutlined />} />
                </Badge>
              </Dropdown>

              <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']} arrow>
                <Button type="text" className={styles.userButton}>
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1E88E5' }}>
                      U
                    </Avatar>
                    {browserWidth > 576 && <span>用户</span>}
                  </Space>
                </Button>
              </Dropdown>
            </div>
          </Header>
        )}

        <Content className={styles.content}>
          <div className={styles.contentWrapper}>{children}</div>
        </Content>
      </AntLayout>
    </>
  );

  // 专业风格渲染
  const renderProfessionalLayout = () => (
    <AntLayout className={styles.layout}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={styles.proSider}
        width={260}
        collapsedWidth={80}
      >
        <div className={styles.proLogo}>
          <div className={styles.logoIcon}>🎬</div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>ManGa AI</span>
              <span className={styles.logoSubtitle}>AI 漫剧创作</span>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className={styles.proMenu}
        />

        {!collapsed && (
          <div className={styles.proFooter}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              block
              className={styles.newProjectBtn}
              onClick={() => navigate('/workflow')}
            >
              新建项目
            </Button>
          </div>
        )}
      </Sider>

      <AntLayout>
        {showHeader && (
          <Header className={styles.proHeader}>
            <div className={styles.headerLeft}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className={styles.trigger}
              />

              <div className={styles.searchWrapper}>
                <Input
                  placeholder="搜索项目..."
                  prefix={<SearchOutlined />}
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.headerRight}>
              <Dropdown menu={{ items: notificationMenu.items }} trigger={['click']} placement="bottomRight">
                <Badge count={3} size="small">
                  <Button type="text" icon={<BellOutlined />} className={styles.headerBtn} />
                </Badge>
              </Dropdown>

              <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
                <div className={styles.user}>
                  <Avatar size={36} icon={<UserOutlined />} className={styles.avatar} />
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>用户</span>
                    <span className={styles.userRole}>创作者</span>
                  </div>
                </div>
              </Dropdown>
            </div>
          </Header>
        )}

        <Content className={styles.proContent}>{children}</Content>
      </AntLayout>
    </AntLayout>
  );

  // 根据variant选择布局
  return variant === 'professional' ? renderProfessionalLayout() : renderSimpleLayout();
};

export default MainLayout;
