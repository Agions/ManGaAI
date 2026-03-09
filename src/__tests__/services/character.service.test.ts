/**
 * CharacterService 单元测试
 */

import { CharacterService } from '@/core/services/character.service';
import type { CharacterAppearance, Character } from '@/core/types';

describe('CharacterService', () => {
  let service: CharacterService;

  beforeEach(() => {
    // 重置服务实例
    const { resetCharacterService } = require('@/core/services/character.service');
    resetCharacterService();
    service = new CharacterService({ projectId: 'test-project', autoSave: false });
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('create', () => {
    it('应该成功创建新角色', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        age: 25,
        hairStyle: '短发',
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      const character = service.create({
        name: '测试角色',
        appearance,
      });

      expect(character).toBeDefined();
      expect(character.id).toBeDefined();
      expect(character.name).toBe('测试角色');
      expect(character.appearance).toEqual(appearance);
      expect(character.consistency.seed).toBeDefined();
      expect(character.createdAt).toBeDefined();
    });

    it('应该支持自定义字段', () => {
      const appearance: CharacterAppearance = {
        gender: 'female',
        age: 20,
        hairStyle: '长发',
        hairColor: '#4a2c2a',
        eyeColor: '#5d4037',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      const character = service.create({
        name: '女主',
        role: 'protagonist',
        description: '女主角描述',
        appearance,
        tags: ['女主', '年轻'],
      });

      expect(character.role).toBe('protagonist');
      expect(character.description).toBe('女主角描述');
      expect(character.tags).toContain('女主');
    });
  });

  describe('getAll', () => {
    it('应该返回所有角色', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        age: 25,
        hairStyle: '短发',
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      service.create({ name: '角色1', appearance });
      service.create({ name: '角色2', appearance });

      const all = service.getAll();
      expect(all.length).toBe(2);
    });
  });

  describe('getById', () => {
    it('应该根据ID获取角色', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        age: 25,
        hairStyle: '短发',
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      const character = service.create({ name: '测试', appearance });
      const found = service.getById(character.id);

      expect(found).toBeDefined();
      expect(found?.name).toBe('测试');
    });

    it('不存在的ID应该返回undefined', () => {
      const found = service.getById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('update', () => {
    it('应该成功更新角色', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        age: 25,
        hairStyle: '短发',
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      const character = service.create({ name: '原始名称', appearance });
      const updated = service.update(character.id, { name: '新名称' });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('新名称');
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(character.updatedAt).getTime());
    });

    it('不存在的ID应该返回null', () => {
      const result = service.update('non-existent', { name: '新名称' });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('应该成功删除角色', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        age: 25,
        hairStyle: '短发',
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      const character = service.create({ name: '待删除', appearance });
      const result = service.delete(character.id);

      expect(result).toBe(true);
      expect(service.getById(character.id)).toBeUndefined();
    });

    it('删除不存在的ID应该返回false', () => {
      const result = service.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('duplicate', () => {
    it('应该成功复制角色', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        age: 25,
        hairStyle: '短发',
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      const original = service.create({ name: '原始', appearance });
      const duplicate = service.duplicate(original.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate?.name).toContain('副本');
      expect(duplicate?.id).not.toBe(original.id);
      expect(duplicate?.consistency.seed).not.toBe(original.consistency.seed);
    });
  });

  describe('createFromTemplate', () => {
    it('应该从模板创建角色', () => {
      const character = service.createFromTemplate('template_hero_male_01', {
        name: '自定义主角',
      });

      expect(character).not.toBeNull();
      expect(character?.name).toBe('自定义主角');
      expect(character?.role).toBe('protagonist');
      expect(character?.appearance.gender).toBe('male');
      expect(character?.consistency.seed).toBeDefined();
    });

    it('不存在的模板应该返回null', () => {
      const character = service.createFromTemplate('non-existent-template');
      expect(character).toBeNull();
    });
  });

  describe('export/import', () => {
    it('应该正确导出和导入角色数据', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        age: 25,
        hairStyle: '短发',
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      service.create({ name: '角色A', appearance });
      service.create({ name: '角色B', appearance });

      const exported = service.export();
      expect(exported).toContain('角色A');
      expect(exported).toContain('角色B');

      service.clear();
      expect(service.getAll()).toHaveLength(0);

      const imported = service.import(exported);
      expect(imported.length).toBe(2);
      expect(service.getAll()).toHaveLength(2);
    });
  });

  describe('subscribe', () => {
    it('应该在变更时通知订阅者', () => {
      const appearance: CharacterAppearance = {
        gender: 'male',
        age: 25,
        hairStyle: '短发',
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#f5d0c5',
        bodyType: 'average',
      };

      const mockListener = jest.fn();
      service.subscribe(mockListener);

      service.create({ name: '角色1', appearance });
      expect(mockListener).toHaveBeenCalled();

      const characters = mockListener.mock.calls[mockListener.mock.calls.length - 1][0];
      expect(Array.isArray(characters)).toBe(true);
    });
  });
});
