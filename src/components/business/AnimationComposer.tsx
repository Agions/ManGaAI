import React, { useState } from 'react';
import { Card, Tabs, Select, Slider, Button, Space, List, Tag, Empty, Tooltip, Popconfirm, message } from 'antd';
import {
  CaretRightOutlined,
  DeleteOutlined,
  CopyOutlined,
  SwapOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import styles from './AnimationComposer.module.less';

// 动画类型定义
export type AnimationCategory = 'entry' | 'exit' | 'emphasis' | 'transition';

// 入场动画类型
export type EntryAnimation =
  | 'fadeIn'        // 淡入
  | 'slideInLeft'   // 从左侧滑入
  | 'slideInRight'  // 从右侧滑入
  | 'slideInTop'   // 从顶部滑入
  | 'slideInBottom' // 从底部滑入
  | 'zoomIn'        // 缩放淡入
  | 'rotateIn'      // 旋转淡入
  | 'bounceIn';     // 弹跳淡入

// 出场动画类型
export type ExitAnimation =
  | 'fadeOut'       // 淡出
  | 'slideOutLeft'  // 向左侧滑出
  | 'slideOutRight' // 向右侧滑出
  | 'slideOutTop'  // 向顶部滑出
  | 'slideOutBottom' // 向底部滑出
  | 'zoomOut'       // 缩小消失
  | 'rotateOut';    // 旋转消失

// 强调动画类型
export type EmphasisAnimation =
  | 'flash'         // 闪烁
  | 'shake'         // 抖动
  | 'pulse'         // 缩放脉冲
  | 'colorChange'   // 颜色变化
  | 'wobble'        // 摇摆
  | 'pulseScale';   // 脉冲缩放

// 过渡动画类型
export type TransitionAnimation =
  | 'crossDissolve' // 交叉溶解
  | 'slideLeft'     // 向左滑动
  | 'slideRight'    // 向右滑动
  | 'pushLeft'      // 推拉向左
  | 'pushRight'     // 推拉向右
  | 'rotatePush'    // 旋转推送
  | 'fadeScale';    // 淡入缩放

export type AnimationType = EntryAnimation | ExitAnimation | EmphasisAnimation | TransitionAnimation;

// 动画配置
export interface AnimationConfig {
  id: string;
  sceneId: string;
  category: AnimationCategory;
  type: AnimationType;
  duration: number;      // 动画持续时间(毫秒)
  delay: number;         // 延迟时间(毫秒)
  easing: string;        // 缓动函数
  iterations: number;    // 重复次数
  direction?: string;    // 方向
  fill?: string;         // 填充模式
  enabled: boolean;      // 是否启用
}

// 场景动画数据
export interface SceneAnimation {
  sceneId: string;
  sceneName: string;
  thumbnail?: string;
  animations: AnimationConfig[];
}

// 动画类型元数据
interface AnimationMeta {
  type: AnimationType;
  label: string;
  icon: string;
  description: string;
}

// 动画分类元数据
interface CategoryMeta {
  key: AnimationCategory;
  label: string;
  color: string;
}

// 动画元数据映射
const ANIMATION_META: Record<AnimationCategory, AnimationMeta[]> = {
  entry: [
    { type: 'fadeIn', label: '淡入', icon: '🔆', description: '元素逐渐显现' },
    { type: 'slideInLeft', label: '左侧滑入', icon: '⬅️', description: '从左侧滑入画面' },
    { type: 'slideInRight', label: '右侧滑入', icon: '➡️', description: '从右侧滑入画面' },
    { type: 'slideInTop', label: '顶部滑入', icon: '⬆️', description: '从顶部滑入画面' },
    { type: 'slideInBottom', label: '底部滑入', icon: '⬇️', description: '从底部滑入画面' },
    { type: 'zoomIn', label: '缩放淡入', icon: '🔍', description: '从小到大缩放显现' },
    { type: 'rotateIn', label: '旋转淡入', icon: '🌀', description: '旋转着显现' },
    { type: 'bounceIn', label: '弹跳淡入', icon: '🏀', description: '弹跳着进入画面' },
  ],
  exit: [
    { type: 'fadeOut', label: '淡出', icon: '🌑', description: '元素逐渐消失' },
    { type: 'slideOutLeft', label: '左侧滑出', icon: '⬅️', description: '向左侧滑出画面' },
    { type: 'slideOutRight', label: '右侧滑出', icon: '➡️', description: '向右侧滑出画面' },
    { type: 'slideOutTop', label: '顶部滑出', icon: '⬆️', description: '向顶部滑出画面' },
    { type: 'slideOutBottom', label: '底部滑出', icon: '⬇️', description: '向底部滑出画面' },
    { type: 'zoomOut', label: '缩小消失', icon: '🔎', description: '缩小至消失' },
    { type: 'rotateOut', label: '旋转消失', icon: '🌀', description: '旋转着消失' },
  ],
  emphasis: [
    { type: 'flash', label: '闪烁', icon: '⚡', description: '快速闪烁提醒注意' },
    { type: 'shake', label: '抖动', icon: '📳', description: '左右抖动引起注意' },
    { type: 'pulse', label: '缩放脉冲', icon: '💓', description: '周期性缩放脉冲' },
    { type: 'colorChange', label: '颜色变化', icon: '🎨', description: '颜色动态变化' },
    { type: 'wobble', label: '摇摆', icon: '🌊', description: '左右摇摆效果' },
    { type: 'pulseScale', label: '脉冲缩放', icon: '💪', description: '强调性缩放' },
  ],
  transition: [
    { type: 'crossDissolve', label: '交叉溶解', icon: '✨', description: '平滑溶解过渡' },
    { type: 'slideLeft', label: '向左滑动', icon: '⬅️', description: '向左滑动过渡' },
    { type: 'slideRight', label: '向右滑动', icon: '➡️', description: '向右滑动过渡' },
    { type: 'pushLeft', label: '推拉向左', icon: '👈', description: '推拉效果向左' },
    { type: 'pushRight', label: '推拉向右', icon: '👉', description: '推拉效果向右' },
    { type: 'rotatePush', label: '旋转推送', icon: '🌀', description: '旋转推送过渡' },
    { type: 'fadeScale', label: '淡入缩放', icon: '🌟', description: '淡入结合缩放' },
  ],
};

// 分类元数据
const CATEGORY_META: CategoryMeta[] = [
  { key: 'entry', label: '入场动画', color: '#52c41a' },
  { key: 'exit', label: '出场动画', color: '#ff4d4f' },
  { key: 'emphasis', label: '强调动画', color: '#faad14' },
  { key: 'transition', label: '过渡效果', color: '#1890ff' },
];

// 缓动函数选项
const EASING_OPTIONS = [
  { value: 'linear', label: '线性' },
  { value: 'ease', label: '缓动' },
  { value: 'ease-in', label: '缓入' },
  { value: 'ease-out', label: '缓出' },
  { value: 'ease-in-out', label: '缓入缓出' },
  { value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', label: '弹性' },
  { value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', label: '回弹' },
];

interface AnimationComposerProps {
  scenes: Array<{
    id: string;
    name: string;
    thumbnail?: string;
  }>;
  animations: SceneAnimation[];
  onAnimationsChange: (animations: SceneAnimation[]) => void;
  onPreview?: (sceneId: string, animation: AnimationConfig) => void;
}

const AnimationComposer: React.FC<AnimationComposerProps> = ({
  scenes,
  animations,
  onAnimationsChange,
  onPreview,
}) => {
  const [activeCategory, setActiveCategory] = useState<AnimationCategory>('entry');
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationConfig | null>(null);

  // 获取场景的动画数据
  const getSceneAnimation = (sceneId: string): SceneAnimation | undefined => {
    return animations.find((a) => a.sceneId === sceneId);
  };

  // 获取场景的动画列表
  const getSceneAnimations = (sceneId: string, category?: AnimationCategory): AnimationConfig[] => {
    const sceneAnim = getSceneAnimation(sceneId);
    if (!sceneAnim) return [];
    if (category) {
      return sceneAnim.animations.filter((a) => a.category === category);
    }
    return sceneAnim.animations;
  };

  // 添加动画
  const addAnimation = (sceneId: string, type: AnimationType, category: AnimationCategory) => {
    const newAnimation: AnimationConfig = {
      id: `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sceneId,
      category,
      type,
      duration: 1000,
      delay: 0,
      easing: 'ease-out',
      iterations: 1,
      enabled: true,
    };

    const sceneAnimIndex = animations.findIndex((a) => a.sceneId === sceneId);
    const scene = scenes.find((s) => s.id === sceneId);

    if (sceneAnimIndex >= 0) {
      // 场景已有动画，追加
      const newAnimations = [...animations];
      newAnimations[sceneAnimIndex] = {
        ...newAnimations[sceneAnimIndex],
        animations: [...newAnimations[sceneAnimIndex].animations, newAnimation],
      };
      onAnimationsChange(newAnimations);
    } else {
      // 新场景动画
      const newSceneAnim: SceneAnimation = {
        sceneId,
        sceneName: scene?.name || `场景 ${sceneId}`,
        thumbnail: scene?.thumbnail,
        animations: [newAnimation],
      };
      onAnimationsChange([...animations, newSceneAnim]);
    }

    setSelectedAnimation(newAnimation);
    message.success('动画已添加');
  };

  // 删除动画
  const removeAnimation = (sceneId: string, animationId: string) => {
    const newAnimations = animations.map((sceneAnim) => {
      if (sceneAnim.sceneId === sceneId) {
        return {
          ...sceneAnim,
          animations: sceneAnim.animations.filter((a) => a.id !== animationId),
        };
      }
      return sceneAnim;
    }).filter((sa) => sa.animations.length > 0);

    onAnimationsChange(newAnimations);
    setSelectedAnimation(null);
    message.success('动画已删除');
  };

  // 更新动画配置
  const updateAnimation = (sceneId: string, animationId: string, updates: Partial<AnimationConfig>) => {
    const newAnimations = animations.map((sceneAnim) => {
      if (sceneAnim.sceneId === sceneId) {
        return {
          ...sceneAnim,
          animations: sceneAnim.animations.map((a) =>
            a.id === animationId ? { ...a, ...updates } : a
          ),
        };
      }
      return sceneAnim;
    });
    onAnimationsChange(newAnimations);

    // 更新选中状态
    if (selectedAnimation?.id === animationId) {
      setSelectedAnimation({ ...selectedAnimation, ...updates });
    }
  };

  // 复制动画
  const copyAnimation = (sceneId: string, animation: AnimationConfig) => {
    const newAnimation: AnimationConfig = {
      ...animation,
      id: `anim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      enabled: true,
    };

    const sceneAnimIndex = animations.findIndex((a) => a.sceneId === sceneId);
    if (sceneAnimIndex >= 0) {
      const newAnimations = [...animations];
      newAnimations[sceneAnimIndex] = {
        ...newAnimations[sceneAnimIndex],
        animations: [...newAnimations[sceneAnimIndex].animations, newAnimation],
      };
      onAnimationsChange(newAnimations);
    }
    message.success('动画已复制');
  };

  // 切换动画启用状态
  const toggleAnimation = (sceneId: string, animationId: string) => {
    const sceneAnim = getSceneAnimation(sceneId);
    const animation = sceneAnim?.animations.find((a) => a.id === animationId);
    if (animation) {
      updateAnimation(sceneId, animationId, { enabled: !animation.enabled });
    }
  };

  // 获取动画标签颜色
  const getCategoryColor = (category: AnimationCategory): string => {
    return CATEGORY_META.find((c) => c.key === category)?.color || '#ccc';
  };

  // 获取动画标签
  const getAnimationLabel = (type: AnimationType, category: AnimationCategory): string => {
    const meta = ANIMATION_META[category]?.find((m) => m.type === type);
    return meta?.label || type;
  };

  // 生成CSS动画字符串
  const generateAnimationCSS = (animation: AnimationConfig): string => {
    const { type, duration, delay, easing, iterations, direction, fill } = animation;
    const dir = direction ? ` ${direction}` : '';
    const fil = fill ? ` ${fill}` : '';

    const animations: Record<AnimationType, string> = {
      // 入场
      fadeIn: `fadeIn ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideInLeft: `slideInLeft ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideInRight: `slideInRight ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideInTop: `slideInTop ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideInBottom: `slideInBottom ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      zoomIn: `zoomIn ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      rotateIn: `rotateIn ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      bounceIn: `bounceIn ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      // 出场
      fadeOut: `fadeOut ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideOutLeft: `slideOutLeft ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideOutRight: `slideOutRight ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideOutTop: `slideOutTop ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideOutBottom: `slideOutBottom ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      zoomOut: `zoomOut ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      rotateOut: `rotateOut ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      // 强调
      flash: `flash ${duration / 3}ms ${easing} ${delay}ms ${iterations * 3}${dir} ${fil}`,
      shake: `shake ${duration / 3}ms ${easing} ${delay}ms ${iterations * 3}${dir} ${fil}`,
      pulse: `pulse ${duration}ms ${easing} ${delay}ms infinite${dir} ${fil}`,
      colorChange: `colorChange ${duration}ms ${easing} ${delay}ms infinite${dir} ${fil}`,
      wobble: `wobble ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      pulseScale: `pulseScale ${duration}ms ${easing} ${delay}ms infinite${dir} ${fil}`,
      // 过渡
      crossDissolve: `crossDissolve ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideLeft: `slideLeft ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      slideRight: `slideRight ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      pushLeft: `pushLeft ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      pushRight: `pushRight ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      rotatePush: `rotatePush ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
      fadeScale: `fadeScale ${duration}ms ${easing} ${delay}ms ${iterations}${dir} ${fil}`,
    };

    return animations[type] || '';
  };

  const tabItems = CATEGORY_META.map((category) => ({
    key: category.key,
    label: (
      <span>
        <span style={{ marginRight: 4 }}>{category.label}</span>
        <Tag color={category.color} style={{ marginLeft: 4 }}>
          {animations.reduce(
            (count, sa) =>
              count + sa.animations.filter((a) => a.category === category.key).length,
            0
          )}
        </Tag>
      </span>
    ),
  }));

  return (
    <div className={styles.composer}>
      <div className={styles.header}>
        <h3 className={styles.title}>动态效果合成</h3>
        <span className={styles.subtitle}>为分镜添加动画效果</span>
      </div>

      <div className={styles.content}>
        {/* 左侧：场景列表 */}
        <div className={styles.sceneList}>
          <div className={styles.sceneListHeader}>
            <span>分镜列表</span>
            <Tag color="blue">{scenes.length}</Tag>
          </div>
          <List
            size="small"
            dataSource={scenes}
            renderItem={(scene) => {
              const sceneAnimations = getSceneAnimations(scene.id);
              const isSelected = selectedSceneId === scene.id;
              return (
                <List.Item
                  className={`${styles.sceneItem} ${isSelected ? styles.sceneItemSelected : ''}`}
                  onClick={() => setSelectedSceneId(scene.id)}
                >
                  <div className={styles.sceneItemContent}>
                    {scene.thumbnail && (
                      <img
                        src={scene.thumbnail}
                        alt={scene.name}
                        className={styles.sceneThumbnail}
                      />
                    )}
                    <span className={styles.sceneName}>{scene.name}</span>
                  </div>
                  <div className={styles.sceneItemExtra}>
                    {sceneAnimations.length > 0 && (
                      <Tag color="green">{sceneAnimations.length}</Tag>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        </div>

        {/* 中间：动画配置 */}
        <div className={styles.animationPanel}>
          <Tabs
            activeKey={activeCategory}
            onChange={(key) => setActiveCategory(key as AnimationCategory)}
            items={tabItems}
            className={styles.categoryTabs}
          />

          <div className={styles.animationGrid}>
            {ANIMATION_META[activeCategory]?.map((anim) => (
              <Tooltip key={anim.type} title={anim.description}>
                <div
                  className={styles.animationItem}
                  onClick={() => {
                    if (selectedSceneId) {
                      addAnimation(selectedSceneId, anim.type, activeCategory);
                    } else {
                      message.warning('请先选择一个分镜');
                    }
                  }}
                >
                  <span className={styles.animationIcon}>{anim.icon}</span>
                  <span className={styles.animationLabel}>{anim.label}</span>
                </div>
              </Tooltip>
            ))}
          </div>

          {/* 当前场景的动画列表 */}
          {selectedSceneId && (
            <div className={styles.currentAnimations}>
              <div className={styles.currentAnimationsHeader}>
                <span>当前分镜动画</span>
              </div>
              {getSceneAnimations(selectedSceneId).length > 0 ? (
                <List
                  size="small"
                  dataSource={getSceneAnimations(selectedSceneId)}
                  renderItem={(anim) => (
                    <List.Item
                      className={`${styles.animationListItem} ${
                        selectedAnimation?.id === anim.id ? styles.animationListItemSelected : ''
                      }`}
                      onClick={() => setSelectedAnimation(anim)}
                    >
                      <div className={styles.animationListItemContent}>
                        <Tag
                          color={getCategoryColor(anim.category)}
                          className={styles.animationCategoryTag}
                        >
                          {CATEGORY_META.find((c) => c.key === anim.category)?.label}
                        </Tag>
                        <span className={styles.animationTypeLabel}>
                          {getAnimationLabel(anim.type, anim.category)}
                        </span>
                        <span className={styles.animationDuration}>
                          <ClockCircleOutlined /> {anim.duration}ms
                        </span>
                      </div>
                      <div className={styles.animationListItemActions}>
                        <Tooltip title="预览">
                          <Button
                            type="text"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview?.(selectedSceneId, anim);
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
                              copyAnimation(selectedSceneId, anim);
                            }}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="确定删除此动画？"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            removeAnimation(selectedSceneId, anim.id);
                          }}
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
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  description="暂无动画"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className={styles.emptyAnimations}
                />
              )}
            </div>
          )}
        </div>

        {/* 右侧：动画属性配置 */}
        <div className={styles.propertiesPanel}>
          <div className={styles.propertiesHeader}>
            <span>动画属性</span>
          </div>
          {selectedAnimation ? (
            <div className={styles.propertiesContent}>
              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>动画类型</label>
                <Tag color={getCategoryColor(selectedAnimation.category)}>
                  {getAnimationLabel(selectedAnimation.type, selectedAnimation.category)}
                </Tag>
              </div>

              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>
                  持续时间: {selectedAnimation.duration}ms
                </label>
                <Slider
                  min={100}
                  max={5000}
                  step={100}
                  value={selectedAnimation.duration}
                  onChange={(value) =>
                    updateAnimation(selectedSceneId!, selectedAnimation.id, { duration: value })
                  }
                />
              </div>

              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>
                  延迟时间: {selectedAnimation.delay}ms
                </label>
                <Slider
                  min={0}
                  max={3000}
                  step={100}
                  value={selectedAnimation.delay}
                  onChange={(value) =>
                    updateAnimation(selectedSceneId!, selectedAnimation.id, { delay: value })
                  }
                />
              </div>

              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>缓动函数</label>
                <Select
                  style={{ width: '100%' }}
                  value={selectedAnimation.easing}
                  options={EASING_OPTIONS}
                  onChange={(value) =>
                    updateAnimation(selectedSceneId!, selectedAnimation.id, { easing: value })
                  }
                />
              </div>

              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>
                  重复次数: {selectedAnimation.iterations}
                </label>
                <Slider
                  min={1}
                  max={10}
                  value={selectedAnimation.iterations}
                  onChange={(value) =>
                    updateAnimation(selectedSceneId!, selectedAnimation.id, { iterations: value })
                  }
                />
              </div>

              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>方向</label>
                <Select
                  style={{ width: '100%' }}
                  value={selectedAnimation.direction || 'normal'}
                  options={[
                    { value: 'normal', label: '正向' },
                    { value: 'reverse', label: '反向' },
                    { value: 'alternate', label: '交替' },
                    { value: 'alternate-reverse', label: '反向交替' },
                  ]}
                  onChange={(value) =>
                    updateAnimation(selectedSceneId!, selectedAnimation.id, {
                      direction: value === 'normal' ? undefined : value,
                    })
                  }
                />
              </div>

              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>填充模式</label>
                <Select
                  style={{ width: '100%' }}
                  value={selectedAnimation.fill || 'forwards'}
                  options={[
                    { value: 'none', label: '无' },
                    { value: 'forwards', label: '向前' },
                    { value: 'backwards', label: '向后' },
                    { value: 'both', label: '两者' },
                  ]}
                  onChange={(value) =>
                    updateAnimation(selectedSceneId!, selectedAnimation.id, { fill: value })
                  }
                />
              </div>

              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>
                  <Space>
                    <CaretRightOutlined />
                    启用动画
                  </Space>
                </label>
                <Button
                  type={selectedAnimation.enabled ? 'primary' : 'default'}
                  icon={selectedAnimation.enabled ? <CheckCircleOutlined /> : <CaretRightOutlined />}
                  onClick={() =>
                    updateAnimation(selectedSceneId!, selectedAnimation.id, {
                      enabled: !selectedAnimation.enabled,
                    })
                  }
                >
                  {selectedAnimation.enabled ? '已启用' : '已禁用'}
                </Button>
              </div>

              <div className={styles.propertyGroup}>
                <label className={styles.propertyLabel}>CSS动画代码</label>
                <code className={styles.cssCode}>
                  animation: {generateAnimationCSS(selectedAnimation)};
                </code>
              </div>

              <div className={styles.previewButton}>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  block
                  onClick={() => onPreview?.(selectedSceneId!, selectedAnimation)}
                >
                  预览效果
                </Button>
              </div>
            </div>
          ) : (
            <Empty
              description="选择一个动画进行配置"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={styles.emptyProperties}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimationComposer;
