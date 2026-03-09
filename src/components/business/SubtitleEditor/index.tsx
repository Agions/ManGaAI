/**
 * 字幕编辑器组件
 * 提供字幕文本编辑、样式配置、预览等功能
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Select,
  ColorPicker,
  Slider,
  Button,
  Space,
  Typography,
  List,
  Tag,
  Tooltip,
  Divider,
  message,
} from 'antd';
import {
  FontSizeOutlined,
  BgColorsOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/context/ThemeContext';
import styles from './SubtitleEditor.module.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ============================================
// 类型定义
// ============================================

export interface SubtitleItem {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  outlineColor: string;
  position: 'top' | 'middle' | 'bottom';
  alignment: 'left' | 'center' | 'right';
}

export interface SubtitleEditorProps {
  /** 字幕列表 */
  subtitles: SubtitleItem[];
  /** 字幕变化回调 */
  onChange: (subtitles: SubtitleItem[]) => void;
  /** 当前播放时间（用于高亮当前字幕） */
  currentTime?: number;
  /** 视频宽度（用于预览） */
  videoWidth?: number;
  /** 视频高度（用于预览） */
  videoHeight?: number;
  /** 是否显示预览 */
  showPreview?: boolean;
  /** 只读模式 */
  readonly?: boolean;
  /** 自定义类名 */
  className?: string;
}

// 默认字幕样式
const defaultStyle: SubtitleStyle = {
  fontFamily: 'Microsoft YaHei',
  fontSize: 24,
  color: '#ffffff',
  backgroundColor: 'transparent',
  outline: true,
  outlineColor: '#000000',
  position: 'bottom',
  alignment: 'center',
};

// 字体选项
const fontFamilyOptions = [
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '黑体', value: 'SimHei' },
  { label: '楷体', value: 'KaiTi' },
  { label: '苹方', value: 'PingFang SC' },
  { label: '思源黑体', value: 'Source Han Sans SC' },
];

// 位置选项
const positionOptions = [
  { label: '顶部', value: 'top' },
  { label: '中间', value: 'middle' },
  { label: '底部', value: 'bottom' },
];

// 对齐选项
const alignmentOptions = [
  { label: <AlignLeftOutlined />, value: 'left' },
  { label: <AlignCenterOutlined />, value: 'center' },
  { label: <AlignRightOutlined />, value: 'right' },
];

// ============================================
// 字幕编辑器组件
// ============================================

/**
 * 字幕编辑器组件
 */
export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  subtitles,
  onChange,
  currentTime = 0,
  videoWidth = 1920,
  videoHeight = 1080,
  showPreview = true,
  readonly = false,
  className,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [previewStyle, setPreviewStyle] = useState<SubtitleStyle>(defaultStyle);

  // 选中的字幕
  const selectedSubtitle = subtitles.find((s) => s.id === selectedId);

  // 当前高亮的字幕（根据播放时间）
  const activeSubtitle = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  // 更新字幕列表
  const updateSubtitle = (id: string, updates: Partial<SubtitleItem>) => {
    const newSubtitles = subtitles.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    onChange(newSubtitles);
  };

  // 更新字幕样式
  const updateStyle = (updates: Partial<SubtitleStyle>) => {
    if (!selectedId) return;
    const newStyle = { ...previewStyle, ...updates };
    setPreviewStyle(newStyle);

    const newSubtitles = subtitles.map((s) =>
      s.id === selectedId ? { ...s, style: newStyle } : s
    );
    onChange(newSubtitles);
  };

  // 添加新字幕
  const addSubtitle = () => {
    const newSubtitle: SubtitleItem = {
      id: `subtitle-${Date.now()}`,
      startTime: currentTime,
      endTime: currentTime + 3,
      text: '新字幕',
      style: { ...defaultStyle },
    };
    onChange([...subtitles, newSubtitle]);
    setSelectedId(newSubtitle.id);
    setEditingText(newSubtitle.text);
    setPreviewStyle(newSubtitle.style || defaultStyle);
  };

  // 删除字幕
  const deleteSubtitle = (id: string) => {
    const newSubtitles = subtitles.filter((s) => s.id !== id);
    onChange(newSubtitles);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  // 复制字幕
  const duplicateSubtitle = (subtitle: SubtitleItem) => {
    const newSubtitle: SubtitleItem = {
      ...subtitle,
      id: `subtitle-${Date.now()}`,
      startTime: subtitle.endTime,
      endTime: subtitle.endTime + (subtitle.endTime - subtitle.startTime),
    };
    const index = subtitles.findIndex((s) => s.id === subtitle.id);
    const newSubtitles = [
      ...subtitles.slice(0, index + 1),
      newSubtitle,
      ...subtitles.slice(index + 1),
    ];
    onChange(newSubtitles);
    setSelectedId(newSubtitle.id);
  };

  // 选择字幕
  const handleSelect = (subtitle: SubtitleItem) => {
    setSelectedId(subtitle.id);
    setEditingText(subtitle.text);
    setPreviewStyle(subtitle.style || defaultStyle);
  };

  // 格式化时间
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // 字幕预览渲染
  const renderPreview = () => {
    const active = activeSubtitle || selectedSubtitle;
    if (!active) return null;

    const style = active.style || previewStyle;
    const positionY = style.position === 'top' ? '10%' : style.position === 'middle' ? '50%' : '90%';
    const textAlign = style.alignment;

    return (
      <div
        className={styles.previewSubtitle}
        style={{
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize}px`,
          color: style.color,
          backgroundColor: style.backgroundColor,
          textAlign: textAlign as 'left' | 'center' | 'right',
          top: positionY,
          WebkitTextStroke: style.outline ? `1px ${style.outlineColor}` : undefined,
          textShadow: style.outline
            ? `-1px -1px 0 ${style.outlineColor}, 1px -1px 0 ${style.outlineColor}, -1px 1px 0 ${style.outlineColor}, 1px 1px 0 ${style.outlineColor}`
            : undefined,
        }}
      >
        {editingText || active.text}
      </div>
    );
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* 预览区域 */}
      {showPreview && (
        <div className={styles.previewArea}>
          <div
            className={styles.preview}
            style={{
              width: videoWidth,
              height: videoHeight,
              maxWidth: '100%',
              maxHeight: 300,
            }}
          >
            {/* 预览背景 */}
            <div className={styles.previewBg}>
              <Text type="secondary">视频预览区域</Text>
            </div>
            {/* 字幕渲染 */}
            {renderPreview()}
          </div>
        </div>
      )}

      <div className={styles.editorArea}>
        {/* 字幕列表 */}
        <Card
          className={styles.subtitleList}
          title={
            <Space>
              <Text strong>字幕列表</Text>
              <Tag color="blue">{subtitles.length}</Tag>
            </Space>
          }
          extra={
            !readonly && (
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addSubtitle}>
                添加字幕
              </Button>
            )
          }
        >
          <List
            dataSource={subtitles}
            locale={{ emptyText: '暂无字幕，点击添加' }}
            renderItem={(subtitle) => (
              <List.Item
                className={`${styles.subtitleItem} ${selectedId === subtitle.id ? styles.selected : ''} ${currentTime >= subtitle.startTime && currentTime <= subtitle.endTime ? styles.active : ''}`}
                onClick={() => handleSelect(subtitle)}
              >
                <div className={styles.subtitleInfo}>
                  <Tag color="default">{formatTime(subtitle.startTime)}</Tag>
                  <span className={styles.subtitleText}>{subtitle.text}</span>
                  <Tag color="default">{formatTime(subtitle.endTime)}</Tag>
                </div>
                {!readonly && (
                  <Space size="small">
                    <Tooltip title="复制">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSubtitle(subtitle);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubtitle(subtitle.id);
                        }}
                      />
                    </Tooltip>
                  </Space>
                )}
              </List.Item>
            )}
          />
        </Card>

        {/* 字幕编辑 */}
        {selectedSubtitle && (
          <Card className={styles.subtitleEditor} title="字幕编辑">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 时间设置 */}
              <div className={styles.timeRow}>
                <Text type="secondary">时间:</Text>
                <Input
                  type="number"
                  value={selectedSubtitle.startTime}
                  onChange={(e) => updateSubtitle(selectedSubtitle.id, { startTime: Number(e.target.value) })}
                  style={{ width: 80 }}
                  step={0.1}
                  min={0}
                  disabled={readonly}
                />
                <Text> - </Text>
                <Input
                  type="number"
                  value={selectedSubtitle.endTime}
                  onChange={(e) => updateSubtitle(selectedSubtitle.id, { endTime: Number(e.target.value) })}
                  style={{ width: 80 }}
                  step={0.1}
                  min={0}
                  disabled={readonly}
                />
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  ({formatTime(selectedSubtitle.endTime - selectedSubtitle.startTime)})
                </Text>
              </div>

              {/* 文本编辑 */}
              <div>
                <Text type="secondary">文本内容:</Text>
                <TextArea
                  value={editingText}
                  onChange={(e) => {
                    setEditingText(e.target.value);
                    updateSubtitle(selectedSubtitle.id, { text: e.target.value });
                  }}
                  rows={2}
                  placeholder="输入字幕文本"
                  disabled={readonly}
                />
              </div>

              <Divider>样式设置</Divider>

              {/* 字体设置 */}
              <div className={styles.styleRow}>
                <Text type="secondary">
                  <FontSizeOutlined /> 字体:
                </Text>
                <Select
                  value={previewStyle.fontFamily}
                  onChange={(value) => updateStyle({ fontFamily: value })}
                  options={fontFamilyOptions}
                  style={{ width: 150 }}
                  disabled={readonly}
                />
                <Text type="secondary">大小:</Text>
                <Slider
                  min={12}
                  max={72}
                  value={previewStyle.fontSize}
                  onChange={(value) => updateStyle({ fontSize: value })}
                  style={{ width: 100 }}
                  disabled={readonly}
                />
                <Text>{previewStyle.fontSize}px</Text>
              </div>

              {/* 颜色设置 */}
              <div className={styles.styleRow}>
                <Text type="secondary">
                  <BgColorsOutlined /> 颜色:
                </Text>
                <ColorPicker
                  value={previewStyle.color}
                  onChange={(color) => updateStyle({ color: color.toHexString() })}
                  disabled={readonly}
                />
                <Text type="secondary" style={{ marginLeft: 16 }}>背景:</Text>
                <ColorPicker
                  value={previewStyle.backgroundColor}
                  onChange={(color) => updateStyle({ backgroundColor: color.toHexString() })}
                  disabled={readonly}
                />
              </div>

              {/* 描边设置 */}
              <div className={styles.styleRow}>
                <Text type="secondary">描边:</Text>
                <Select
                  value={previewStyle.outline ? 'outline' : 'none'}
                  onChange={(value) => updateStyle({ outline: value === 'outline' })}
                  options={[
                    { label: '无', value: 'none' },
                    { label: '描边', value: 'outline' },
                  ]}
                  style={{ width: 80 }}
                  disabled={readonly}
                />
                {previewStyle.outline && (
                  <>
                    <Text type="secondary">描边颜色:</Text>
                    <ColorPicker
                      value={previewStyle.outlineColor}
                      onChange={(color) => updateStyle({ outlineColor: color.toHexString() })}
                      disabled={readonly}
                    />
                  </>
                )}
              </div>

              {/* 位置和对齐 */}
              <div className={styles.styleRow}>
                <Text type="secondary">位置:</Text>
                <Select
                  value={previewStyle.position}
                  onChange={(value) => updateStyle({ position: value })}
                  options={positionOptions}
                  style={{ width: 80 }}
                  disabled={readonly}
                />
                <Text type="secondary" style={{ marginLeft: 16 }}>对齐:</Text>
                <Select
                  value={previewStyle.alignment}
                  onChange={(value) => updateStyle({ alignment: value })}
                  options={alignmentOptions}
                  style={{ width: 80 }}
                  disabled={readonly}
                />
              </div>
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
};

// ============================================
// 字幕样式预设
// ============================================

export const subtitlePresets = [
  {
    name: '经典白字',
    style: {
      fontFamily: 'Microsoft YaHei',
      fontSize: 24,
      color: '#ffffff',
      backgroundColor: 'transparent',
      outline: true,
      outlineColor: '#000000',
      position: 'bottom' as const,
      alignment: 'center' as const,
    },
  },
  {
    name: '黑色半透明背景',
    style: {
      fontFamily: 'Microsoft YaHei',
      fontSize: 22,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      outline: false,
      outlineColor: '#000000',
      position: 'bottom' as const,
      alignment: 'center' as const,
    },
  },
  {
    name: '黄色高亮',
    style: {
      fontFamily: 'Microsoft YaHei',
      fontSize: 26,
      color: '#ffff00',
      backgroundColor: 'transparent',
      outline: true,
      outlineColor: '#000000',
      position: 'bottom' as const,
      alignment: 'center' as const,
    },
  },
  {
    name: '顶部标题',
    style: {
      fontFamily: 'Microsoft YaHei',
      fontSize: 32,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      outline: false,
      outlineColor: '#000000',
      position: 'top' as const,
      alignment: 'center' as const,
    },
  },
];

// ============================================
// 导出
// ============================================

export default SubtitleEditor;
