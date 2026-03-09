/**
 * 角色数据管理服务
 * 负责角色的增删改查、模板管理、数据持久化等
 */

import { v4 as uuidv4 } from 'uuid';
import type { 
  Character, 
  CharacterAppearance, 
  ClothingItem, 
  CharacterExpression,
  CharacterConsistency 
} from '@/core/types';
import { CHARACTER_TEMPLATES, getTemplateById, getTemplatesByCategory, type CharacterTemplate } from '@/core/data/character-templates';

// 本地存储键
const CHARACTER_STORAGE_KEY = 'man ga-characters';

export interface CharacterServiceOptions {
  projectId?: string;
  autoSave?: boolean;
}

export class CharacterService {
  private characters: Character[] = [];
  private projectId?: string;
  private autoSave: boolean;
  private listeners: Array<(characters: Character[]) => void> = [];

  constructor(options: CharacterServiceOptions = {}) {
    this.projectId = options.projectId;
    this.autoSave = options.autoSave ?? true;
    this.loadFromStorage();
  }

  /**
   * 获取所有角色
   */
  getAll(): Character[] {
    return [...this.characters];
  }

  /**
   * 根据ID获取角色
   */
  getById(id: string): Character | undefined {
    return this.characters.find(c => c.id === id);
  }

  /**
   * 根据角色定位筛选
   */
  getByRole(role: Character['role']): Character[] {
    return this.characters.filter(c => c.role === role);
  }

  /**
   * 根据标签筛选
   */
  getByTag(tag: string): Character[] {
    return this.characters.filter(c => c.tags.includes(tag));
  }

  /**
   * 创建新角色
   */
  create(characterData: Partial<Character> & { 
    name: string; 
    appearance: CharacterAppearance;
  }): Character {
    const now = new Date().toISOString();
    const seed = characterData.consistency?.seed ?? Math.floor(Math.random() * 10000);

    const character: Character = {
      id: characterData.id || uuidv4(),
      name: characterData.name,
      role: characterData.role || 'supporting',
      description: characterData.description || '',
      appearance: characterData.appearance,
      clothing: characterData.clothing || [],
      expressions: characterData.expressions || [],
      consistency: {
        seed,
        weights: characterData.consistency?.weights,
        referenceImages: characterData.consistency?.referenceImages,
      },
      voice: characterData.voice,
      tags: characterData.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    this.characters.push(character);
    this.notifyChange();
    this.saveToStorage();
    
    return character;
  }

  /**
   * 从模板创建角色
   */
  createFromTemplate(
    templateId: string, 
    overrides?: Partial<CharacterAppearance & { name: string; description: string }>
  ): Character | null {
    const template = getTemplateById(templateId);
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }

    return this.create({
      ...overrides,
      ...templateToCharacterData(template, overrides),
    });
  }

  /**
   * 更新角色
   */
  update(id: string, updates: Partial<Character>): Character | null {
    const index = this.characters.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.characters[index] = {
      ...this.characters[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.notifyChange();
    this.saveToStorage();
    
    return this.characters[index];
  }

  /**
   * 删除角色
   */
  delete(id: string): boolean {
    const index = this.characters.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.characters.splice(index, 1);
    this.notifyChange();
    this.saveToStorage();
    
    return true;
  }

  /**
   * 批量创建角色
   */
  bulkCreate(characters: Array<Partial<Character> & { name: string; appearance: CharacterAppearance }>): Character[] {
    const now = new Date().toISOString();
    
    const newCharacters = characters.map(data => ({
      id: data.id || uuidv4(),
      name: data.name,
      role: data.role || 'supporting',
      description: data.description || '',
      appearance: data.appearance,
      clothing: data.clothing || [],
      expressions: data.expressions || [],
      consistency: {
        seed: data.consistency?.seed ?? Math.floor(Math.random() * 10000),
        weights: data.consistency?.weights,
        referenceImages: data.consistency?.referenceImages,
      },
      voice: data.voice,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    }));

    this.characters.push(...newCharacters);
    this.notifyChange();
    this.saveToStorage();
    
    return newCharacters;
  }

  /**
   * 复制角色
   */
  duplicate(id: string): Character | null {
    const original = this.getById(id);
    if (!original) return null;

    const duplicate: Character = {
      ...original,
      id: uuidv4(),
      name: `${original.name} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      consistency: {
        ...original.consistency,
        seed: Math.floor(Math.random() * 10000), // 新种子
      },
    };

    this.characters.push(duplicate);
    this.notifyChange();
    this.saveToStorage();
    
    return duplicate;
  }

  /**
   * 替换角色图片/参考图
   */
  updateReferenceImage(id: string, imageUrl: string): boolean {
    const char = this.getById(id);
    if (!char) return false;

    const updated = this.update(id, {
      consistency: {
        ...char.consistency,
        referenceImages: [
          ...(char.consistency.referenceImages || []),
          imageUrl,
        ],
      },
    });

    return updated !== null;
  }

  /**
   * 锁定/解锁角色种子（确保一致性）
   */
  lockConsistency(id: string, lock: boolean): boolean {
    const char = this.getById(id);
    if (!char) return false;

    if (lock && !char.consistency.seed) {
      const updated = this.update(id, {
        consistency: {
          ...char.consistency,
          seed: Math.floor(Math.random() * 10000),
        },
      });
      return updated !== null;
    }

    return true;
  }

  /**
   * 导出所有角色数据
   */
  export(): string {
    return JSON.stringify(this.characters, null, 2);
  }

  /**
   * 导入角色数据
   */
  import(jsonData: string): Character[] {
    try {
      const imported = JSON.parse(jsonData) as Character[];
      
      // 验证数据格式
      const validCharacters = imported.filter(char => 
        char.id && char.name && char.appearance
      );

      this.characters = [...this.characters, ...validCharacters];
      this.notifyChange();
      this.saveToStorage();
      
      return validCharacters;
    } catch (error) {
      console.error('Failed to import characters:', error);
      return [];
    }
  }

  /**
   * 清空所有角色
   */
  clear(): void {
    this.characters = [];
    this.notifyChange();
    this.saveToStorage();
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      const storageKey = this.projectId 
        ? `${CHARACTER_STORAGE_KEY}-${this.projectId}`
        : CHARACTER_STORAGE_KEY;
      
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        this.characters = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load characters from storage:', error);
      this.characters = [];
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    if (!this.autoSave) return;

    try {
      const storageKey = this.projectId 
        ? `${CHARACTER_STORAGE_KEY}-${this.projectId}`
        : CHARACTER_STORAGE_KEY;
      
      localStorage.setItem(storageKey, JSON.stringify(this.characters));
    } catch (error) {
      console.error('Failed to save characters to storage:', error);
    }
  }

  /**
   * 订阅角色变更
   */
  subscribe(listener: (characters: Character[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有订阅者
   */
  private notifyChange(): void {
    this.listeners.forEach(listener => listener(this.characters));
  }

  /**
   * 获取可用模板
   */
  static getTemplates(category?: string): CharacterTemplate[] {
    return getTemplatesByCategory(category);
  }

  /**
   * 获取模板数量
   */
  static getTemplateCount(): number {
    return CHARACTER_TEMPLATES.length;
  }

  /**
   * 验证角色数据
   */
  static validate(character: Partial<Character>): string[] {
    const errors: string[] = [];

    if (!character.name) {
      errors.push('角色名称不能为空');
    }
    
    if (!character.appearance) {
      errors.push('外观配置不能为空');
    } else {
      if (!character.appearance.gender) {
        errors.push('性别必须指定');
      }
      if (!character.appearance.age || character.appearance.age < 1 || character.appearance.age > 120) {
        errors.push('年龄必须在 1-120 之间');
      }
    }

    return errors;
  }
}

// 辅助函数：将模板转换为角色数据
function templateToCharacterData(
  template: CharacterTemplate,
  overrides?: Partial<CharacterAppearance & { name: string; description: string }>
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: overrides?.name || template.name,
    role: template.category as any,
    description: overrides?.description || template.description,
    appearance: { ...template.appearance, ...overrides },
    clothing: template.clothing,
    expressions: template.expressions,
    consistency: { ...template.consistency },
    voice: template.recommendedVoice,
    tags: template.tags,
  };
}

// 默认导出单例
let characterServiceInstance: CharacterService | null = null;

export function getCharacterService(options?: CharacterServiceOptions): CharacterService {
  if (!characterServiceInstance) {
    characterServiceInstance = new CharacterService(options);
  }
  return characterServiceInstance;
}

export function resetCharacterService(): void {
  characterServiceInstance = null;
}
