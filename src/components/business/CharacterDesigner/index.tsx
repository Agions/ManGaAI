import React, { useState, useCallback } from 'react';
import {
  Card,
  List,
  Button,
  Form,
  Input,
  Select,
  ColorPicker,
  Upload,
  Space,
  Avatar,
  Divider,
  Modal,
  message,
  Tag,
  Row,
  Col,
  Tooltip,
  Typography,
  Tabs,
  Collapse,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  UploadOutlined,
  SaveOutlined,
  CloseOutlined,
  PictureOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import type { Color } from 'antd/es/color-picker';
import styles from './index.module.less';

// 使用项目中定义的类型
import type { 
  Character, 
  CharacterAppearance, 
  ClothingItem, 
  CharacterExpression,
  TTSProvider 
} from '@/core/types';
import { 
  CHARACTER_TEMPLATES, 
  getTemplatesByCategory, 
  templateToCharacter,
  type CharacterTemplate 
} from '@/core/data/character-templates';

// 服装类型标签
const CLOTHING_TYPE_LABELS: Record<ClothingItem['type'], string> = {
  head: '头部',
  top: '上衣',
  bottom: '下装',
  shoes: '鞋子',
  accessory: '配饰',
};

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title, Paragraph } = Typography;
const { Panel } = Collapse;

interface CharacterDesignerProps {
  characters?: Character[];
  onChange?: (characters: Character[]) => void;
  projectId?: string;
}

// 默认外观模板
const DEFAULT_APPEARANCE: CharacterAppearance = {
  gender: 'male',
  age: 25,
  hairStyle: '短发',
  hairColor: '#000000',
  eyeColor: '#000000',
  skinTone: '#f5d0c5',
  bodyType: 'average',
};

// 生成唯一ID
const generateId = () => `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const CharacterDesigner: React.FC<CharacterDesignerProps> = ({
  characters = [],
  onChange,
  projectId,
}) => {
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [expressionImages, setExpressionImages] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState<'manual' | 'template'>('manual');
  const [selectedTemplate, setSelectedTemplate] = useState<CharacterTemplate | null>(null);
  const [templatePreviewVisible, setTemplatePreviewVisible] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  
  // 服装编辑器状态
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [newClothingType, setNewClothingType] = useState<ClothingItem['type']>('top');
  const [newClothingName, setNewClothingName] = useState('');
  const [newClothingColor, setNewClothingColor] = useState('#000000');

  // 通知父组件更新
  const notifyChange = useCallback((newChars: Character[]) => {
    onChange?.(newChars);
  }, [onChange]);

  // 从模板创建角色
  const handleCreateFromTemplate = (template: CharacterTemplate) => {
    setSelectedTemplate(template);
    setTemplatePreviewVisible(true);
  };

  // 使用模板创建角色（应用覆盖）
  const handleUseTemplate = async (name?: string, description?: string) => {
    if (!selectedTemplate) return;

    try {
      const characterData = templateToCharacter(selectedTemplate, {
        name: name || selectedTemplate.name,
        description: description || selectedTemplate.description,
      });
      const now = new Date().toISOString();
      
      const newCharacter: Character = {
        ...characterData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        expressions: characterData.expressions || [],
      };

      const newChars = [...characters, newCharacter];
      notifyChange(newChars);
      message.success('角色已从模板创建');
      setTemplatePreviewVisible(false);
      setSelectedTemplate(null);
      setActiveTab('manual');
    } catch (error) {
      console.error('Failed to create character from template:', error);
      message.error('创建角色失败');
    }
  };

  // 打开新增模态框（手动创建）
  const handleAdd = () => {
    setActiveTab('manual');
    setSelectedTemplate(null);
    form.resetFields();
    form.setFieldsValue({
      appearance: DEFAULT_APPEARANCE,
      clothing: [],
      tags: [],
    });
    setAvatarUrl(undefined);
    setEditingId(null);
    setClothingItems([]);
    setNewClothingType('top');
    setNewClothingName('');
    setNewClothingColor('#000000');
    setModalVisible(true);
  };

  // 打开编辑模态框
  const handleEdit = (character: Character) => {
    setActiveTab('manual');
    setSelectedTemplate(null);
    setEditingId(character.id);
    setAvatarUrl(undefined);
    setClothingItems(character.clothing || []);
    form.setFieldsValue({
      name: character.name,
      role: character.role,
      description: character.description,
      appearance: character.appearance,
      clothing: character.clothing,
      tags: character.tags,
      voice: character.voice,
    });
    setModalVisible(true);
  };

  // 删除角色
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个角色吗？',
      onOk: () => {
        const newChars = characters.filter(c => c.id !== id);
        notifyChange(newChars);
        message.success('角色已删除');
      },
    });
  };

  // 服装编辑函数
  const handleAddClothing = () => {
    if (!newClothingName || !newClothingColor) {
      message.warning('请输入服装名称和颜色');
      return;
    }

    const newItem: ClothingItem = {
      type: newClothingType,
      name: newClothingName,
      style: '',
      color: newClothingColor,
    };

    setClothingItems(prev => [...prev, newItem]);
    setNewClothingName('');
    setNewClothingColor('#000000');
    message.success('已添加到服装列表');
  };

  const handleRemoveClothing = (index: number) => {
    setClothingItems(prev => prev.filter((_, i) => i !== index));
  };

  const quickAddClothing = (type: ClothingItem['type'], name: string, color: string) => {
    setClothingItems(prev => [...prev, { type, name, style: '', color }]);
    message.success(`已添加: ${name}`);
  };

  // 保存角色
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const now = new Date().toISOString();

      // 确保 consistency.seed 存在
      const consistency = values.consistency || {
        seed: editingId 
          ? characters.find(c => c.id === editingId)?.consistency.seed 
          : Math.floor(Math.random() * 10000)
      };

      const newCharacter: Character = {
        id: editingId || generateId(),
        name: values.name,
        role: values.role || 'supporting',
        description: values.description || '',
        appearance: values.appearance,
        clothing: clothingItems.length > 0 ? clothingItems : (values.clothing || []),
        expressions: editingId
          ? characters.find(c => c.id === editingId)?.expressions || []
          : [],
        consistency,
        voice: values.voice,
        tags: values.tags || [],
        createdAt: editingId ? characters.find(c => c.id === editingId)?.createdAt || now : now,
        updatedAt: now,
      };

      let newChars: Character[];
      if (editingId) {
        newChars = characters.map(c => c.id === editingId ? newCharacter : c);
        message.success('角色已更新');
      } else {
        newChars = [...characters, newCharacter];
        message.success('角色已创建');
      }

      notifyChange(newChars);
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // 头像上传
  const handleAvatarUpload = (file: RcFile) => {
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    return false; // 阻止自动上传
  };

  // 表情图片上传（临时存储）
  const handleExpressionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const currentId = editingId || 'new';
      setExpressionImages(prev => ({
        ...prev,
        [currentId]: [...(prev[currentId] || []), url],
      }));
    };
    reader.readAsDataURL(file);
    // 重置 input 以允许重复上传同一文件
    e.target.value = '';
  };

  // 添加表情到角色
  const addExpressionToCharacter = (characterId: string, expression: CharacterExpression) => {
    const char = characters.find(c => c.id === characterId);
    if (!char) return;

    const newExprs = [...char.expressions, expression];
    const newChars = characters.map(c =>
      c.id === characterId ? { ...c, expressions: newExprs } : c
    );
    notifyChange(newChars);
  };

  // 渲染模板卡片
  const renderTemplateCard = (template: CharacterTemplate) => (
    <Card
      key={template.id}
      hoverable
      className={styles.templateCard}
      cover={template.thumbnail && (
        <div className={styles.templateThumb}>
          <img src={template.thumbnail} alt={template.name} />
        </div>
      )}
      actions={[
        <Button 
          key="select" 
          type="primary" 
          size="small"
          onClick={() => handleCreateFromTemplate(template)}
        >
          使用此模板
        </Button>
      ]}
    >
      <Card.Meta
        title={template.name}
        description={
          <Space direction="vertical" size={2}>
            <Text type="secondary">{template.category}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {template.description}
            </Text>
            <Tag color="blue">{template.appearance.gender}, {template.appearance.age}岁</Tag>
          </Space>
        }
      />
    </Card>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建角色
        </Button>
        <Button 
          icon={<AppstoreOutlined />} 
          onClick={() => {
            setActiveTab('template');
            setModalVisible(true);
          }}
          style={{ marginLeft: 8 }}
        >
          从模板创建
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card className={styles.emptyCard}>
          <div className={styles.emptyState}>
            <UserOutlined style={{ fontSize: 48, color: '#ccc' }} />
            <Title level={5}>还没有角色</Title>
            <Paragraph type="secondary">
              您可以手动创建角色，或从预设模板快速开始
            </Paragraph>
            <Space>
              <Button type="primary" onClick={handleAdd}>手动创建</Button>
              <Button 
                icon={<AppstoreOutlined />}
                onClick={() => {
                  setActiveTab('template');
                  setModalVisible(true);
                }}
              >
                浏览模板库
              </Button>
            </Space>
          </div>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
          dataSource={characters}
          renderItem={(character) => (
            <List.Item>
              <Card
                className={styles.characterCard}
                hoverable
                actions={[
                  <EditOutlined key="edit" onClick={() => handleEdit(character)} />,
                  <DeleteOutlined key="delete" onClick={() => handleDelete(character.id)} />,
                ]}
              >
                <Card.Meta
                  avatar={<Avatar size={64} src={undefined} icon={<UserOutlined />} />}
                  title={character.name}
                  description={
                    <Space direction="vertical" size={2}>
                      <Tag color={character.role === 'protagonist' ? 'gold' : character.role === 'antagonist' ? 'red' : 'blue'}>
                        {character.role === 'protagonist' ? '主角' : character.role === 'antagonist' ? '反派' : character.role === 'supporting' ? '配角' : character.role}
                      </Tag>
                      <Text type="secondary">{character.appearance.gender}, {character.appearance.age}岁</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {character.appearance.hairStyle} · {character.appearance.hairColor}
                      </Text>
                      {character.consistency.seed !== undefined && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Seed: {character.consistency.seed}
                        </Text>
                      )}
                    </Space>
                  }
                />
                <Divider style={{ margin: '12px 0' }} />
                <Space size={8} wrap>
                  {character.tags.slice(0, 3).map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}

      {/* 主模态框：手动编辑/创建 */}
      <Modal
        title={editingId ? '编辑角色' : '新建角色'}
        open={modalVisible && activeTab === 'manual'}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" initialValues={{ appearance: DEFAULT_APPEARANCE }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="name" 
                label="角色名称" 
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="如：张三" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="角色定位">
                <Select placeholder="选择角色定位">
                  <Option value="protagonist">主角</Option>
                  <Option value="antagonist">反派</Option>
                  <Option value="supporting">配角</Option>
                  <Option value="minor">群众角色</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="角色描述">
            <TextArea rows={2} placeholder="描述角色的性格、背景故事等" />
          </Form.Item>

          <Divider orientation="left">外观配置</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name={['appearance', 'gender']} label="性别">
                <Select>
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['appearance', 'age']} label="年龄">
                <Input type="number" min={1} max={120} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['appearance', 'bodyType']} label="体型">
                <Select>
                  <Option value="slim">瘦弱</Option>
                  <Option value="average">普通</Option>
                  <Option value="athletic">健壮</Option>
                  <Option value="heavy">丰满</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name={['appearance', 'hairStyle']} label="发型">
                <Input placeholder="如：短发、长发、卷发" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['appearance', 'hairColor']} label="发色">
                <ColorPicker showText size="small" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={['appearance', 'eyeColor']} label="眼色">
                <ColorPicker showText size="small" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['appearance', 'skinTone']} label="肤色">
                <ColorPicker showText size="small" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['appearance', 'height']} label="身高 (cm)">
                <Input type="number" placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name={['appearance', 'features']} label="特殊特征">
            <Select mode="tags" placeholder="如：疤痕、纹身、戴眼镜">
              <Option value="scar">疤痕</Option>
              <Option value="tattoo">纹身</Option>
              <Option value="glasses">眼镜</Option>
              <Option value="freckles">雀斑</Option>
              <Option value="beard">胡须</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">服装装备</Divider>

          <div className={styles.clothingEditor}>
            <Form.Item name="clothing" label="当前服装">
              <Select mode="tags" placeholder="已添加的服装项目">
                {clothingItems && clothingItems.length > 0 ? (
                  clothingItems.map((item, idx) => (
                    <Option key={idx} value={`${item.type}:${item.name}:${item.color}`}>
                      {CLOTHING_TYPE_LABELS[item.type] || item.type}: {item.name} ({item.color})
                    </Option>
                  ))
                ) : (
                  <Option value="" disabled>暂无服装，请添加</Option>
                )}
              </Select>
            </Form.Item>

            <div className={styles.clothingAddPanel}>
              <Row gutter={8} align="middle">
                <Col span={5}>
                  <Text strong>类型:</Text>
                </Col>
                <Col span={5}>
                  <Text strong>名称:</Text>
                </Col>
                <Col span={5}>
                  <Text strong>颜色:</Text>
                </Col>
                <Col span={6}>
                  <Text strong>操作:</Text>
                </Col>
              </Row>
              
              <Row gutter={8} align="middle" style={{ marginTop: 8 }}>
                <Col span={5}>
                  <Select 
                    placeholder="类型" 
                    style={{ width: '100%' }}
                    value={newClothingType}
                    onChange={setNewClothingType}
                  >
                    <Option value="head">头部</Option>
                    <Option value="top">上衣</Option>
                    <Option value="bottom">下装</Option>
                    <Option value="shoes">鞋子</Option>
                    <Option value="accessory">配饰</Option>
                  </Select>
                </Col>
                <Col span={5}>
                  <Input 
                    placeholder="如：衬衫" 
                    value={newClothingName}
                    onChange={(e) => setNewClothingName(e.target.value)}
                  />
                </Col>
                <Col span={5}>
                  <Input 
                    placeholder="如：蓝色" 
                    value={newClothingColor}
                    onChange={(e) => setNewClothingColor(e.target.value)}
                  />
                </Col>
                <Col span={6}>
                  <Space>
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={handleAddClothing}
                      disabled={!newClothingName || !newClothingColor}
                    >
                      添加
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        setNewClothingType('top');
                        setNewClothingName('');
                        setNewClothingColor('');
                      }}
                    >
                      重置
                    </Button>
                  </Space>
                </Col>
              </Row>

              {/* 快速选择常用服装 */}
              <div className={styles.quickClothing}>
                <Text type="secondary" style={{ marginRight: 8 }}>快速添加:</Text>
                <Space wrap>
                  <Button 
                    size="small" 
                    onClick={() => quickAddClothing('top', 'T恤', '#ffffff')}
                  >白T恤</Button>
                  <Button 
                    size="small" 
                    onClick={() => quickAddClothing('top', '衬衫', '#ffffff')}
                  >白衬衫</Button>
                  <Button 
                    size="small" 
                    onClick={() => quickAddClothing('bottom', '牛仔裤', '#000080')}
                  >牛仔裤</Button>
                  <Button 
                    size="small" 
                    onClick={() => quickAddClothing('bottom', '西裤', '#2c3e50')}
                  >西裤</Button>
                  <Button 
                    size="small" 
                    onClick={() => quickAddClothing('shoes', '运动鞋', '#ffffff')}
                  >运动鞋</Button>
                  <Button 
                    size="small" 
                    onClick={() => quickAddClothing('shoes', '皮鞋', '#000000')}
                  >皮鞋</Button>
                  <Button 
                    size="small" 
                    onClick={() => quickAddClothing('accessory', '眼镜', '#000000')}
                  >眼镜</Button>
                </Space>
              </div>
            </div>

            {/* 已添加服装预览 */}
            {clothingItems && clothingItems.length > 0 && (
              <div className={styles.clothingPreview}>
                <Divider orientation="left">已添加的服装</Divider>
                <Row gutter={[8, 8]}>
                  {clothingItems.map((item, idx) => (
                    <Col span={6} key={idx}>
                      <Card 
                        size="small" 
                        className={styles.clothingItemCard}
                        extra={
                          <Button 
                            type="text" 
                            danger 
                            size="small"
                            onClick={() => handleRemoveClothing(idx)}
                          >
                            删除
                          </Button>
                        }
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Tag color="blue">{CLOTHING_TYPE_LABELS[item.type]}</Tag>
                          <Text strong>{item.name}</Text>
                          <Space>
                            <div 
                              className={styles.colorSwatch}
                              style={{ backgroundColor: item.color }}
                            />
                            <Text type="secondary">{item.color}</Text>
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>

          <Divider orientation="left">表情与形象</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Upload
                listType="picture-card"
                showUploadList={false}
                beforeUpload={handleAvatarUpload}
                accept="image/*"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>上传头像</div>
                  </div>
                )}
              </Upload>
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                角色形象参考图
              </Text>
            </Col>
            <Col span={12}>
              <div className={styles.expressionUpload}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleExpressionUpload}
                  style={{ display: 'none' }}
                  id="expr-upload"
                />
                <label htmlFor="expr-upload">
                  <Button icon={<PictureOutlined />}>添加表情</Button>
                </label>
                <div className={styles.exprList}>
                  {(expressionImages[editingId || 'new'] || []).map((img, idx) => (
                    <img key={idx} src={img} alt={`expr-${idx}`} className={styles.exprThumb} />
                  ))}
                </div>
              </div>
            </Col>
          </Row>

          <Divider orientation="left">角色一致性</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['consistency', 'seed']} label="随机种子">
                <Input type="number" placeholder="留空自动生成，锁定后保证生成一致" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="种子权重配置（高级）">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">外观权重: <Input type="range" min={0} max={1} step={0.1} /></Text>
                  <Text type="secondary">声音权重: <Input type="range" min={0} max={1} step={0.1} /></Text>
                  <Text type="secondary">行为权重: <Input type="range" min={0} max={1} step={0.1} /></Text>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">语音配置（可选）</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['voice', 'provider']} label="TTS 提供商">
                <Select placeholder="选择语音提供商">
                  <Option value="edge">Edge TTS</Option>
                  <Option value="azure">Azure</Option>
                  <Option value="aliyun">阿里云</Option>
                  <Option value="baidu">百度</Option>
                  <Option value="cosyvoice">CosyVoice</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['voice', 'voiceId']} label="音色 ID">
                <Input placeholder="语音模型 ID" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['voice', 'pitch']} label="音调">
                <Input type="number" step={0.1} min={0.5} max={2} placeholder="0.5-2.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['voice', 'speed']} label="语速">
                <Input type="number" step={0.1} min={0.5} max={2} placeholder="0.5-2.0" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">标签</Divider>

          <Form.Item name="tags" label="角色标签">
            <Select mode="tags" placeholder="添加标签，如：英雄、反派、幽默等">
              <Option value="hero">英雄</Option>
              <Option value="villain">反派</Option>
              <Option value="comic">幽默</Option>
              <Option value="serious">严肃</Option>
              <Option value="mentor">导师</Option>
              <Option value="sidekick">助手</Option>
              <Option value="romance">恋爱</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板库模态框 */}
      <Modal
        title={
          <Space>
            <AppstoreOutlined />
            <span>角色模板库</span>
          </Space>
        }
        open={modalVisible && activeTab === 'template'}
        onCancel={() => {
          setModalVisible(false);
          setSelectedTemplate(null);
        }}
        footer={null}
        width={1000}
      >
        <div style={{ marginBottom: 16 }}>
          <Space align="center">
            <Text strong>分类筛选：</Text>
            <Select 
              value={templateCategory} 
              onChange={setTemplateCategory}
              style={{ width: 150 }}
            >
              <Option value="all">全部</Option>
              <Option value="protagonist">主角</Option>
              <Option value="antagonist">反派</Option>
              <Option value="supporting">配角</Option>
              <Option value="minor">群众角色</Option>
            </Select>
            <Text type="secondary">
              选择模板快速创建符合故事类型的角色
            </Text>
          </Space>
        </div>

        <div className={styles.templateGrid}>
          {getTemplatesByCategory(templateCategory === 'all' ? undefined : templateCategory)
            .map(renderTemplateCard)}
        </div>
      </Modal>

      {/* 模板预览和确认模态框 */}
      <Modal
        title={`使用模板 - ${selectedTemplate?.name}`}
        open={templatePreviewVisible}
        onCancel={() => {
          setTemplatePreviewVisible(false);
          setSelectedTemplate(null);
        }}
        onOk={() => handleUseTemplate()}
        okText="创建角色"
        cancelText="取消"
        width={600}
      >
        {selectedTemplate && (
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <div className={styles.templatePreview}>
                  <Avatar size={80} src={undefined} icon={<UserOutlined />} />
                  <Title level={5} style={{ marginTop: 8 }}>{selectedTemplate.name}</Title>
                  <Tag color="blue">{selectedTemplate.category}</Tag>
                </div>
              </Card>
            </Col>
            <Col span={16}>
              <Collapse defaultActiveKey={['1']}>
                <Panel header="外观信息" key="1">
                  <Space direction="vertical">
                    <Text>性别: {selectedTemplate.appearance.gender}</Text>
                    <Text>年龄: {selectedTemplate.appearance.age}</Text>
                    <Text>发型: {selectedTemplate.appearance.hairStyle}</Text>
                    <Text>发色: {selectedTemplate.appearance.hairColor}</Text>
                    <Text>体型: {selectedTemplate.appearance.bodyType}</Text>
                  </Space>
                </Panel>
                <Panel header="服装装备" key="2">
                  <Space direction="vertical">
                    {selectedTemplate.clothing.map((item, idx) => (
                      <Text key={idx}>{item.type}: {item.name} ({item.color})</Text>
                    ))}
                  </Space>
                </Panel>
                <Panel header="标签" key="3">
                  <Space wrap>
                    {selectedTemplate.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </Panel>
              </Collapse>
              <Divider />
              <Form layout="inline">
                <Form.Item label="角色名称">
                  <Input 
                    placeholder={selectedTemplate.name}
                    style={{ width: 200 }}
                    onChange={(e) => {
                      // 可以在这里处理自定义名称
                    }}
                  />
                </Form.Item>
              </Form>
            </Col>
          </Row>
        )}
      </Modal>
    </div>
  );
};

export default CharacterDesigner;
export type { CharacterDesignerProps };
