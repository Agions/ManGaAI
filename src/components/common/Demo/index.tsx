/**
 * UI组件演示页面
 * 展示项目中使用的各种UI组件
 */

import React, { useState } from 'react';
import { Button, Card, Input, Select, Switch, Slider, Tabs, Tag, List, Avatar, Badge, Progress, Spin, Divider, Space } from 'antd';
import { UserOutlined, StarOutlined, LikeOutlined, MessageOutlined, VideoCameraOutlined, ThunderboltOutlined, CodeOutlined, CloudOutlined, BulbOutlined } from '@ant-design/icons';
import { Loading, EmptyState, PageContainer, PageSection, GridStatistic, Skeleton, AnimateIn } from '@/components/common';
import SubtitleEditor from '@/components/business/SubtitleEditor';

const { Option } = Select;
const { TabPane } = Tabs;

// 模拟字幕数据
const mockSubtitles = [
  { id: '1', startTime: 0, endTime: 3, text: '欢迎使用 ManGa AI' },
  { id: '2', startTime: 3, endTime: 6, text: 'AI 驱动的视频创作平台' },
  { id: '3', startTime: 6, endTime: 10, text: '让创作变得更简单' },
  { id: '4', startTime: 10, endTime: 14, text: '智能分析、自动剪辑' },
  { id: '5', startTime: 14, endTime: 18, text: '尽享创作乐趣' },
];

const Demo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('buttons');
  const [subtitles, setSubtitles] = useState(mockSubtitles);
  const [currentTime, setCurrentTime] = useState(0);

  // 模拟播放时间更新
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((t) => (t > 20 ? 0 : t + 0.1));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const buttons = [
    { type: 'primary', text: '主要按钮' },
    { type: 'default', text: '默认按钮' },
    { type: 'dashed', text: '虚线按钮' },
    { type: 'text', text: '文字按钮' },
    { type: 'link', text: '链接按钮' },
  ];

  const tags = [
    { color: 'blue', text: '标签一' },
    { color: 'green', text: '标签二' },
    { color: 'orange', text: '标签三' },
    { color: 'red', text: '标签四' },
  ];

  const listData = [
    { title: '列表项目 1', description: '这是列表项的描述内容' },
    { title: '列表项目 2', description: '这是列表项的描述内容' },
    { title: '列表项目 3', description: '这是列表项的描述内容' },
  ];

  // 统计卡片数据
  const stats = [
    { title: '项目总数', value: '12', icon: <VideoCameraOutlined />, color: 'primary' as const, trend: 'up' as const, trendValue: '较上周' },
    { title: '已完成', value: '8', icon: <StarOutlined />, color: 'success' as const },
    { title: '处理中', value: '3', icon: <ThunderboltOutlined />, color: 'warning' as const },
    { title: 'API调用', value: '1.2K', icon: <CloudOutlined />, color: 'info' as const, trend: 'up' as const, trendValue: '+15%' },
  ];

  return (
    <PageContainer title="UI组件演示" description="展示通用UI组件的使用方式">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="页面组件" key="page">
          <AnimateIn type="slideUp">
            <PageSection title="数据统计" extra={<Tag color="blue">实时</Tag>}>
              <GridStatistic items={stats} columns={4} />
            </PageSection>
          </AnimateIn>

          <Divider />

          <AnimateIn type="slideUp" delay={100}>
            <PageSection title="字幕编辑器" description="拖动下方滑块模拟播放进度，测试字幕高亮效果" card>
              <SubtitleEditor
                subtitles={subtitles as any}
                onChange={(newSubtitles) => setSubtitles(newSubtitles as any)}
                currentTime={currentTime}
                videoWidth={640}
                videoHeight={360}
                showPreview
              />
            </PageSection>
          </AnimateIn>

          <Divider />

          <AnimateIn type="slideUp" delay={200}>
            <PageSection title="加载状态">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Skeleton type="statistic" count={4} />
                <Skeleton type="card" title avatar />
                <Skeleton type="list" count={3} avatar />
              </Space>
            </PageSection>
          </AnimateIn>
        </TabPane>

        <TabPane tab="按钮" key="buttons">
          <Card title="按钮类型">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {buttons.map((btn) => (
                <Button key={btn.type} type={btn.type as any}>
                  {btn.text}
                </Button>
              ))}
            </div>

            <Divider>按钮尺寸</Divider>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button size="small">小按钮</Button>
              <Button>中按钮</Button>
              <Button size="large">大按钮</Button>
            </div>

            <Divider>按钮状态</Divider>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" loading>
                加载中
              </Button>
              <Button type="primary" disabled>
                禁用
              </Button>
              <Button type="primary" danger>
                危险按钮
              </Button>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="表单组件" key="forms">
          <Card title="输入框">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
              <Input placeholder="基本输入框" />
              <Input prefix={<UserOutlined />} placeholder="带图标的输入框" />
              <Input.Password placeholder="密码输入框" />
              <Input.TextArea placeholder="多行文本" rows={3} />
            </div>

            <Divider>选择器</Divider>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', maxWidth: 400 }}>
              <Select placeholder="选择框" style={{ width: 200 }}>
                <Option value="1">选项一</Option>
                <Option value="2">选项二</Option>
                <Option value="3">选项三</Option>
              </Select>

              <Switch defaultChecked />
            </div>

            <Divider>滑动条</Divider>

            <div style={{ maxWidth: 400 }}>
              <Slider defaultValue={30} />
              <Slider range defaultValue={[20, 50]} />
            </div>
          </Card>
        </TabPane>

        <TabPane tab="数据展示" key="display">
          <Card title="标签">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <Tag key={tag.color} color={tag.color}>
                  {tag.text}
                </Tag>
              ))}
            </div>

            <Divider>头像和徽标</Divider>

            <div style={{ display: 'flex', gap: 24 }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <Badge count={5}>
                <Avatar shape="square" icon={<UserOutlined />} />
              </Badge>
              <Badge dot>
                <Avatar icon={<UserOutlined />} />
              </Badge>
            </div>

            <Divider>进度条</Divider>

            <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Progress percent={30} />
              <Progress percent={70} status="active" />
              <Progress percent={100} status="success" />
              <Progress percent={50} status="exception" />
            </div>
          </Card>
        </TabPane>

        <TabPane tab="列表" key="list">
          <Card title="列表">
            <List
              itemLayout="horizontal"
              dataSource={listData}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a key="list-operation"><StarOutlined /> 收藏</a>,
                    <a key="list-operation"><LikeOutlined /> 点赞</a>,
                    <a key="list-operation"><MessageOutlined /> 评论</a>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab="反馈组件" key="feedback">
          <Card title="加载状态">
            <div style={{ display: 'flex', gap: 24 }}>
              <Spin size="small" />
              <Spin />
              <Spin size="large" />
            </div>

            <Divider>空状态</Divider>

            <EmptyState
              description="暂无数据"
              action={{
                text: '创建项目',
                onClick: () => {},
              }}
            />
          </Card>
        </TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default Demo;
