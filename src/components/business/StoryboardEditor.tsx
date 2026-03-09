import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Typography,
  Space,
  Empty,
  message,
  Popconfirm,
  Slider,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  LeftOutlined,
  RightOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ScissorOutlined,
  AimOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import styles from './StoryboardEditor.module.less';

const { Title, Text } = Typography;
const { TextArea } = Input;

const { Option } = Select;

// 分镜数据接口
export interface StoryboardFrame {
  id: string;
  title: string;
  sceneDescription: string;
  composition: string;
  cameraType: string;
  dialogue: string;
  duration: number;
  imageUrl?: string;
}

// 镜头类型选项
const CAMERA_TYPES = [
  { value: 'wide', label: '全景', icon: <AimOutlined /> },
  { value: 'medium', label: '中景', icon: <VideoCameraOutlined /> },
  { value: 'closeup', label: '特写', icon: <ScissorOutlined /> },
  { value: 'pan', label: '横摇', icon: <SwapOutlined /> },
  { value: 'tilt', label: '竖摇', icon: <SwapOutlined rotate={90} /> },
  { value: 'dolly', label: '推拉', icon: <VideoCameraOutlined /> },
  { value: 'tracking', label: '跟随', icon: <VideoCameraOutlined /> },
];

// 构图类型选项
const COMPOSITION_TYPES = [
  '中心构图',
  '三分法',
  '对角线',
  '引导线',
  '框架式',
  '留白',
  '对称式',
  '三角形',
];

interface StoryboardEditorProps {
  initialFrames?: StoryboardFrame[];
  focusFrameId?: string;
  onChange?: (frames: StoryboardFrame[]) => void;
  onFrameSelect?: (frame: StoryboardFrame | null) => void;
}

const StoryboardEditor: React.FC<StoryboardEditorProps> = ({
  initialFrames = [],
  focusFrameId,
  onChange,
  onFrameSelect,
}) => {
  const [frames, setFrames] = useState<StoryboardFrame[]>(initialFrames);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(
    initialFrames.length > 0 ? initialFrames[0].id : null
  );

  useEffect(() => {
    if (!focusFrameId) return;
    const focusFrame = frames.find((frame) => frame.id === focusFrameId);
    if (!focusFrame) return;
    setSelectedFrameId(focusFrameId);
    onFrameSelect?.(focusFrame);
  }, [focusFrameId, frames, onFrameSelect]);

  // 生成唯一ID
  const generateId = () => {
    return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // 获取选中的分镜
  const selectedFrame = frames.find((f) => f.id === selectedFrameId) || null;

  // 添加分镜
  const addFrame = useCallback(() => {
    const newFrame: StoryboardFrame = {
      id: generateId(),
      title: `分镜 ${frames.length + 1}`,
      sceneDescription: '',
      composition: '三分法',
      cameraType: 'medium',
      dialogue: '',
      duration: 5,
    };

    const updatedFrames = [...frames, newFrame];
    setFrames(updatedFrames);
    setSelectedFrameId(newFrame.id);
    onChange?.(updatedFrames);
    onFrameSelect?.(newFrame);
    message.success('添加分镜成功');
  }, [frames, onChange, onFrameSelect]);

  // 删除分镜
  const removeFrame = useCallback(
    (id: string) => {
      const updatedFrames = frames.filter((f) => f.id !== id);
      setFrames(updatedFrames);

      if (selectedFrameId === id) {
        const newSelected =
          updatedFrames.length > 0 ? updatedFrames[0].id : null;
        setSelectedFrameId(newSelected);
        onFrameSelect?.(updatedFrames.find((f) => f.id === newSelected) || null);
      }

      onChange?.(updatedFrames);
      message.success('删除分镜成功');
    },
    [frames, selectedFrameId, onChange, onFrameSelect]
  );

  // 更新分镜
  const updateFrame = useCallback(
    (id: string, field: keyof StoryboardFrame, value: string | number) => {
      const updatedFrames = frames.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      );
      setFrames(updatedFrames);
      onChange?.(updatedFrames);

      if (id === selectedFrameId) {
        const updated = updatedFrames.find((f) => f.id === id);
        if (updated) {
          onFrameSelect?.(updated);
        }
      }
    },
    [frames, selectedFrameId, onChange, onFrameSelect]
  );

  // 选择分镜
  const handleSelectFrame = useCallback(
    (id: string) => {
      setSelectedFrameId(id);
      const frame = frames.find((f) => f.id === id);
      onFrameSelect?.(frame || null);
    },
    [frames, onFrameSelect]
  );

  // 导航到上一个/下一个分镜
  const navigateFrame = useCallback(
    (direction: 'prev' | 'next') => {
      if (frames.length === 0) return;

      const currentIndex = frames.findIndex((f) => f.id === selectedFrameId);
      let newIndex: number;

      if (direction === 'prev') {
        newIndex = currentIndex <= 0 ? frames.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= frames.length - 1 ? 0 : currentIndex + 1;
      }

      handleSelectFrame(frames[newIndex].id);
    },
    [frames, selectedFrameId, handleSelectFrame]
  );

  // 渲染分镜列表项
  const renderFrameItem = (frame: StoryboardFrame, index: number) => {
    const isSelected = frame.id === selectedFrameId;

    return (
      <Card
        key={frame.id}
        className={`${styles.frameItem} ${isSelected ? styles.selected : ''}`}
        onClick={() => handleSelectFrame(frame.id)}
        size="small"
      >
        <div className={styles.frameItemContent}>
          <div className={styles.frameNumber}>{index + 1}</div>
          <div className={styles.frameInfo}>
            <div className={styles.frameTitle}>{frame.title}</div>
            <div className={styles.frameDuration}>
              {frame.duration}秒 | {frame.cameraType}
            </div>
          </div>
          <div className={styles.frameActions}>
            <Popconfirm
              title="确定要删除这个分镜吗？"
              onConfirm={(e) => {
                e?.stopPropagation();
                removeFrame(frame.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </div>
        </div>
      </Card>
    );
  };

  // 渲染空状态
  const renderEmptyFrames = () => (
    <div className={styles.emptyList}>
      <PictureOutlined style={{ fontSize: 48 }} />
      <div className={styles.emptyText}>暂无分镜，点击下方按钮添加</div>
    </div>
  );

  // 渲染画布预览
  const renderCanvas = () => {
    if (!selectedFrame) {
      return (
        <div className={styles.canvasEmpty}>
          <PictureOutlined className={styles.emptyIcon} />
          <div className={styles.emptyText}>选择或创建分镜以预览</div>
        </div>
      );
    }

    return (
      <div className={styles.canvasPreview}>
        {selectedFrame.imageUrl ? (
          <img
            src={selectedFrame.imageUrl}
            alt={selectedFrame.title}
            className={styles.canvasImage}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
        )}
        <div className={styles.canvasOverlay}>
          {selectedFrame.dialogue && (
            <div className={styles.canvasDialogue}>{selectedFrame.dialogue}</div>
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            display: 'flex',
            gap: 8,
          }}
        >
          <Tag color="blue">{selectedFrame.cameraType}</Tag>
          <Tag>{selectedFrame.composition}</Tag>
        </div>
      </div>
    );
  };

  // 渲染属性编辑面板
  const renderPropertyPanel = () => {
    if (!selectedFrame) {
      return (
        <div className={styles.emptyProperty}>
          <PictureOutlined style={{ fontSize: 48 }} />
          <div className={styles.emptyText}>选择分镜以编辑属性</div>
        </div>
      );
    }

    return (
      <div className={styles.propertyForm}>
        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>基本信息</span>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>分镜标题</label>
            <Input
              value={selectedFrame.title}
              onChange={(e) =>
                updateFrame(selectedFrame.id, 'title', e.target.value)
              }
              placeholder="输入分镜标题"
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>时长（秒）</label>
            <Slider
              min={1}
              max={30}
              value={selectedFrame.duration}
              onChange={(value) =>
                updateFrame(selectedFrame.id, 'duration', value)
              }
              marks={{
                1: '1s',
                5: '5s',
                10: '10s',
                15: '15s',
                30: '30s',
              }}
            />
            <Text type="secondary">{selectedFrame.duration} 秒</Text>
          </div>
        </div>

        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>画面设置</span>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>场景描述</label>
            <TextArea
              value={selectedFrame.sceneDescription}
              onChange={(e) =>
                updateFrame(selectedFrame.id, 'sceneDescription', e.target.value)
              }
              placeholder="描述这个场景的内容"
              rows={3}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>构图方式</label>
            <Select
              value={selectedFrame.composition}
              onChange={(value) =>
                updateFrame(selectedFrame.id, 'composition', value)
              }
              style={{ width: '100%' }}
            >
              {COMPOSITION_TYPES.map((type) => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>镜头类型</label>
            <div style={{ marginTop: 8 }}>
              {CAMERA_TYPES.map((type) => (
                <Tooltip key={type.value} title={type.label}>
                  <Tag
                    color={selectedFrame.cameraType === type.value ? 'blue' : 'default'}
                    style={{ cursor: 'pointer', marginBottom: 8 }}
                    onClick={() =>
                      updateFrame(selectedFrame.id, 'cameraType', type.value)
                    }
                    icon={type.icon}
                  >
                    {type.label}
                  </Tag>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <span className={styles.sectionLabel}>台词/配文</span>
          <div className={styles.formRow}>
            <TextArea
              value={selectedFrame.dialogue}
              onChange={(e) =>
                updateFrame(selectedFrame.id, 'dialogue', e.target.value)
              }
              placeholder="输入角色台词或旁白"
              rows={4}
              showCount
              maxLength={500}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 左侧分镜列表 */}
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <Title level={5} className={styles.title}>
            分镜列表
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addFrame}
            size="small"
          >
            添加
          </Button>
        </div>
        <div className={styles.frameList}>
          {frames.length > 0 ? (
            frames.map((frame, index) => renderFrameItem(frame, index))
          ) : (
            renderEmptyFrames()
          )}
        </div>
      </div>

      {/* 中间画布预览 */}
      <div className={styles.centerPanel}>
        <div className={styles.canvasContainer}>{renderCanvas()}</div>
        <div className={styles.frameNav}>
          <div className={styles.navInfo}>
            {selectedFrame
              ? `${(frames.findIndex((f) => f.id === selectedFrameId) || 0) + 1} / ${frames.length}`
              : '0 / 0'}
          </div>
          <div className={styles.navButtons}>
            <Button
              icon={<LeftOutlined />}
              onClick={() => navigateFrame('prev')}
              disabled={frames.length === 0}
            >
              上一帧
            </Button>
            <Button
              icon={<RightOutlined />}
              onClick={() => navigateFrame('next')}
              disabled={frames.length === 0}
            >
              下一帧
            </Button>
          </div>
        </div>
      </div>

      {/* 右侧属性编辑 */}
      <div className={styles.rightPanel}>
        <div className={styles.panelHeader}>
          <Title level={5} className={styles.title}>
            分镜属性
          </Title>
        </div>
        {renderPropertyPanel()}
      </div>
    </div>
  );
};

export default StoryboardEditor;
