import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Card,
  Button,
  Table,
  Form,
  Select,
  InputNumber,
  Slider,
  Space,
  Divider,
  Modal,
  message,
  Empty,
  Tooltip,
  Row,
  Col,
  Switch,
  ColorPicker,
  Typography,
  Popconfirm,
  Tag,
  Timeline,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  VideoCameraOutlined,
  FastForwardOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExportOutlined,
  KeyOutlined,
  BgColorsOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Color } from 'antd/es/color-picker';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import styles from './index.module.less';

const { Option } = Select;
const { Text, Title } = Typography;

// 项目类型
import type { 
  StoryboardFrame, 
  CompositionProject, 
  FrameAnimation, 
  CameraMotionConfig, 
  TransitionConfig,
  AnimationKeyframe,
  AnimationTrack 
} from '@/core/types';

interface CompositionStudioProps {
  frames: StoryboardFrame[];
  projectId?: string;
  onCompositionChange?: (composition: CompositionProject) => void;
}

// 镜头运动类型选项
const CAMERA_MOTION_OPTIONS = [
  { value: 'static', label: '静止' },
  { value: 'pan-left', label: '左摇' },
  { value: 'pan-right', label: '右摇' },
  { value: 'tilt-up', label: '上仰' },
  { value: 'tilt-down', label: '下俯' },
  { value: 'dolly-in', label: '推进' },
  { value: 'dolly-out', label: '拉远' },
  { value: 'zoom-in', label: '放大' },
  { value: 'zoom-out', label: '缩小' },
  { value: 'shake', label: '抖动' },
];

// 转场效果选项
const TRANSITION_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'crossfade', label: '交叉淡化' },
  { value: 'dissolve', label: '溶解' },
  { value: 'wipe-left', label: '左擦除' },
  { value: 'wipe-right', label: '右擦除' },
  { value: 'wipe-up', label: '上擦除' },
  { value: 'wipe-down', label: '下擦除' },
  { value: 'slide-left', label: '左滑入' },
  { value: 'slide-right', label: '右滑入' },
  { value: 'zoom', label: '缩放过渡' },
  { value: 'blur', label: '模糊过渡' },
];

// 默认转场
const DEFAULT_TRANSITION: TransitionConfig = {
  effect: 'crossfade',
  duration: 0.5,
  easing: 'ease-in-out',
};

// 生成唯一ID
const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const CompositionStudio: React.FC<CompositionStudioProps> = ({
  frames,
  projectId,
  onCompositionChange,
}) => {
  const [composition, setComposition] = useState<CompositionProject>(() => ({
    id: generateId(),
    projectId: projectId || '',
    frames: [],
    transitions: [],
    masterSettings: {
      frameDuration: 3,
      defaultTransition: DEFAULT_TRANSITION,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);
  const [frameModalVisible, setFrameModalVisible] = useState(false);
  const [globalModalVisible, setGlobalModalVisible] = useState(false);
  const [keyframeModalVisible, setKeyframeModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTransitionPreview, setShowTransitionPreview] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<TransitionConfig | null>(null);
  const [keyframes, setKeyframes] = useState<AnimationKeyframe[]>([]);
  const animationRef = useRef<number | null>(null);

  // 通知父组件
  useEffect(() => {
    onCompositionChange?.(composition);
  }, [composition, onCompositionChange]);

  // 初始化帧动画配置
  useEffect(() => {
    if (frames.length > 0) {
      const existingFrameIds = new Set(composition.frames.map(f => f.frameId));
      const missingFrames = frames.filter(f => !existingFrameIds.has(f.id));

      if (missingFrames.length > 0) {
        const newFrames = missingFrames.map(frame => ({
          frameId: frame.id,
          cameraMotion: null,
          zoom: 1,
          pan: { x: 0, y: 0 },
          rotation: 0,
          opacity: 1,
          filters: {
            blur: 0,
            brightness: 100,
            contrast: 100,
            saturation: 100,
          },
          keyframes: [], // 关键帧系统
        })) as FrameAnimation[];

        setComposition(prev => ({
          ...prev,
          frames: [...prev.frames, ...newFrames],
          updatedAt: new Date().toISOString(),
        }));
      }
    }
  }, [frames]);

  // 打开帧编辑模态框
  const handleEditFrame = (frameId: string) => {
    setEditingFrameId(frameId);
    setFrameModalVisible(true);
  };

  // 打开关键帧编辑器
  const handleOpenKeyframes = (frameId: string) => {
    const frameConfig = composition.frames.find(f => f.frameId === frameId);
    setKeyframes(frameConfig?.keyframes || []);
    setEditingFrameId(frameId);
    setKeyframeModalVisible(true);
  };

  // 保存关键帧
  const handleSaveKeyframes = () => {
    if (!editingFrameId) return;

    setComposition(prev => {
      const newFrames = prev.frames.map(f =>
        f.frameId === editingFrameId
          ? { ...f, keyframes: [...keyframes].sort((a, b) => a.time - b.time) }
          : f
      );
      return {
        ...prev,
        frames: newFrames,
        updatedAt: new Date().toISOString(),
      };
    });

    setKeyframeModalVisible(false);
    message.success('关键帧已保存');
  };

  // 添加关键帧
  const handleAddKeyframe = (time: number, property: string, value: number) => {
    setKeyframes(prev => [
      ...prev,
      {
        time,
        property: property as any,
        value,
        easing: 'ease-in-out',
      }
    ]);
  };

  // 删除关键帧
  const handleDeleteKeyframe = (index: number) => {
    setKeyframes(prev => prev.filter((_, i) => i !== index));
  };

  // 保存帧动画配置
  const handleSaveFrame = (values: Partial<FrameAnimation>) => {
    if (!editingFrameId) return;

    setComposition(prev => {
      const newFrames = prev.frames.map(f =>
        f.frameId === editingFrameId
          ? { 
              ...f, 
              ...values,
              // 确保保留关键帧
              keyframes: f.keyframes || []
            }
          : f
      );
      return {
        ...prev,
        frames: newFrames,
        updatedAt: new Date().toISOString(),
      };
    });

    setFrameModalVisible(false);
    setEditingFrameId(null);
    message.success('动画配置已保存');
  };

  // 重置帧
  const handleResetFrame = () => {
    if (!editingFrameId) return;

    setComposition(prev => {
      const newFrames = prev.frames.map(f =>
        f.frameId === editingFrameId
          ? {
              frameId: f.frameId,
              cameraMotion: null,
              zoom: 1,
              pan: { x: 0, y: 0 },
              rotation: 0,
              opacity: 1,
              filters: {
                blur: 0,
                brightness: 100,
                contrast: 100,
                saturation: 100,
              },
              keyframes: [],
            }
          : f
      );
      return {
        ...prev,
        frames: newFrames,
        updatedAt: new Date().toISOString(),
      };
    });

    message.success('已重置为默认');
  };

  // 打开全局设置
  const handleOpenGlobalSettings = () => {
    setGlobalModalVisible(true);
  };

  // 保存全局设置
  const handleSaveGlobalSettings = (values: any) => {
    setComposition(prev => ({
      ...prev,
      masterSettings: {
        ...prev.masterSettings,
        frameDuration: values.frameDuration,
        defaultTransition: values.defaultTransition,
      },
      transitions: values.transitions || [],
      updatedAt: new Date().toISOString(),
    }));
    setGlobalModalVisible(false);
    message.success('全局设置已保存');
  };

  // 预览转场效果
  const handlePreviewTransition = (transition: TransitionConfig) => {
    setSelectedTransition(transition);
    setShowTransitionPreview(true);
  };

  // 导出合成数据
  const handleExportComposition = () => {
    const exportData = {
      version: '1.0',
      projectId: composition.projectId,
      frames: composition.frames.map(f => ({
        frameId: f.frameId,
        duration: composition.masterSettings.frameDuration,
        cameraMotion: f.cameraMotion,
        zoom: f.zoom,
        pan: f.pan,
        rotation: f.rotation,
        opacity: f.opacity,
        filters: f.filters,
        keyframes: f.keyframes,
      })),
      transitions: composition.transitions,
      masterSettings: composition.masterSettings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `composition-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    message.success('合成数据已导出');
  };

  // 播放预览
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setCurrentFrameIndex(0);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  // 播放动画帧
  useEffect(() => {
    if (!isPlaying) return;

    const frameDuration = composition.masterSettings.frameDuration * 1000 / playbackSpeed;
    const startTime = Date.now() - (currentFrameIndex * frameDuration);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const frameIndex = Math.floor(elapsed / frameDuration);

      if (frameIndex >= frames.length) {
        setIsPlaying(false);
        return;
      }

      if (frameIndex !== currentFrameIndex) {
        setCurrentFrameIndex(frameIndex);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentFrameIndex, frames.length, composition.masterSettings.frameDuration, playbackSpeed]);

  // 下一帧
  const handleNext = () => {
    if (currentFrameIndex < frames.length - 1) {
      setCurrentFrameIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  // 上一帧
  const handlePrev = () => {
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex(prev => prev - 1);
    }
  };

  // 计算当前帧的动画值（考虑关键帧）
  const getAnimatedValue = useCallback((frameId: string, property: string, baseValue: number): number => {
    const frame = composition.frames.find(f => f.frameId === frameId);
    if (!frame || !frame.keyframes || frame.keyframes.length === 0) {
      return baseValue;
    }

    // 简化的插值计算
    const relevantKeyframes = frame.keyframes.filter(kf => kf.property === property);
    if (relevantKeyframes.length === 0) return baseValue;

    // 这里应该实现完整的关键帧插值系统
    // 暂时返回第一个关键帧的值作为简化
    return relevantKeyframes[0].value;
  }, [composition.frames]);

  // 表格列
  const columns: ColumnsType<any> = [
    {
      title: '分镜',
      dataIndex: 'frameTitle',
      key: 'frameTitle',
      width: 150,
      render: (title: string, record: FrameAnimation) => (
        <Tooltip title={frames.find(f => f.id === record.frameId)?.sceneDescription}>
          {title}
        </Tooltip>
      ),
    },
    {
      title: '镜头运动',
      dataIndex: ['cameraMotion', 'type'],
      key: 'cameraMotion',
      width: 120,
      render: (type: string | undefined) => (
        <Tag color={type ? 'blue' : 'default'}>
          {type || '静止'}
        </Tag>
      ),
    },
    {
      title: '缩放',
      dataIndex: 'zoom',
      key: 'zoom',
      width: 80,
      render: (zoom: number) => `${(zoom * 100).toFixed(0)}%`,
    },
    {
      title: '旋转',
      dataIndex: 'rotation',
      key: 'rotation',
      width: 80,
      render: (rot: number) => `${rot.toFixed(0)}°`,
    },
    {
      title: '透明度',
      dataIndex: 'opacity',
      key: 'opacity',
      width: 80,
      render: (op: number) => `${(op * 100).toFixed(0)}%`,
    },
    {
      title: '关键帧',
      key: 'keyframes',
      width: 80,
      render: (_: any, record: FrameAnimation) => (
        <Tag color={record.keyframes?.length ? 'green' : 'default'}>
          {record.keyframes?.length || 0}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: FrameAnimation) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => handleEditFrame(record.frameId)}
          >
            编辑
          </Button>
          <Button 
            size="small" 
            icon={<KeyOutlined />}
            onClick={() => handleOpenKeyframes(record.frameId)}
          >
            关键帧
          </Button>
        </Space>
      ),
    },
  ];

  // 当前帧的动画配置
  const currentFrameConfig = useMemo(() => {
    return composition.frames.find(f => f.frameId === frames[currentFrameIndex]?.id);
  }, [composition.frames, currentFrameIndex, frames]);

  // 当前帧对象
  const currentFrame = frames[currentFrameIndex];

  return (
    <div className={styles.container}>
      <Card
        title={
          <Space>
            <VideoCameraOutlined />
            <span>动态合成工作室</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<SettingOutlined />} 
              onClick={handleOpenGlobalSettings}
            >
              全局设置
            </Button>
            <Button 
              icon={<BgColorsOutlined />}
              onClick={() => setPreviewModalVisible(true)}
            >
              效果预览
            </Button>
            <Button 
              icon={<ExportOutlined />} 
              onClick={handleExportComposition}
              disabled={composition.frames.length === 0}
            >
              导出数据
            </Button>
            {!isPlaying ? (
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                onClick={handlePlay}
                disabled={frames.length === 0}
              >
                播放预览
              </Button>
            ) : (
              <Button 
                icon={<PauseCircleOutlined />} 
                onClick={handlePause}
              >
                暂停
              </Button>
            )}
            <Button 
              icon={<FastForwardOutlined />} 
              onClick={handleNext}
              disabled={currentFrameIndex >= frames.length - 1}
            >
              下一帧
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          {/* 左侧预览区 */}
          <Col span={12}>
            <div className={styles.previewArea}>
              {currentFrame?.imageUrl ? (
                <motion.div
                  className={styles.previewFrame}
                  animate={{
                    scale: currentFrameConfig?.zoom || 1,
                    rotate: currentFrameConfig?.rotation || 0,
                    opacity: currentFrameConfig?.opacity || 1,
                    x: (currentFrameConfig?.pan?.x || 0) * 5,
                    y: (currentFrameConfig?.pan?.y || 0) * 5,
                  }}
                  transition={{ 
                    duration: composition.masterSettings.frameDuration,
                    ease: "easeInOut"
                  }}
                  style={{
                    filter: `
                      blur(${(currentFrameConfig?.filters?.blur || 0)}px)
                      brightness(${(currentFrameConfig?.filters?.brightness || 100)}%)
                      contrast(${(currentFrameConfig?.filters?.contrast || 100)}%)
                      saturate(${(currentFrameConfig?.filters?.saturation || 100)}%)
                    `,
                  }}
                >
                  <img src={currentFrame.imageUrl} alt={currentFrame.title} />
                </motion.div>
              ) : (
                <Empty description="请先完成场景渲染" />
              )}
              <div className={styles.frameIndicator}>
                帧 {currentFrameIndex + 1} / {frames.length} · 
                {composition.masterSettings.frameDuration}s
              </div>
            </div>
          </Col>

          {/* 右侧控制面板 */}
          <Col span={12}>
            <div className={styles.controls}>
              <Divider orientation="left">播放控制</Divider>
              <Row gutter={8} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Space>
                    <Button onClick={handlePrev} disabled={currentFrameIndex === 0}>
                      上一帧
                    </Button>
                    <Button onClick={handleNext} disabled={currentFrameIndex >= frames.length - 1}>
                      下一帧
                    </Button>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space>
                    <Text>速度:</Text>
                    <Select 
                      value={playbackSpeed} 
                      onChange={setPlaybackSpeed} 
                      style={{ width: 80 }}
                    >
                      <Option value={0.5}>0.5x</Option>
                      <Option value={1}>1x</Option>
                      <Option value={1.5}>1.5x</Option>
                      <Option value={2}>2x</Option>
                    </Select>
                  </Space>
                </Col>
              </Row>

              <Divider orientation="left">全局设置</Divider>
              <Row gutter={8} align="middle">
                <Col span={12}>
                  <Text>每帧默认时长: {composition.masterSettings.frameDuration}s</Text>
                </Col>
                <Col span={12}>
                  <Button type="link" onClick={handleOpenGlobalSettings}>
                    修改
                  </Button>
                </Col>
              </Row>

              <Divider orientation="left">默认转场</Divider>
              <Row gutter={8} align="middle">
                <Col span={14}>
                  <Text>
                    {composition.masterSettings.defaultTransition.effect}
                    ({composition.masterSettings.defaultTransition.duration}s)
                  </Text>
                </Col>
                <Col span={10}>
                  <Button 
                    size="small"
                    onClick={() => handlePreviewTransition(composition.masterSettings.defaultTransition)}
                  >
                    预览
                  </Button>
                </Col>
              </Row>

              <Divider orientation="left">动画列表</Divider>
              <div className={styles.tableContainer}>
                <Table
                  rowKey="frameId"
                  columns={columns}
                  dataSource={composition.frames}
                  pagination={false}
                  size="small"
                  scroll={{ y: 300 }}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 帧编辑模态框 */}
      <Modal
        title={`编辑动画 - ${frames.find(f => f.id === editingFrameId)?.title || ''}`}
        open={frameModalVisible}
        onOk={() => {
          Form.useForm()[0].submit();
        }}
        onCancel={() => {
          setFrameModalVisible(false);
          setEditingFrameId(null);
        }}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        {editingFrameId && (
          <FrameEditForm
            frameId={editingFrameId}
            initialValues={composition.frames.find(f => f.frameId === editingFrameId)}
            onSave={handleSaveFrame}
            onReset={handleResetFrame}
          />
        )}
      </Modal>

      {/* 关键帧编辑器模态框 */}
      <Modal
        title={`关键帧编辑 - ${frames.find(f => f.id === editingFrameId)?.title || ''}`}
        open={keyframeModalVisible}
        onOk={handleSaveKeyframes}
        onCancel={() => {
          setKeyframeModalVisible(false);
          setEditingFrameId(null);
        }}
        width={800}
        okText="保存关键帧"
        cancelText="取消"
      >
        <div className={styles.keyframeEditor}>
          <Divider orientation="left">关键帧列表</Divider>
          <div className={styles.keyframeList}>
            {keyframes.length === 0 ? (
              <Empty description="暂无关键帧" />
            ) : (
              <Timeline>
                {keyframes.map((kf, idx) => (
                  <Timeline.Item 
                    key={idx}
                    dot={<Tag color="blue">{kf.time}s</Tag>}
                    color="blue"
                  >
                    <Space>
                      <Text strong>{kf.property}</Text>
                      <Text>= {kf.value}</Text>
                      <Text type="secondary">({kf.easing})</Text>
                      <Button 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteKeyframe(idx)}
                      />
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </div>
          
          <Divider orientation="left">添加关键帧</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="时间点 (秒)">
                <InputNumber 
                  min={0} 
                  max={composition.masterSettings.frameDuration} 
                  style={{ width: '100%' }}
                  placeholder="0-3"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="属性">
                <Select placeholder="选择属性">
                  <Option value="zoom">缩放</Option>
                  <Option value="rotation">旋转</Option>
                  <Option value="opacity">透明度</Option>
                  <Option value="pan-x">水平平移</Option>
                  <Option value="pan-y">垂直平移</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="值">
                <InputNumber style={{ width: '100%' }} placeholder="数值" />
              </Form.Item>
            </Col>
          </Row>
          <Button type="dashed" block icon={<PlusOutlined />}>
            添加关键帧
          </Button>
        </div>
      </Modal>

      {/* 全局设置模态框 */}
      <Modal
        title="全局合成设置"
        open={globalModalVisible}
        onOk={() => {
          Form.useForm()[0].submit();
        }}
        onCancel={() => setGlobalModalVisible(false)}
        width={600}
      >
        <GlobalSettingsForm
          initialValues={{
            frameDuration: composition.masterSettings.frameDuration,
            defaultTransition: composition.masterSettings.defaultTransition,
            transitions: composition.transitions,
          }}
          onSave={handleSaveGlobalSettings}
        />
      </Modal>

      {/* 效果预览模态框 */}
      <Modal
        title="转场效果预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className={styles.transitionPreview}>
          <div className="preview-slide">
            <Space direction="vertical">
              <span>帧 A</span>
              <Text type="secondary">转场效果演示</Text>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// 帧编辑表单组件
interface FrameEditFormProps {
  frameId: string;
  initialValues?: FrameAnimation;
  onSave: (values: Partial<FrameAnimation>) => void;
  onReset: () => void;
}

const FrameEditForm: React.FC<FrameEditFormProps> = ({ frameId, initialValues, onSave, onReset }) => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    onSave({
      cameraMotion: values.cameraMotion
        ? {
            type: values.cameraMotion,
            duration: values.cameraDuration || 1,
            intensity: values.cameraIntensity || 0.5,
          }
        : null,
      zoom: values.zoom,
      pan: { x: values.panX || 0, y: values.panY || 0 },
      rotation: values.rotation || 0,
      opacity: values.opacity || 1,
      filters: {
        blur: values.blur || 0,
        brightness: values.brightness || 100,
        contrast: values.contrast || 100,
        saturation: values.saturation || 100,
      },
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        cameraMotion: initialValues?.cameraMotion?.type || null,
        cameraDuration: initialValues?.cameraMotion?.duration || 1,
        cameraIntensity: initialValues?.cameraMotion?.intensity || 0.5,
        zoom: initialValues?.zoom || 1,
        panX: initialValues?.pan?.x || 0,
        panY: initialValues?.pan?.y || 0,
        rotation: initialValues?.rotation || 0,
        opacity: initialValues?.opacity || 1,
        blur: initialValues?.filters?.blur || 0,
        brightness: initialValues?.filters?.brightness || 100,
        contrast: initialValues?.filters?.contrast || 100,
        saturation: initialValues?.filters?.saturation || 100,
      }}
      onFinish={handleFinish}
    >
      <Divider orientation="left">镜头运动</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="cameraMotion" label="运动类型">
            <Select placeholder="选择镜头运动">
              {CAMERA_MOTION_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="cameraDuration" label="持续时间 (秒)">
            <InputNumber min={0.1} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="cameraIntensity" label="强度">
            <Slider min={0} max={1} step={0.1} />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">变换</Divider>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="zoom" label="缩放">
            <InputNumber min={0.1} max={5} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="panX" label="平移 X">
            <Slider min={-100} max={100} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="panY" label="平移 Y">
            <Slider min={-100} max={100} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="rotation" label="旋转 (°)">
            <Slider min={-180} max={180} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="opacity" label="透明度">
            <Slider min={0} max={1} step={0.01} />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">滤镜效果</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="blur" label="模糊 (px)">
            <Slider min={0} max={20} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="brightness" label="亮度 (%)">
            <Slider min={0} max={200} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="contrast" label="对比度 (%)">
            <Slider min={0} max={200} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="saturation" label="饱和度 (%)">
            <Slider min={0} max={200} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

// 全局设置表单
interface GlobalSettingsFormProps {
  initialValues: {
    frameDuration: number;
    defaultTransition: TransitionConfig;
    transitions?: TransitionConfig[];
  };
  onSave: (values: any) => void;
}

const GlobalSettingsForm: React.FC<GlobalSettingsFormProps> = ({ initialValues, onSave }) => {
  const [form] = Form.useForm();

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onSave}
    >
      <Form.Item name="frameDuration" label="默认帧时长 (秒)">
        <Slider min={1} max={10} step={0.5} />
      </Form.Item>

      <Divider orientation="left">默认转场</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['defaultTransition', 'effect']} label="转场效果">
            <Select>
              {TRANSITION_OPTIONS.map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['defaultTransition', 'duration']} label="转场时长 (秒)">
            <InputNumber min={0.1} max={5} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['defaultTransition', 'easing']} label="缓动函数">
            <Select>
              <Option value="linear">线性</Option>
              <Option value="ease-in">渐快</Option>
              <Option value="ease-out">渐慢</Option>
              <Option value="ease-in-out">先慢后快再慢</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left">逐段转场配置（可选）</Divider>
      <Form.Item name="transitions" label="分镜间转场">
        <Select 
          mode="tags" 
          placeholder="格式：start-end:effect:duration，如：0-1:fade:0.5"
          style={{ width: '100%' }}
        />
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          可指定特定分镜间的转场效果，留空则使用默认转场
        </Text>
      </Form.Item>
    </Form>
  );
};

export default CompositionStudio;
export type { CompositionStudioProps };
