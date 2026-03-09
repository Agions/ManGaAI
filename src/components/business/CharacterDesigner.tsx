import React, { useState } from 'react';
import {
  Card,
  List,
  Button,
  Input,
  Select,
  Typography,
  Space,
  Avatar,
  Tag,
  Empty,
  Popconfirm,
  Divider,
  ColorPicker,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  EditOutlined,
  CopyOutlined,
  StarOutlined,
  HeartOutlined,
  ThunderboltOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined
} from '@ant-design/icons';
import styles from './CharacterDesigner.module.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 角色类型选项
const ROLE_OPTIONS = [
  { value: 'protagonist', label: '主角', color: 'gold' },
  { value: 'supporting', label: '配角', color: 'blue' },
  { value: 'antagonist', label: '反派', color: 'red' },
  { value: 'love_interest', label: '恋人', color: 'pink' },
  { value: 'mentor', label: '导师', color: 'purple' },
  { value: 'sidekick', label: '助手', color: 'cyan' },
  { value: 'minor', label: '配角', color: 'default' }
];

// 预设表情选项
const EXPRESSION_OPTIONS = [
  { value: 'happy', label: '开心', icon: <SmileOutlined /> },
  { value: 'neutral', label: '平静', icon: <MehOutlined /> },
  { value: 'sad', label: '悲伤', icon: <FrownOutlined /> },
  { value: 'angry', label: '愤怒', icon: <ThunderboltOutlined /> },
  { value: 'surprised', label: '惊讶', icon: <StarOutlined /> },
  { value: 'loving', label: '喜爱', icon: <HeartOutlined /> }
];

export interface Character {
  id: string;
  name: string;
  description: string;
  appearance: string;
  clothing: string;
  expressions: string[];
  role: string;
  imageUrl?: string;
  hairColor?: string;
  eyeColor?: string;
  skinTone?: string;
  personality?: string;
  background?: string;
}

interface CharacterDesignerProps {
  initialCharacters?: Character[];
  onChange?: (characters: Character[]) => void;
  onCharacterSelect?: (character: Character | null) => void;
}

const CharacterDesigner: React.FC<CharacterDesignerProps> = ({
  initialCharacters = [],
  onChange,
  onCharacterSelect
}) => {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    initialCharacters.length > 0 ? initialCharacters[0] : null
  );
  const [editingKey, setEditingKey] = useState<string>('');

  // 生成唯一ID
  const generateId = () => `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 添加角色
  const addCharacter = () => {
    const newCharacter: Character = {
      id: generateId(),
      name: `角色 ${characters.length + 1}`,
      description: '',
      appearance: '',
      clothing: '',
      expressions: ['happy', 'neutral'],
      role: 'supporting',
      hairColor: '#2C1810',
      eyeColor: '#4A90D9',
      skinTone: '#F5D0C5',
      personality: '',
      background: ''
    };

    const updatedCharacters = [...characters, newCharacter];
    setCharacters(updatedCharacters);
    setSelectedCharacter(newCharacter);
    onChange?.(updatedCharacters);
    onCharacterSelect?.(newCharacter);
  };

  // 删除角色
  const removeCharacter = (id: string) => {
    const updatedCharacters = characters.filter((c) => c.id !== id);
    setCharacters(updatedCharacters);

    if (selectedCharacter?.id === id) {
      setSelectedCharacter(updatedCharacters.length > 0 ? updatedCharacters[0] : null);
      onCharacterSelect?.(updatedCharacters.length > 0 ? updatedCharacters[0] : null);
    }
    onChange?.(updatedCharacters);
  };

  // 更新角色
  const updateCharacter = (id: string, field: keyof Character, value: Character[keyof Character]) => {
    const updatedCharacters = characters.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    );
    setCharacters(updatedCharacters);

    if (selectedCharacter?.id === id) {
      const updated = updatedCharacters.find((c) => c.id === id);
      setSelectedCharacter(updated || null);
      onCharacterSelect?.(updated || null);
    }
    onChange?.(updatedCharacters);
  };

  // 复制角色
  const duplicateCharacter = (character: Character) => {
    const newCharacter: Character = {
      ...character,
      id: generateId(),
      name: `${character.name} (副本)`
    };
    const updatedCharacters = [...characters, newCharacter];
    setCharacters(updatedCharacters);
    setSelectedCharacter(newCharacter);
    onChange?.(updatedCharacters);
    onCharacterSelect?.(newCharacter);
  };

  // 获取角色类型标签颜色
  const getRoleTagColor = (role: string) => {
    const option = ROLE_OPTIONS.find((opt) => opt.value === role);
    return option?.color || 'default';
  };

  // 获取角色类型标签文字
  const getRoleTagLabel = (role: string) => {
    const option = ROLE_OPTIONS.find((opt) => opt.value === role);
    return option?.label || role;
  };

  // 选中角色
  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    onCharacterSelect?.(character);
  };

  return (
    <div className={styles.container}>
      {/* 左侧角色列表 */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Title level={5} className={styles.sidebarTitle}>
            角色列表
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addCharacter}
            size="small"
          >
            添加角色
          </Button>
        </div>

        <div className={styles.characterList}>
          {characters.length === 0 ? (
            <Empty
              description="暂无角色"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={styles.emptyState}
            />
          ) : (
            <List
              dataSource={characters}
              renderItem={(character) => (
                <List.Item
                  className={`${styles.characterItem} ${
                    selectedCharacter?.id === character.id ? styles.selected : ''
                  }`}
                  onClick={() => handleSelectCharacter(character)}
                >
                  <div className={styles.characterItemContent}>
                    <Avatar
                      size={40}
                      src={character.imageUrl}
                      icon={!character.imageUrl && <UserOutlined />}
                      style={{
                        backgroundColor: character.skinTone || '#f0f0f0'
                      }}
                    />
                    <div className={styles.characterInfo}>
                      <Text strong className={styles.characterName}>
                        {character.name}
                      </Text>
                      <Tag color={getRoleTagColor(character.role)} className={styles.roleTag}>
                        {getRoleTagLabel(character.role)}
                      </Tag>
                    </div>
                  </div>
                  <div className={styles.characterActions}>
                    <Tooltip title="复制">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateCharacter(character);
                        }}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="确定删除此角色?"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        removeCharacter(character.id);
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
                </List.Item>
              )}
            />
          )}
        </div>

        <div className={styles.sidebarFooter}>
          <Text type="secondary">共 {characters.length} 个角色</Text>
        </div>
      </div>

      {/* 中间角色预览 */}
      <div className={styles.preview}>
        {selectedCharacter ? (
          <>
            <div className={styles.avatarPreview}>
              <Avatar
                size={160}
                src={selectedCharacter.imageUrl}
                icon={!selectedCharacter.imageUrl && <UserOutlined />}
                style={{
                  backgroundColor: selectedCharacter.skinTone || '#f0f0f0',
                  border: `4px solid ${selectedCharacter.hairColor || '#ddd'}`
                }}
              />
              {selectedCharacter.imageUrl && (
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  className={styles.changeAvatarBtn}
                >
                  更换头像
                </Button>
              )}
            </div>

            <div className={styles.previewInfo}>
              <Title level={3} className={styles.previewName}>
                {selectedCharacter.name}
              </Title>
              <Tag color={getRoleTagColor(selectedCharacter.role)} className={styles.previewRoleTag}>
                {getRoleTagLabel(selectedCharacter.role)}
              </Tag>
            </div>

            <Divider className={styles.previewDivider} />

            <div className={styles.colorSettings}>
              <Text strong>角色配色</Text>
              <div className={styles.colorRow}>
                <div className={styles.colorItem}>
                  <Text type="secondary">发色</Text>
                  <ColorPicker
                    value={selectedCharacter.hairColor}
                    onChange={(color) =>
                      updateCharacter(selectedCharacter.id, 'hairColor', color.toHexString())
                    }
                    size="small"
                  />
                </div>
                <div className={styles.colorItem}>
                  <Text type="secondary">瞳色</Text>
                  <ColorPicker
                    value={selectedCharacter.eyeColor}
                    onChange={(color) =>
                      updateCharacter(selectedCharacter.id, 'eyeColor', color.toHexString())
                    }
                    size="small"
                  />
                </div>
                <div className={styles.colorItem}>
                  <Text type="secondary">肤色</Text>
                  <ColorPicker
                    value={selectedCharacter.skinTone}
                    onChange={(color) =>
                      updateCharacter(selectedCharacter.id, 'skinTone', color.toHexString())
                    }
                    size="small"
                  />
                </div>
              </div>
            </div>

            <Divider className={styles.previewDivider} />

            <div className={styles.expressionsPreview}>
              <Text strong>表情预览</Text>
              <div className={styles.expressionTags}>
                {selectedCharacter.expressions.map((expr) => {
                  const exprOption = EXPRESSION_OPTIONS.find((e) => e.value === expr);
                  return (
                    <Tag key={expr} icon={exprOption?.icon} className={styles.expressionTag}>
                      {exprOption?.label || expr}
                    </Tag>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <Empty
            description="选择一个角色进行编辑"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className={styles.emptyPreview}
          />
        )}
      </div>

      {/* 右侧属性编辑 */}
      <div className={styles.editor}>
        {selectedCharacter ? (
          <>
            <div className={styles.editorHeader}>
              <Title level={5}>角色属性</Title>
            </div>

            <div className={styles.editorContent}>
              {/* 基本信息 */}
              <div className={styles.formSection}>
                <Text strong className={styles.sectionTitle}>
                  基本信息
                </Text>

                <div className={styles.formGroup}>
                  <Text type="secondary">角色名称</Text>
                  <Input
                    value={selectedCharacter.name}
                    onChange={(e) =>
                      updateCharacter(selectedCharacter.id, 'name', e.target.value)
                    }
                    placeholder="输入角色名称"
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">角色类型</Text>
                  <Select
                    value={selectedCharacter.role}
                    onChange={(value) => updateCharacter(selectedCharacter.id, 'role', value)}
                    options={ROLE_OPTIONS}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">角色描述</Text>
                  <TextArea
                    value={selectedCharacter.description}
                    onChange={(e) =>
                      updateCharacter(selectedCharacter.id, 'description', e.target.value)
                    }
                    placeholder="简要描述这个角色"
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">性格特点</Text>
                  <TextArea
                    value={selectedCharacter.personality}
                    onChange={(e) =>
                      updateCharacter(selectedCharacter.id, 'personality', e.target.value)
                    }
                    placeholder="描述角色的性格特点"
                    rows={2}
                  />
                </div>
              </div>

              <Divider />

              {/* 外观特征 */}
              <div className={styles.formSection}>
                <Text strong className={styles.sectionTitle}>
                  外观特征
                </Text>

                <div className={styles.formGroup}>
                  <Text type="secondary">外貌描述</Text>
                  <TextArea
                    value={selectedCharacter.appearance}
                    onChange={(e) =>
                      updateCharacter(selectedCharacter.id, 'appearance', e.target.value)
                    }
                    placeholder="描述角色的身高、体型、面部特征等"
                    rows={3}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Text type="secondary">发型与发色</Text>
                  <Input
                    value={selectedCharacter.hairColor}
                    onChange={(e) =>
                      updateCharacter(selectedCharacter.id, 'hairColor', e.target.value)
                    }
                    placeholder="如：黑色短发、金色长发"
                  />
                </div>
              </div>

              <Divider />

              {/* 服装设计 */}
              <div className={styles.formSection}>
                <Text strong className={styles.sectionTitle}>
                  服装设计
                </Text>

                <div className={styles.formGroup}>
                  <Text type="secondary">服装描述</Text>
                  <TextArea
                    value={selectedCharacter.clothing}
                    onChange={(e) =>
                      updateCharacter(selectedCharacter.id, 'clothing', e.target.value)
                    }
                    rows={3}
                    placeholder="描述角色的服装风格和常见穿搭"
                  />
                </div>
              </div>

              <Divider />

              {/* 表情设定 */}
              <div className={styles.formSection}>
                <Text strong className={styles.sectionTitle}>
                  表情设定
                </Text>

                <div className={styles.formGroup}>
                  <Text type="secondary">常用表情</Text>
                  <Select
                    mode="multiple"
                    value={selectedCharacter.expressions}
                    onChange={(values) =>
                      updateCharacter(selectedCharacter.id, 'expressions', values)
                    }
                    options={EXPRESSION_OPTIONS}
                    placeholder="选择角色常用的表情"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <Divider />

              {/* 背景设定 */}
              <div className={styles.formSection}>
                <Text strong className={styles.sectionTitle}>
                  背景设定
                </Text>

                <div className={styles.formGroup}>
                  <Text type="secondary">角色背景</Text>
                  <TextArea
                    value={selectedCharacter.background}
                    onChange={(e) =>
                      updateCharacter(selectedCharacter.id, 'background', e.target.value)
                    }
                    placeholder="描述角色的背景故事、经历等"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <Empty
            description="请选择一个角色进行编辑"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className={styles.emptyEditor}
          />
        )}
      </div>
    </div>
  );
};

export default CharacterDesigner;
