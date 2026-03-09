import React, { useState } from 'react';
import { Card, Button, Radio, Form, Input, Select, message, Typography, Alert, Spin, Space, Tooltip } from 'antd';
import { FileTextOutlined, RobotOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '@/core/services';
import { useLegacyStore } from '@/core/stores';
import type { ScriptData, ScriptMetadata, ScriptSegment, VideoAnalysis } from '@/core/types';
import { AIModelType, AI_MODEL_INFO } from '@/core/types/legacy.types';
import styles from './ScriptGenerator.module.less';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ScriptGeneratorProps {
  projectId: string;
  analysis: VideoAnalysis;
  onScriptGenerated: (script: ScriptData) => void;
}

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  projectId,
  analysis,
  onScriptGenerated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [generationMethod, setGenerationMethod] = useState<'auto' | 'guided'>('auto');
  const { aiModelsSettings, selectedAIModel } = useLegacyStore();
  const [selectedModel, setSelectedModel] = useState<AIModelType>(selectedAIModel);

  // 解析脚本内容为片段
  const parseScriptContent = (content: string): ScriptSegment[] => {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map((p, index) => ({
      id: `seg_${index + 1}`,
      startTime: index * 30,
      endTime: (index + 1) * 30,
      content: p.trim(),
      type: index === 0 ? 'narration' : index === paragraphs.length - 1 ? 'narration' : 'dialogue'
    }));
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取所选AI模型配置
      const modelSettings = aiModelsSettings[selectedModel];
      if (!modelSettings?.enabled || !modelSettings?.apiKey) {
        throw new Error(`${AI_MODEL_INFO[selectedModel].name}模型尚未启用或API密钥未配置`);
      }

      // 获取表单值，用于引导生成
      const formValues = generationMethod === 'guided' ? form.getFieldsValue() : {};

      // 调用AI服务生成脚本内容
      const scriptContent = await aiService.generate(
        `请基于以下视频分析结果生成一个专业的解说脚本。视频分析: ${JSON.stringify(analysis)}`,
        {
          model: selectedAIModel,
          provider: AI_MODEL_INFO[selectedModel].provider.toLowerCase(),
        }
      );

      // 解析脚本内容为结构化数据
      const scriptSegments = parseScriptContent(scriptContent);

      // 创建脚本对象
      const script: ScriptData = {
        id: uuidv4(),
        title: formValues.title || '未命名脚本',
        content: scriptContent,
        segments: scriptSegments,
        metadata: {
          style: formValues.style || 'informative',
          tone: formValues.tone || 'neutral',
          length: 'medium',
          targetAudience: 'general',
          language: 'zh',
          wordCount: scriptContent.length,
          estimatedDuration: Math.ceil(scriptContent.length / 150),
          generatedBy: AI_MODEL_INFO[selectedModel].name,
          generatedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      message.success('脚本生成成功');
      onScriptGenerated(script);
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message || '脚本生成失败');
      message.error('脚本生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理AI模型变更
  const handleModelChange = (value: AIModelType) => {
    setSelectedModel(value);

    // 检查是否有API密钥
    const modelSettings = aiModelsSettings[value];
    if (!modelSettings?.enabled) {
      message.warning(`您尚未配置${AI_MODEL_INFO[value].name}的API密钥，请前往"设置"页面进行配置`);
    }
  };

  return (
    <Card className={styles.container}>
      <Title level={4}>脚本生成</Title>
      <Paragraph>
        基于视频分析结果，生成专业的解说脚本。您可以选择自动生成，或者通过引导模式自定义脚本风格和内容。
      </Paragraph>

      {error && (
        <Alert
          message="生成错误"
          description={error}
          type="error"
          showIcon
          className={styles.alert}
        />
      )}

      <div className={styles.modelSelection}>
        <Form.Item
          label={
            <span>
              AI 模型选择
              <Tooltip title="选择用于生成脚本的国产大模型">
                <InfoCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            </span>
          }
        >
          <Select
            value={selectedModel}
            onChange={handleModelChange}
            style={{ width: '100%' }}
          >
            {Object.entries(AI_MODEL_INFO).map(([key, model]) => (
              <Option
                key={key}
                value={key}
                disabled={!aiModelsSettings[key as AIModelType]?.enabled}
              >
                <Space>
                  <RobotOutlined />
                  <span>{model.name}</span>
                  <span style={{ color: '#999' }}>({model.provider})</span>
                  {!aiModelsSettings[key as AIModelType]?.enabled && (
                    <span style={{ color: '#f5222d' }}>未配置</span>
                  )}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <div className={styles.generationMethod}>
        <Radio.Group
          value={generationMethod}
          onChange={(e) => setGenerationMethod(e.target.value)}
          className={styles.radioGroup}
        >
          <Radio.Button value="auto">自动生成</Radio.Button>
          <Radio.Button value="guided">引导模式</Radio.Button>
        </Radio.Group>
      </div>

      {generationMethod === 'guided' && (
        <Form
          form={form}
          layout="vertical"
          className={styles.form}
        >
          <Form.Item
            name="style"
            label="脚本风格"
            initialValue="informative"
          >
            <Select>
              <Option value="informative">信息型 - 客观、教育性、详细</Option>
              <Option value="entertaining">娱乐型 - 活泼、风趣、吸引人</Option>
              <Option value="dramatic">戏剧型 - 情感丰富、紧张、引人入胜</Option>
              <Option value="casual">随意型 - 轻松、对话式、自然</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="tone"
            label="语气"
            initialValue="neutral"
          >
            <Select>
              <Option value="neutral">中立</Option>
              <Option value="enthusiastic">热情</Option>
              <Option value="serious">严肃</Option>
              <Option value="humorous">幽默</Option>
              <Option value="inspirational">励志</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="focusPoints"
            label="重点关注"
          >
            <Select mode="multiple" placeholder="选择要重点关注的内容">
              {analysis?.keyframes?.map((kf, index) => (
                <Option key={index} value={index}>
                  {kf.description || `关键帧 ${index + 1}`} ({Math.floor(kf.timestamp / 60)}:{String(kf.timestamp % 60).padStart(2, '0')})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="additionalInstructions"
            label="其他说明"
          >
            <TextArea
              rows={4}
              placeholder="请输入其他特殊要求或说明..."
            />
          </Form.Item>
        </Form>
      )}

      <Button
        type="primary"
        icon={<FileTextOutlined />}
        onClick={handleGenerate}
        loading={loading}
        className={styles.button}
      >
        生成脚本
      </Button>

      {loading && (
        <div className={styles.spinner}>
          <Spin indicator={<RobotOutlined spin className={styles.loadingIcon} />} />
          <span className={styles.loadingText}>AI 正在使用{AI_MODEL_INFO[selectedModel].name}创作中...</span>
        </div>
      )}
    </Card>
  );
};

export default ScriptGenerator;
