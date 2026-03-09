import React, { useState } from 'react';
import {
  Card,
  List,
  Button,
  Input,
  Select,
  Typography,
  Space,
  Tag,
  Empty,
  Popconfirm,
  Divider,
  Slider,
  Tooltip,
  Collapse,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  BulbOutlined,
  CloudOutlined,
  SunOutlined,
  MoonOutlined,
  ThunderboltOutlined,
  FireOutlined,
  HeartOutlined,
  FrownOutlined,
  StarOutlined,
  RocketOutlined,
  HomeOutlined,
  BankOutlined,
  CarOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';
import styles from './SceneRenderer.module.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 场景类型选项
const SCENE_TYPE_OPTIONS = [
  { value: 'indoor', label: '室内', icon: <HomeOutlined /> },
  { value: 'outdoor', label: '室外', icon: <BankOutlined /> },
  { value: 'fantasy', label: '幻想', icon: <StarOutlined /> },
  { value: 'future', label: '未来', icon: <RocketOutlined /> },
  { value: 'urban', label: '城市', icon: <CarOutlined /> },
  { value: 'nature', label: '自然', icon: <CloudOutlined /> },
  { value: 'interior', label: '内景', icon: <CoffeeOutlined /> },
];

// 氛围选项
const ATMOSPHERE_OPTIONS = [
  { value: 'warm', label: '温馨', color: '#fa8c16', icon: <HeartOutlined /> },
  { value: 'horror', label: '恐怖', color: '#000000', icon: <FrownOutlined /> },
  { value: 'romantic', label: '浪漫', color: '#eb2f96', icon: <HeartOutlined /> },
  { value: 'battle', label: '战斗', color: '#f5222d', icon: <ThunderboltOutlined /> },
  { value: 'mysterious', label: '神秘', color: '#722ed1', icon: <StarOutlined /> },
  { value: 'peaceful', label: '平静', color: '#52c41a', icon: <CloudOutlined /> },
  { value: 'sad', label: '悲伤', color: '#595959', icon: <FrownOutlined /> },
  { value: 'joyful', label: '欢乐', color: '#faad14', icon: <StarOutlined /> },
];

// 光照选项
const LIGHTING_OPTIONS = [
  { value: 'natural', label: '自然光', icon: <SunOutlined /> },
  { value: 'artificial', label: '灯光', icon: <BulbOutlined /> },
  { value: 'moonlight', label: '月光', icon: <MoonOutlined /> },
  { value: 'firelight', label: '火光', icon: <FireOutlined /> },
  { value: 'neon', label: '霓虹', icon: <ThunderboltOutlined /> },
  { value: 'candlelight', label: '烛光', icon: <FireOutlined /> },
  { value: 'flash', label: '闪光', icon: <ThunderboltOutlined /> },
  { value: 'shadow', label: '阴影', icon: <CloudOutlined /> },
];

// 天气选项
const WEATHER_OPTIONS = [
  { value: 'sunny', label: '晴天' },
  { value: 'cloudy', label: '多云' },
  { value: 'rainy', label: '雨天' },
  { value: 'snowy', label: '雪天' },
  { value: 'foggy', label: '雾天' },
  { value: 'stormy', label: '暴风雨' },
  { value: 'night', label: '夜晚' },
  { value: 'dawn', label: '黎明' },
  { value: 'dusk', label: '黄昏' },
];

// 道具类型
const PROP_CATEGORIES = [
  { value: 'furniture', label: '家具' },
  { value: 'electronics', label: '电子产品' },
  { value: 'decoration', label: '装饰品' },
  { value: 'clothing', label: '服装' },
  { value: 'vehicle', label: '交通工具' },
  { value: 'weapon', label: '武器' },
  { value: 'tool', label: '工具' },
  { value: 'food', label: '食物' },
  { value: 'plant', label: '植物' },
  { value: 'animal', label: '动物' },
  { value: 'other', label: '其他' },
];

export interface SceneProp {
  id: string;
  name: string;
  category: string;
  position: { x: number; y: number; z: number };
  scale: number;
  rotation: number;
  color?: string;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  type: string;
  atmosphere: string;
  lighting: string;
  weather: string;
  backgroundDescription: string;
  props: SceneProp[];
  timeOfDay: string;
  brightness: number;
  saturation: number;
  contrast: number;
  imageUrl?: string;
}

interface SceneRendererProps {
  initialScenes?: Scene[];
  onChange?: (scenes: Scene[]) => void;
  onSceneSelect?: (scene: Scene | null) => void;
}

const SceneRenderer: React.FC<SceneRendererProps> = ({
  initialScenes = [],
  onChange,
  onSceneSelect,
}) => {
  const [scenes, setScenes] = useState<Scene[]>(initialScenes);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(
    initialScenes.length > 0 ? initialScenes[0] : null
  );
  const [editingKey, setEditingKey] = useState<string>('');

  // 生成唯一ID
  const generateId = () => `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 添加场景
  const addScene = () => {
    const newScene: Scene = {
      id: generateId(),
      name: `场景 ${scenes.length + 1}`,
      description: '',
      type: 'indoor',
      atmosphere: 'peaceful',
      lighting: 'natural',
      weather: 'sunny',
      backgroundDescription: '',
      props: [],
      timeOfDay: 'day',
      brightness: 50,
      saturation: 50,
      contrast: 50,
    };

    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    setSelectedScene(newScene);
    onChange?.(updatedScenes);
    onSceneSelect?.(newScene);
  };

  // 删除场景
  const removeScene = (id: string) => {
    const updatedScenes = scenes.filter((s) => s.id !== id);
    setScenes(updatedScenes);

    if (selectedScene?.id === id) {
      setSelectedScene(updatedScenes.length > 0 ? updatedScenes[0] : null);
      onSceneSelect?.(updatedScenes.length > 0 ? updatedScenes[0] : null);
    }
    onChange?.(updatedScenes);
  };

  // 更新场景
  const updateScene = (id: string, field: keyof Scene, value: Scene[keyof Scene]) => {
    const updatedScenes = scenes.map((s) =>
      s.id === id ? { ...s, [field]: value } : s
    );
    setScenes(updatedScenes);

    if (selectedScene?.id === id) {
      const updated = updatedScenes.find((s) => s.id === id);
      setSelectedScene(updated || null);
      onSceneSelect?.(updated || null);
    }
    onChange?.(updatedScenes);
  };

  // 复制场景
  const duplicateScene = (scene: Scene) => {
    const newScene: Scene = {
      ...scene,
      id: generateId(),
      name: `${scene.name} (副本)`,
    };

    const updatedScenes = [...scenes, newScene];
    setScenes(updatedScenes);
    setSelectedScene(newScene);
    onChange?.(updatedScenes);
    onSceneSelect?.(newScene);
  };

  // 选择场景
  const handleSceneSelect = (scene: Scene) => {
    setSelectedScene(scene);
    onSceneSelect?.(scene);
  };

  // 添加道具
  const addProp = (sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const newProp: SceneProp = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `道具 ${scene.props.length + 1}`,
      category: 'furniture',
      position: { x: 50, y: 50, z: 0 },
      scale: 1,
      rotation: 0,
    };

    updateScene(sceneId, 'props', [...scene.props, newProp]);
  };

  // 删除道具
  const removeProp = (sceneId: string, propId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    updateScene(sceneId, 'props', scene.props.filter((p) => p.id !== propId));
  };

  // 更新道具
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateProp = (sceneId: string, propId: string, field: keyof SceneProp, value: any) => {
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) return;

    const updatedProps = scene.props.map((p) =>
      p.id === propId ? { ...p, [field]: value } : p
    );
    updateScene(sceneId, 'props', updatedProps);
  };

  // 获取场景类型图标
  const getSceneTypeIcon = (type: string) => {
    const option = SCENE_TYPE_OPTIONS.find((opt) => opt.value === type);
    return option?.icon || <EnvironmentOutlined />;
  };

  // 获取氛围颜色
  const getAtmosphereColor = (atmosphere: string) => {
    const option = ATMOSPHERE_OPTIONS.find((opt) => opt.value === atmosphere);
    return option?.color || '#1890ff';
  };

  // 获取光照图标
  const getLightingIcon = (lighting: string) => {
    const option = LIGHTING_OPTIONS.find((opt) => opt.value === lighting);
    return option?.icon || <BulbOutlined />;
  };

  return (
    <div className={styles.container}>
      {/* 左侧场景列表 */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Title level={5} className={styles.sidebarTitle}>
            场景列表
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={addScene}
          >
            新建场景
          </Button>
        </div>

        <div className={styles.sceneList}>
          {scenes.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无场景"
              className={styles.emptyState}
            />
          ) : (
            <List
              dataSource={scenes}
              renderItem={(scene) => (
                <List.Item
                  className={`${styles.sceneItem} ${
                    selectedScene?.id === scene.id ? styles.selected : ''
                  }`}
                  onClick={() => handleSceneSelect(scene)}
                >
                  <div className={styles.sceneItemContent}>
                    <div className={styles.sceneIcon}>
                      {getSceneTypeIcon(scene.type)}
                    </div>
                    <div className={styles.sceneInfo}>
                      <Text className={styles.sceneName} ellipsis>
                        {scene.name}
                      </Text>
                      <Tag
                        color={getAtmosphereColor(scene.atmosphere)}
                        className={styles.atmosphereTag}
                      >
                        {ATMOSPHERE_OPTIONS.find((a) => a.value === scene.atmosphere)?.label || scene.atmosphere}
                      </Tag>
                    </div>
                    <div className={styles.sceneActions}>
                      <Tooltip title="编辑">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSceneSelect(scene);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="复制">
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateScene(scene);
                          }}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="确定删除此场景?"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          removeScene(scene.id);
                        }}
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
                </List.Item>
              )}
            />
          )}
        </div>

        <div className={styles.sidebarFooter}>
          <Text type="secondary">共 {scenes.length} 个场景</Text>
        </div>
      </div>

      {/* 中间场景预览 */}
      <div className={styles.preview}>
        {selectedScene ? (
          <>
            <div className={styles.previewHeader}>
              <Title level={4} className={styles.previewName}>
                {selectedScene.name}
              </Title>
              <Space>
                <Tag icon={getSceneTypeIcon(selectedScene.type)}>
                  {SCENE_TYPE_OPTIONS.find((t) => t.value === selectedScene.type)?.label || selectedScene.type}
                </Tag>
                <Tag color={getAtmosphereColor(selectedScene.atmosphere)}>
                  {ATMOSPHERE_OPTIONS.find((a) => a.value === selectedScene.atmosphere)?.label || selectedScene.atmosphere}
                </Tag>
              </Space>
            </div>

            <div className={styles.previewImage}>
              {selectedScene.imageUrl ? (
                <img src={selectedScene.imageUrl} alt={selectedScene.name} />
              ) : (
                <div className={styles.previewPlaceholder}>
                  <EnvironmentOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                  <Text type="secondary">场景预览区域</Text>
                  <Paragraph type="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
                    {selectedScene.backgroundDescription || '请输入背景描述'}
                  </Paragraph>
                </div>
              )}
            </div>

            <div className={styles.previewInfo}>
              <Row gutter={16}>
                <Col span={8}>
                  <div className={styles.infoItem}>
                    <BulbOutlined />
                    <Text>{LIGHTING_OPTIONS.find((l) => l.value === selectedScene.lighting)?.label || selectedScene.lighting}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div className={styles.infoItem}>
                    <CloudOutlined />
                    <Text>{WEATHER_OPTIONS.find((w) => w.value === selectedScene.weather)?.label || selectedScene.weather}</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div className={styles.infoItem}>
                    <SunOutlined />
                    <Text>{selectedScene.timeOfDay === 'day' ? '白天' : selectedScene.timeOfDay === 'night' ? '夜晚' : selectedScene.timeOfDay}</Text>
                  </div>
                </Col>
              </Row>

              <Divider />

              <div className={styles.adjustmentPanel}>
                <Text strong>画面调整</Text>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={8}>
                    <Text type="secondary">亮度</Text>
                    <Slider
                      value={selectedScene.brightness}
                      onChange={(value) => updateScene(selectedScene.id, 'brightness', value)}
                      min={0}
                      max={100}
                    />
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">饱和度</Text>
                    <Slider
                      value={selectedScene.saturation}
                      onChange={(value) => updateScene(selectedScene.id, 'saturation', value)}
                      min={0}
                      max={100}
                    />
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">对比度</Text>
                    <Slider
                      value={selectedScene.contrast}
                      onChange={(value) => updateScene(selectedScene.id, 'contrast', value)}
                      min={0}
                      max={100}
                    />
                  </Col>
                </Row>
              </div>

              {selectedScene.props.length > 0 && (
                <>
                  <Divider />
                  <div className={styles.propsPreview}>
                    <Text strong>道具列表 ({selectedScene.props.length})</Text>
                    <div className={styles.propsList}>
                      {selectedScene.props.map((prop) => (
                        <Tag key={prop.id} className={styles.propTag}>
                          {prop.name}
                          <Popconfirm
                            title="确定删除此道具?"
                            onConfirm={() => removeProp(selectedScene.id, prop.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <DeleteOutlined
                              style={{ marginLeft: 4, cursor: 'pointer' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Popconfirm>
                        </Tag>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyPreview}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="请选择或创建一个场景"
            />
          </div>
        )}
      </div>

      {/* 右侧场景属性编辑 */}
      <div className={styles.editor}>
        {selectedScene ? (
          <>
            <div className={styles.editorHeader}>
              <Title level={5}>场景属性</Title>
            </div>

            <div className={styles.editorContent}>
              <div className={styles.formSection}>
                <span className={styles.sectionTitle}>基本信息</span>

                <div className={styles.formGroup}>
                  <Text type="secondary">场景名称</Text>
                  <Input
                    value={selectedScene.name}
                    onChange={(e) => updateScene(selectedScene.id, 'name', e.target.value)}
                    placeholder="请输入场景名称"
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">场景描述</Text>
                  <TextArea
                    value={selectedScene.description}
                    onChange={(e) => updateScene(selectedScene.id, 'description', e.target.value)}
                    placeholder="请输入场景描述"
                    rows={3}
                  />
                </div>
              </div>

              <Divider />

              <div className={styles.formSection}>
                <span className={styles.sectionTitle}>场景类型</span>

                <div className={styles.formGroup}>
                  <Text type="secondary">类型</Text>
                  <Select
                    value={selectedScene.type}
                    onChange={(value) => updateScene(selectedScene.id, 'type', value)}
                    style={{ width: '100%' }}
                    options={SCENE_TYPE_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: (
                        <Space>
                          {opt.icon}
                          {opt.label}
                        </Space>
                      ),
                    }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">氛围</Text>
                  <Select
                    value={selectedScene.atmosphere}
                    onChange={(value) => updateScene(selectedScene.id, 'atmosphere', value)}
                    style={{ width: '100%' }}
                    options={ATMOSPHERE_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: (
                        <Space>
                          <Tag color={opt.color}>{opt.icon}</Tag>
                          {opt.label}
                        </Space>
                      ),
                    }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">光照</Text>
                  <Select
                    value={selectedScene.lighting}
                    onChange={(value) => updateScene(selectedScene.id, 'lighting', value)}
                    style={{ width: '100%' }}
                    options={LIGHTING_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: (
                        <Space>
                          {opt.icon}
                          {opt.label}
                        </Space>
                      ),
                    }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">天气</Text>
                  <Select
                    value={selectedScene.weather}
                    onChange={(value) => updateScene(selectedScene.id, 'weather', value)}
                    style={{ width: '100%' }}
                    options={WEATHER_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">时段</Text>
                  <Select
                    value={selectedScene.timeOfDay}
                    onChange={(value) => updateScene(selectedScene.id, 'timeOfDay', value)}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'dawn', label: '黎明' },
                      { value: 'day', label: '白天' },
                      { value: 'dusk', label: '黄昏' },
                      { value: 'night', label: '夜晚' },
                    ]}
                  />
                </div>
              </div>

              <Divider />

              <div className={styles.formSection}>
                <span className={styles.sectionTitle}>背景描述</span>

                <div className={styles.formGroup}>
                  <Text type="secondary">背景描述（用于AI生成）</Text>
                  <TextArea
                    value={selectedScene.backgroundDescription}
                    onChange={(e) => updateScene(selectedScene.id, 'backgroundDescription', e.target.value)}
                    placeholder="详细描述场景的背景环境..."
                    rows={4}
                  />
                </div>
              </div>

              <Divider />

              <div className={styles.formSection}>
                <span className={styles.sectionTitle}>道具管理</span>

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => addProp(selectedScene.id)}
                  block
                  style={{ marginBottom: 12 }}
                >
                  添加道具
                </Button>

                <Collapse
                  ghost
                  items={selectedScene.props.map((prop, index) => ({
                    key: prop.id,
                    label: (
                      <div className={styles.propCollapseHeader}>
                        <Text>{prop.name}</Text>
                        <Popconfirm
                          title="确定删除此道具?"
                          onConfirm={() => removeProp(selectedScene.id, prop.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <DeleteOutlined
                            style={{ color: '#ff4d4f', cursor: 'pointer' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Popconfirm>
                      </div>
                    ),
                    children: (
                      <div className={styles.propEditor}>
                        <div className={styles.formGroup}>
                          <Text type="secondary">道具名称</Text>
                          <Input
                            value={prop.name}
                            onChange={(e) => updateProp(selectedScene.id, prop.id, 'name', e.target.value)}
                            placeholder="道具名称"
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <Text type="secondary">道具类型</Text>
                          <Select
                            value={prop.category}
                            onChange={(value) => updateProp(selectedScene.id, prop.id, 'category', value)}
                            style={{ width: '100%' }}
                            options={PROP_CATEGORIES.map((c) => ({
                              value: c.value,
                              label: c.label,
                            }))}
                          />
                        </div>

                        <Row gutter={8}>
                          <Col span={8}>
                            <div className={styles.formGroup}>
                              <Text type="secondary">X</Text>
                              <Slider
                                value={prop.position.x}
                                onChange={(value) =>
                                  updateProp(selectedScene.id, prop.id, 'position', {
                                    ...prop.position,
                                    x: value,
                                  })
                                }
                                min={0}
                                max={100}
                              />
                            </div>
                          </Col>
                          <Col span={8}>
                            <div className={styles.formGroup}>
                              <Text type="secondary">Y</Text>
                              <Slider
                                value={prop.position.y}
                                onChange={(value) =>
                                  updateProp(selectedScene.id, prop.id, 'position', {
                                    ...prop.position,
                                    y: value,
                                  })
                                }
                                min={0}
                                max={100}
                              />
                            </div>
                          </Col>
                          <Col span={8}>
                            <div className={styles.formGroup}>
                              <Text type="secondary">Z</Text>
                              <Slider
                                value={prop.position.z}
                                onChange={(value) =>
                                  updateProp(selectedScene.id, prop.id, 'position', {
                                    ...prop.position,
                                    z: value,
                                  })
                                }
                                min={-10}
                                max={10}
                              />
                            </div>
                          </Col>
                        </Row>

                        <Row gutter={8}>
                          <Col span={12}>
                            <div className={styles.formGroup}>
                              <Text type="secondary">缩放</Text>
                              <Slider
                                value={prop.scale}
                                onChange={(value) => updateProp(selectedScene.id, prop.id, 'scale', value)}
                                min={0.1}
                                max={3}
                                step={0.1}
                              />
                            </div>
                          </Col>
                          <Col span={12}>
                            <div className={styles.formGroup}>
                              <Text type="secondary">旋转</Text>
                              <Slider
                                value={prop.rotation}
                                onChange={(value) => updateProp(selectedScene.id, prop.id, 'rotation', value)}
                                min={-180}
                                max={180}
                              />
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ),
                  }))}
                />
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyEditor}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="请选择场景进行编辑"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneRenderer;
