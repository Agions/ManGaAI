import React from 'react';
import { Card, Tabs, Form, Input, Select, Slider, Switch, Button, Space, Divider, Typography, Row, Col, InputNumber, Radio } from 'antd';
import {
  SettingOutlined,
  FontSizeOutlined,
  AudioOutlined,
  PictureOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  SaveOutlined,
  ExportOutlined,
  ScissorOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { ASPECT_RATIOS, CROP_MODES, CROP_ALIGNMENTS, RESOLUTION_OPTIONS } from '@/core/constants';
import styles from './PropertyPanel.module.less';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PropertyPanelProps {
  selectedSegment?: {
    id: string;
    name: string;
    start: number;
    end: number;
    type: string;
  };
  videoInfo?: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    format: string;
  };
  exportSettings?: {
    format: string;
    quality: string;
    resolution: string;
    aspectRatio: string;
    cropMode: string;
    cropAlignment: string;
    smartCropEnabled: boolean;
  };
  onExportSettingsChange?: (settings: Record<string, unknown>) => void;
  onSaveSegment?: () => void;
}

// 字幕设置
const SubtitleSettings = () => (
  <div className={styles.settingsGroup}>
    <Title level={5} className={styles.groupTitle}>
      <FontSizeOutlined /> 字幕设置
    </Title>
    
    <Form layout="vertical" size="small">
      <Form.Item label="字幕内容">
        <TextArea 
          rows={4} 
          placeholder="输入字幕文本..." 
          className={styles.textArea}
        />
      </Form.Item>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="字体大小">
            <Slider min={12} max={72} defaultValue={24} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="字体颜色">
            <Input type="color" className={styles.colorInput} defaultValue="#ffffff" />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="描边颜色">
            <Input type="color" className={styles.colorInput} defaultValue="#000000" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="描边宽度">
            <Slider min={0} max={4} defaultValue={2} />
          </Form.Item>
        </Col>
      </Row>
      
      <Form.Item label="背景样式">
        <Select defaultValue="none">
          <Option value="none">无</Option>
          <Option value="box">方框</Option>
          <Option value="shadow">阴影</Option>
          <Option value="outline">描边</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label="位置">
        <Select defaultValue="bottom">
          <Option value="top">顶部</Option>
          <Option value="center">居中</Option>
          <Option value="bottom">底部</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label="样式预设">
        <Select defaultValue="default">
          <Option value="default">默认</Option>
          <Option value="modern">现代</Option>
          <Option value="cinematic">电影感</Option>
          <Option value="social">社交媒体</Option>
        </Select>
      </Form.Item>
    </Form>
  </div>
);

// 音频设置
const AudioSettings = () => (
  <div className={styles.settingsGroup}>
    <Title level={5} className={styles.groupTitle}>
      <AudioOutlined /> 音频设置
    </Title>
    
    <Form layout="vertical" size="small">
      <Form.Item label="音量">
        <Slider 
          marks={{ 0: '0%', 50: '50%', 100: '100%' }} 
          defaultValue={80} 
        />
      </Form.Item>
      
      <Form.Item label="淡入">
        <Slider 
          marks={{ 0: '0s', 2: '2s', 5: '5s' }} 
          max={5} 
          defaultValue={0} 
        />
      </Form.Item>
      
      <Form.Item label="淡出">
        <Slider 
          marks={{ 0: '0s', 2: '2s', 5: '5s' }} 
          max={5} 
          defaultValue={0} 
        />
      </Form.Item>
      
      <Divider />
      
      <Title level={5} className={styles.groupTitle}>降噪</Title>
      
      <Form.Item label="降噪强度">
        <Slider 
          marks={{ 0: '关闭', 50: '中', 100: '强' }} 
          defaultValue={0} 
        />
      </Form.Item>
      
      <Form.Item label="回声消除">
        <Switch defaultChecked={false} />
      </Form.Item>
    </Form>
  </div>
);

// 视频效果设置
const VideoSettings = () => (
  <div className={styles.settingsGroup}>
    <Title level={5} className={styles.groupTitle}>
      <PictureOutlined /> 视频效果
    </Title>
    
    <Form layout="vertical" size="small">
      <Form.Item label="亮度">
        <Slider 
          marks={{ 0: '-100', 50: '0', 100: '+100' }} 
          defaultValue={50} 
        />
      </Form.Item>
      
      <Form.Item label="对比度">
        <Slider 
          marks={{ 0: '-100', 50: '0', 100: '+100' }} 
          defaultValue={50} 
        />
      </Form.Item>
      
      <Form.Item label="饱和度">
        <Slider 
          marks={{ 0: '-100', 50: '0', 100: '+100' }} 
          defaultValue={50} 
        />
      </Form.Item>
      
      <Form.Item label="色温">
        <Slider 
          marks={{ 0: '冷', 50: '自然', 100: '暖' }} 
          defaultValue={50} 
        />
      </Form.Item>
      
      <Divider />
      
      <Form.Item label="预设效果">
        <Select defaultValue="none">
          <Option value="none">无</Option>
          <Option value="vivid">鲜艳</Option>
          <Option value="warm">暖色调</Option>
          <Option value="cool">冷色调</Option>
          <Option value="BW">黑白</Option>
          <Option value="sepia">怀旧</Option>
          <Option value="cinematic">电影感</Option>
        </Select>
      </Form.Item>
    </Form>
  </div>
// 导出设置
);

const ExportSettings = ({ 
  exportSettings, 
  onChange 
}: { 
  exportSettings?: PropertyPanelProps['exportSettings'];
  onChange?: (settings: Record<string, unknown>) => void;
}) => (
  <div className={styles.settingsGroup}>
    <Title level={5} className={styles.groupTitle}>
      <ExportOutlined /> 导出设置
    </Title>
    
    <Form layout="vertical" size="small">
      <Form.Item label="输出格式">
        <Select 
          defaultValue={exportSettings?.format || 'mp4'}
          onChange={(value) => onChange?.({ format: value })}
        >
          <Option value="mp4">MP4</Option>
          <Option value="mov">MOV</Option>
          <Option value="webm">WebM</Option>
          <Option value="gif">GIF</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label="分辨率">
        <Select 
          defaultValue={exportSettings?.resolution || '1080p'}
          onChange={(value) => onChange?.({ resolution: value })}
        >
          <Option value="720p">720p (HD)</Option>
          <Option value="1080p">1080p (Full HD)</Option>
          <Option value="1440p">1440p (2K)</Option>
          <Option value="4k">4K (Ultra HD)</Option>
          <Option value="original">原始分辨率</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label="画质">
        <Select 
          defaultValue={exportSettings?.quality || 'high'}
          onChange={(value) => onChange?.({ quality: value })}
        >
          <Option value="low">低 (适合社交媒体)</Option>
          <Option value="medium">中</Option>
          <Option value="high">高</Option>
          <Option value="original">原始质量</Option>
        </Select>
      </Form.Item>
      
      <Form.Item label="帧率">
        <Select defaultValue="30">
          <Option value="24">24 fps (电影)</Option>
          <Option value="30">30 fps (标准)</Option>
          <Option value="60">60 fps (流畅)</Option>
        </Select>
      </Form.Item>
      
      <Divider />
      
      <Form.Item label="编码器">
        <Select defaultValue="h264">
          <Option value="h264">H.264 (兼容性最好)</Option>
          <Option value="h265">H.265/HEVC (高压缩率)</Option>
          <Option value="vp9">VP9 (Web优化)</Option>
          <Option value="av1">AV1 (最新标准)</Option>
        </Select>
      </Form.Item>
      
      <Space className={styles.exportButtons}>
        <Button icon={<SaveOutlined />}>保存设置</Button>
        <Button type="primary" icon={<ExportOutlined />}>开始导出</Button>
      </Space>
    </Form>
  </div>
);

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedSegment,
  videoInfo,
  exportSettings,
  onExportSettingsChange,
  onSaveSegment
}) => {
  const tabItems = [
    {
      key: 'subtitle',
      label: (
        <span>
          <FontSizeOutlined /> 字幕
        </span>
      ),
      children: <SubtitleSettings />
    },
    {
      key: 'audio',
      label: (
        <span>
          <AudioOutlined /> 音频
        </span>
      ),
      children: <AudioSettings />
    },
    {
      key: 'video',
      label: (
        <span>
          <PictureOutlined /> 效果
        </span>
      ),
      children: <VideoSettings />
    },
    {
      key: 'export',
      label: (
        <span>
          <ExportOutlined /> 导出
        </span>
      ),
      children: (
        <ExportSettings 
          exportSettings={exportSettings}
          onChange={onExportSettingsChange}
        />
      )
    }
  ];

  return (
    <div className={styles.panel}>
      {/* 视频信息 */}
      {videoInfo && (
        <div className={styles.videoInfo}>
          <div className={styles.infoItem}>
            <Text type="secondary">分辨率</Text>
            <Text strong>{videoInfo.width} × {videoInfo.height}</Text>
          </div>
          <div className={styles.infoItem}>
            <Text type="secondary">帧率</Text>
            <Text strong>{videoInfo.fps} fps</Text>
          </div>
          <div className={styles.infoItem}>
            <Text type="secondary">时长</Text>
            <Text strong>{Math.floor(videoInfo.duration / 60)}:{String(Math.floor(videoInfo.duration % 60)).padStart(2, '0')}</Text>
          </div>
          <div className={styles.infoItem}>
            <Text type="secondary">格式</Text>
            <Text strong>{videoInfo.format.toUpperCase()}</Text>
          </div>
        </div>
      )}

      <Divider className={styles.divider} />

      {/* 片段信息 */}
      {selectedSegment && (
        <div className={styles.segmentInfo}>
          <Title level={5} className={styles.sectionTitle}>
            当前片段
          </Title>
          <div className={styles.segmentDetails}>
            <div className={styles.detailRow}>
              <Text type="secondary">名称:</Text>
              <Text>{selectedSegment.name}</Text>
            </div>
            <div className={styles.detailRow}>
              <Text type="secondary">时间:</Text>
              <Text>
                {Math.floor(selectedSegment.start / 60)}:{String(Math.floor(selectedSegment.start % 60)).padStart(2, '0')} 
                - 
                {Math.floor(selectedSegment.end / 60)}:{String(Math.floor(selectedSegment.end % 60)).padStart(2, '0')}
              </Text>
            </div>
            <div className={styles.detailRow}>
              <Text type="secondary">时长:</Text>
              <Text>{String((selectedSegment.end - selectedSegment.start).toFixed(1))}s</Text>
            </div>
          </div>
        </div>
      )}

      <Divider className={styles.divider} />

      {/* 属性面板标签页 */}
      <Tabs 
        defaultActiveKey="subtitle" 
        items={tabItems}
        className={styles.tabs}
        size="small"
      />
    </div>
  );
};

export default PropertyPanel;
