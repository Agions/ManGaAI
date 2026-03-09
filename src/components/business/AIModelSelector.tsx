import React, { useState } from 'react';
import { Card, Row, Col, Typography, Tag, Avatar, Radio, Space, Tooltip, Button, Input, Tabs, Badge } from 'antd';
import { CheckCircleFilled, RobotOutlined, QuestionCircleOutlined, CodeOutlined, VideoCameraOutlined, EditOutlined, StarOutlined, ThunderboltOutlined, PictureOutlined, SettingOutlined, FireOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import styles from './AIModelSelector.module.less';

const { Title, Text, Paragraph } = Typography;

// 模型类型定义
export type ModelCategory = 'text' | 'code' | 'image' | 'video' | 'audio' | 'all';
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'baidu' | 'iflytek' | 'alibaba' | 'tencent' | 'zhipu' | 'minimax' | 'moonshot' | 'bytedance' | 'kling';

export interface AIModel {
  id: string;
  name: string;
  nameCn?: string;
  provider: ModelProvider;
  category: ModelCategory[];
  description: string;
  features: string[];
  tokenLimit: number;
  isPro?: boolean;
  pricing?: { input: number; output: number; unit: string };
}

interface AIModelSelectorProps {
  selectedModel?: string;
  onChange?: (modelId: string) => void;
  onConfigureAPI?: (provider: ModelProvider) => void;
  category?: ModelCategory;
  compact?: boolean;
  className?: string;
  showImageVideo?: boolean;
}

// 完整的模型列表
const models: AIModel[] = [
  // ========== 文本模型 ==========
  {
    id: 'glm-5',
    name: 'GLM-5',
    nameCn: '智谱清言',
    provider: 'zhipu',
    category: ['text', 'code'],
    description: '智谱最新大模型，2026年发布，支持超长上下文',
    features: ['中文理解', '代码生成', '多模态'],
    tokenLimit: 128000,
    pricing: { input: 0.001, output: 0.003, unit: '1K tokens' }
  },
  {
    id: 'minimax-m2.5',
    name: 'MiniMax M2.5',
    nameCn: 'MiniMax',
    provider: 'minimax',
    category: ['text', 'code'],
    description: 'MiniMax M2.5 大模型，2026年2月发布，支持超长上下文',
    features: ['超长上下文', '中文优化', '高性价比'],
    tokenLimit: 100000,
    pricing: { input: 0.01, output: 0.03, unit: '1K tokens' }
  },
  {
    id: 'qwen-2.5',
    name: 'Qwen 2.5',
    nameCn: '通义千问',
    provider: 'alibaba',
    category: ['text', 'code', 'image'],
    description: '阿里通义千问 2.5，2026年发布，全面升级',
    features: ['多模态', '长上下文', '代码生成'],
    tokenLimit: 32000,
    pricing: { input: 0.006, output: 0.018, unit: '1K tokens' }
  },
  {
    id: 'kimi-k2.5',
    name: 'Kimi K2.5',
    nameCn: '月之暗面',
    provider: 'moonshot',
    category: ['text', 'code', 'image'],
    description: '月之暗面 Kimi K2.5，2026年发布，支持多模态理解',
    features: ['多模态理解', '长上下文', '代码生成'],
    tokenLimit: 200000,
    isPro: true,
    pricing: { input: 0.012, output: 0.036, unit: '1K tokens' }
  },
  {
    id: 'doubao-2.0',
    name: '豆包 2.0',
    nameCn: '豆包',
    provider: 'bytedance',
    category: ['text', 'code', 'image'],
    description: '字节跳动豆包 2.0，2026年发布，高性能多模态模型',
    features: ['多模态', '快速响应', '中文优化'],
    tokenLimit: 128000,
    pricing: { input: 0.005, output: 0.015, unit: '1K tokens' }
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    nameCn: 'GPT-4o',
    provider: 'openai',
    category: ['text', 'code', 'image'],
    description: '最强大的多模态大模型，支持文本、代码和图像分析',
    features: ['视觉理解', '高级推理', '代码生成'],
    tokenLimit: 128000,
    isPro: true,
    pricing: { input: 0.005, output: 0.015, unit: '1K tokens' }
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3.5 Sonnet',
    nameCn: 'Claude',
    provider: 'anthropic',
    category: ['text', 'code', 'image'],
    description: '平衡性能与速度的Claude模型，多任务处理能力强',
    features: ['创意写作', '精确回答', '图像分析'],
    tokenLimit: 200000,
    pricing: { input: 0.003, output: 0.015, unit: '1K tokens' }
  },
  // ========== 图像生成模型 ==========
  {
    id: 'seedream-5.0',
    name: 'Seedream 5.0',
    nameCn: '即梦',
    provider: 'bytedance',
    category: ['image'],
    description: '字节即梦 5.0，2026年发布，2K直出、4K AI增强、控制笔刷',
    features: ['2K直出', '4K AI增强', '控制笔刷', '漫画风格'],
    tokenLimit: 4096,
    pricing: { input: 0.01, output: 0.05, unit: '1K tokens' }
  },
  {
    id: 'kling-3.0-image',
    name: 'Kling 3.0',
    nameCn: '可灵 3.0',
    provider: 'kling',
    category: ['image'],
    description: '快手可灵 3.0，2026年最新发布，高质量图像生成，叙事感增强',
    features: ['图像生成', 'AI增强', '叙事感', '2K/4K输出'],
    tokenLimit: 4096,
    pricing: { input: 0.015, output: 0.08, unit: '1K tokens' }
  },
  {
    id: 'kling-1.6-image',
    name: 'Kling 1.6',
    nameCn: '可灵 1.6',
    provider: 'kling',
    category: ['image'],
    description: '快手可灵 1.6，2026年发布，高质量图像生成',
    features: ['图像生成', 'AI增强', '动漫风格'],
    tokenLimit: 4096,
    pricing: { input: 0.02, output: 0.1, unit: '1K tokens' }
  },
  {
    id: 'vidu-2.0-image',
    name: 'Vidu 2.0',
    nameCn: 'Vidu',
    provider: 'bytedance',
    category: ['image'],
    description: '生数Vidu 2.0，2026年发布，图像+视频生成',
    features: ['图像生成', '视频生成', 'AI增强'],
    tokenLimit: 4096,
    pricing: { input: 0.015, output: 0.08, unit: '1K tokens' }
  },
  // ========== 视频生成模型 ==========
  {
    id: 'seedance-2.0',
    name: 'Seedance 2.0',
    nameCn: '即梦',
    provider: 'bytedance',
    category: ['video'],
    description: '字节即梦 2.0，2026年发布，文本/图片/视频输入，镜头保持一致',
    features: ['文本生成视频', '图片生成视频', '视频生成视频', '镜头一致性'],
    tokenLimit: 4096,
    pricing: { input: 0.05, output: 0.2, unit: '1K tokens' }
  },
  {
    id: 'kling-3.0-video',
    name: 'Kling 3.0',
    nameCn: '可灵 3.0',
    provider: 'kling',
    category: ['video'],
    description: '快手可灵 3.0 Omni，2026年最新发布，图像理解和物理世界模拟增强',
    features: ['文生视频', '图生视频', '多镜头', '15秒时长', '原生音视频同步'],
    tokenLimit: 4096,
    pricing: { input: 0.015, output: 0.08, unit: '1K tokens' }
  },
  {
    id: 'kling-1.6-video',
    name: 'Kling 1.6',
    nameCn: '可灵 1.6',
    provider: 'kling',
    category: ['video'],
    description: '快手可灵 1.6 视频生成，2026年发布，高一致性',
    features: ['图像生成', '视频生成', 'AI增强'],
    tokenLimit: 4096,
    pricing: { input: 0.02, output: 0.1, unit: '1K tokens' }
  },
  {
    id: 'vidu-2.0-video',
    name: 'Vidu 2.0',
    nameCn: 'Vidu',
    provider: 'bytedance',
    category: ['video'],
    description: '生数Vidu 2.0，2026年发布，中国首个长时长视频大模型',
    features: ['文生视频', '图生视频', '角色一致性', '动漫风格突出'],
    tokenLimit: 4096,
    pricing: { input: 0.015, output: 0.08, unit: '1K tokens' }
  }
];

// 提供商信息
const providerInfo: Record<ModelProvider, { name: string; nameCn: string; icon: string; color: string }> = {
  openai: { name: 'OpenAI', nameCn: 'OpenAI', icon: '🤖', color: '#10A37F' },
  anthropic: { name: 'Anthropic', nameCn: 'Anthropic', icon: '🧠', color: '#D97757' },
  google: { name: 'Google', nameCn: '谷歌', icon: '🔍', color: '#4285F4' },
  baidu: { name: 'Baidu', nameCn: '百度', icon: '🔴', color: '#2932E1' },
  alibaba: { name: 'Alibaba', nameCn: '阿里云', icon: '🟠', color: '#FF6A00' },
  zhipu: { name: 'Zhipu', nameCn: '智谱AI', icon: '🟢', color: '#00D08E' },
  iflytek: { name: 'iFlytek', nameCn: '科大讯飞', icon: '🔵', color: '#0099FF' },
  tencent: { name: 'Tencent', nameCn: '腾讯云', icon: '🟣', color: '#12B7F5' },
  minimax: { name: 'MiniMax', nameCn: 'MiniMax', icon: '⭐', color: '#6366F1' },
  moonshot: { name: 'Moonshot', nameCn: '月之暗面', icon: '🌙', color: '#8B5CF6' },
  bytedance: { name: 'ByteDance', nameCn: '字节跳动', icon: '🎵', color: '#FE2C55' },
  kling: { name: 'Kling', nameCn: '快手可灵', icon: '🎬', color: '#FF4906' }
};

const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel = 'glm-5',
  onChange,
  onConfigureAPI,
  category = 'all',
  compact = false,
  className = '',
  showImageVideo = true
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(selectedModel);
  const [activeCategory, setActiveCategory] = useState<ModelCategory>(category);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>(compact ? 'list' : 'card');
  const [activeTab, setActiveTab] = useState<string>('text');

  // 过滤模型
  const filteredModels = models.filter(model => {
    if (activeTab === 'image' && !model.category.includes('image')) return false;
    if (activeTab === 'video' && !model.category.includes('video')) return false;
    if (activeTab === 'text' && !model.category.includes('text')) return false;
    if (activeCategory !== 'all' && !model.category.includes(activeCategory)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        model.name.toLowerCase().includes(query) ||
        model.nameCn?.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.features.some(f => f.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    if (onChange) onChange(modelId);
  };

  const getProviderInfo = (provider: ModelProvider) => providerInfo[provider] || { name: provider, nameCn: provider, icon: '🔹', color: '#666' };

  const renderPricing = (model: AIModel) => {
    if (!model.pricing) return null;
    return <Tag color="blue" className={styles.priceTag}>¥{model.pricing.input}/{model.pricing.unit}</Tag>;
  };

  const renderCardView = () => (
    <Row gutter={[16, 16]} className={styles.modelGrid}>
      {filteredModels.map((model, index) => {
        const provider = getProviderInfo(model.provider);
        return (
          <Col xs={24} sm={12} md={8} lg={6} key={model.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                hoverable
                className={`${styles.modelCard} ${selectedModelId === model.id ? styles.selectedModel : ''}`}
                onClick={() => handleModelSelect(model.id)}
                bodyStyle={{ padding: '16px' }}
              >
                <div className={styles.modelHeader}>
                  <Space align="center">
                    <Avatar
                      size={40}
                      className={styles.modelAvatar}
                      style={{ backgroundColor: provider.color }}
                    >
                      {provider.icon}
                    </Avatar>
                    <div>
                      <Text strong className={styles.modelName}>{model.nameCn || model.name}</Text>
                      {model.isPro && <Tag color="gold" className={styles.proTag}><StarOutlined /> Pro</Tag>}
                    </div>
                  </Space>
                  {selectedModelId === model.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                      <CheckCircleFilled className={styles.checkIcon} />
                    </motion.div>
                  )}
                </div>

                <div className={styles.providerInfo}>
                  <Tag color="processing" className={styles.providerTag}>{provider.icon} {provider.nameCn}</Tag>
                  {renderPricing(model)}
                </div>

                <Paragraph className={styles.modelDescription} ellipsis={{ rows: 2 }}>{model.description}</Paragraph>

                <div className={styles.modelFeatures}>
                  {model.features.slice(0, 3).map((feature, idx) => (
                    <Tag key={idx} className={styles.featureTag}>{feature}</Tag>
                  ))}
                </div>

                <div className={styles.tokenLimit}>
                  <Tooltip title="模型可处理的最大上下文长度">
                    <Text type="secondary" className={styles.tokenText}>
                      <ThunderboltOutlined /> {(model.tokenLimit / 1000).toFixed(0)}K tokens
                    </Text>
                  </Tooltip>
                </div>
              </Card>
            </motion.div>
          </Col>
        );
      })}
    </Row>
  );

  const renderListView = () => (
    <div className={styles.modelList}>
      <Radio.Group value={selectedModelId} onChange={(e) => handleModelSelect(e.target.value)} className={styles.modelRadioGroup}>
        {filteredModels.map((model, index) => {
          const provider = getProviderInfo(model.provider);
          return (
            <motion.div
              key={model.id}
              className={styles.modelListItem}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              whileHover={{ x: 4 }}
            >
              <Radio value={model.id} className={styles.modelRadio}>
                <Space align="center">
                  <Avatar size={32} style={{ backgroundColor: provider.color }}>{provider.icon}</Avatar>
                  <div>
                    <div className={styles.modelNameRow}>
                      <Text strong>{model.nameCn || model.name}</Text>
                      {model.isPro && <Tag color="gold" className={styles.proTagSmall}><StarOutlined /> Pro</Tag>}
                      {renderPricing(model)}
                    </div>
                    <div className={styles.modelProviderRow}>
                      <Text type="secondary">{provider.nameCn}</Text>
                      <span className={styles.tokenBadge}><ThunderboltOutlined /> {(model.tokenLimit / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </Space>
              </Radio>
            </motion.div>
          );
        })}
      </Radio.Group>
    </div>
  );

  const renderTabs = () => (
    <Tabs
      activeKey={activeTab}
      onChange={setActiveTab}
      items={[
        { key: 'text', label: <span><EditOutlined /> 文本模型</span> },
        { key: 'image', label: <span><PictureOutlined /> 图像生成</span> },
        { key: 'video', label: <span><VideoCameraOutlined /> 视频生成</span> }
      ]}
      className={styles.modelTabs}
    />
  );

  return (
    <motion.div className={`${styles.container} ${className}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <motion.div className={styles.header} initial={{ y: -20 }} animate={{ y: 0 }} transition={{ duration: 0.3 }}>
        <Title level={compact ? 5 : 4} className={styles.title}>
          选择AI模型
          <Tooltip title="选择不同的AI模型以适应您的任务需求">
            <QuestionCircleOutlined className={styles.helpIcon} />
          </Tooltip>
        </Title>

        <div className={styles.controls}>
          {!compact && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Input.Search placeholder="搜索模型..." onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput} allowClear />
            </motion.div>
          )}
          {!compact && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} optionType="button" buttonStyle="solid" className={styles.viewToggle}>
                <Radio.Button value="card">卡片</Radio.Button>
                <Radio.Button value="list">列表</Radio.Button>
              </Radio.Group>
            </motion.div>
          )}
        </div>
      </motion.div>

      {showImageVideo && !compact && renderTabs()}

      <div className={styles.content}>
        {viewMode === 'card' ? renderCardView() : renderListView()}
      </div>

      {onConfigureAPI && (
        <motion.div className={styles.footer} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <Button type="link" onClick={() => onConfigureAPI(models.find(m => m.id === selectedModelId)?.provider || 'bytedance')} icon={<SettingOutlined />}>
            配置API密钥
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIModelSelector;
