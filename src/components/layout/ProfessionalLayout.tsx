/**
 * 专业页面布局组件
 * 带顶部导航和侧边栏
 */

import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Input, Space } from 'antd';
import {
  HomeOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  FolderOutlined,
  StarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ProfessionalLayout.module.less';

const { Header, Sider, Content } = Layout;

export interface ProfessionalLayoutProps {
  children: React.ReactNode;
}

const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/projects',
      icon: <FolderOutlined />,
      label: '项目',
    },
    {
      key: '/workflow',
      icon: <VideoCameraOutlined />,
      label: '工作流',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  const notificationItems: MenuProps['items'] = [
    {
      key: '1',
      label: (
        <div className={styles.notificationItem}>
          <div className={styles.notificationTitle}>项目已完成</div>
          <div className={styles.notificationDesc}>漫剧《星辰大海》已导出完成</div>
          <div className={styles.notificationTime}>2分钟前</div>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className={styles.notificationItem}>
          <div className={styles.notificationTitle}>AI 生成完成</div>
          <div className={styles.notificationDesc}>角色设计已生成完毕</div>
          <div className={styles.notificationTime}>10分钟前</div>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div className={styles.notificationItem}>
          <div className={styles.notificationTitle}>API 配额提醒</div>
          <div className={styles.notificationDesc}>本月 API 使用已达 80%</div>
          <div className={styles.notificationTime}>1小时前</div>
        </div>
      ),
    },
  ];

  return (
    <Layout className={styles.layout}>
      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className={styles.sider}
        width={260}
        collapsedWidth={80}
      >
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            🎬
          </div>
          {!collapsed && (
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>ManGa AI</span>
              <span className={styles.logoSubtitle}>AI 漫剧创作</span>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className={styles.menu}
        />

        {/* 底部 */}
        {!collapsed && (
          <div className={styles.siderFooter}>
            <div className={styles.quickAction}>
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
          </div>
        )}
      </Sider>

      <Layout>
        {/* 顶部 */}
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className={styles.trigger}
            />
            
            <Input
              placeholder="搜索项目..."
              prefix={<SearchOutlined />}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.headerRight}>
            <Space size={16}>
              {/* 通知 */}
              <Dropdown 
                menu={{ items: notificationItems }} 
                trigger={['click']}
                placement="bottomRight"
              >
                <Badge count={3} size="small">
                  <Button type="text" icon={<BellOutlined />} className={styles.headerBtn} />
                </Badge>
              </Dropdown>

              {/* 用户 */}
              <Dropdown 
                menu={{ items: userMenuItems }} 
                trigger={['click']}
                placement="bottomRight"
              >
                <div className={styles.user}>
                  <Avatar 
                    size={36} 
                    icon={<UserOutlined />}
                    className={styles.avatar}
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>用户</span>
                    <span className={styles.userRole}>创作者</span>
                  </div>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* 内容区 */}
        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ProfessionalLayout;
