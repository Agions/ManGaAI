import {
  groupMaterials,
  MaterialGroup,
  GroupingOptions,
  MaterialMatch,
  MaterialItem,
} from '../../../features/manga-pipeline/steps/step3-material-matching/services/grouper';

const createMockMaterialItem = (id: string): MaterialItem => ({
  id,
  type: 'video',
  source: 'pixabay',
  tags: ['tag1', 'tag2'],
});

const createMockMaterialMatch = (overrides: Partial<MaterialMatch> = {}): MaterialMatch => ({
  sceneId: 'scene-001',
  sceneNumber: 1,
  emotion: 'neutral', // 新增必填字段
  matches: [createMockMaterialItem('mat-001')],
  fallback: 'stock footage',
  confidence: 0.8,
  ...overrides,
});

describe('SmartGrouper', () => {
  describe('groupMaterials', () => {
    it('should return empty array when given empty matches', () => {
      const results = groupMaterials([]);
      expect(results).toEqual([]);
    });

    it('should group scenes by emotion and location', () => {
      const matches = [
        createMockMaterialMatch({ sceneId: 'scene-001', sceneNumber: 1 }),
        createMockMaterialMatch({ sceneId: 'scene-002', sceneNumber: 2 }),
        createMockMaterialMatch({ sceneId: 'scene-003', sceneNumber: 3 }),
      ];
      const groups = groupMaterials(matches);
      expect(groups.length).toBeGreaterThan(0);
    });

    it('should include groupId, theme, scenes, materials, and continuityScore', () => {
      const matches = [createMockMaterialMatch({ sceneId: 'scene-001', sceneNumber: 1 })];
      const groups = groupMaterials(matches);
      expect(groups[0]).toHaveProperty('groupId');
      expect(groups[0]).toHaveProperty('theme');
      expect(groups[0]).toHaveProperty('scenes');
      expect(groups[0]).toHaveProperty('materials');
      expect(groups[0]).toHaveProperty('continuityScore');
    });

    it('should respect maxGroupSize option', () => {
      const matches = [
        createMockMaterialMatch({ sceneId: 'scene-001', sceneNumber: 1, emotion: 'tense' }),
        createMockMaterialMatch({ sceneId: 'scene-002', sceneNumber: 2, emotion: 'tense' }),
        createMockMaterialMatch({ sceneId: 'scene-003', sceneNumber: 3, emotion: 'sad' }),
        createMockMaterialMatch({ sceneId: 'scene-004', sceneNumber: 4, emotion: 'sad' }),
        createMockMaterialMatch({ sceneId: 'scene-005', sceneNumber: 5, emotion: 'happy' }),
        createMockMaterialMatch({ sceneId: 'scene-006', sceneNumber: 6, emotion: 'happy' }),
      ];
      const groups = groupMaterials(matches, { maxGroupSize: 3 });
      // After merging small groups, total scenes should be preserved
      const totalScenesInGroups = groups.reduce((sum, g) => sum + g.scenes.length, 0);
      expect(totalScenesInGroups).toBe(6);
      // Individual groups should have reasonable sizes (not all merged into one)
      expect(groups.length).toBeGreaterThan(1);
    });

    it('should calculate continuity score between 0 and 1', () => {
      const matches = [
        createMockMaterialMatch({ sceneId: 'scene-001', sceneNumber: 1 }),
        createMockMaterialMatch({ sceneId: 'scene-002', sceneNumber: 2 }),
      ];
      const groups = groupMaterials(matches);
      groups.forEach((group) => {
        expect(group.continuityScore).toBeGreaterThanOrEqual(0);
        expect(group.continuityScore).toBeLessThanOrEqual(1);
      });
    });

    it('should merge small groups when configured', () => {
      const matches = [
        createMockMaterialMatch({ sceneId: 'scene-001', sceneNumber: 1 }),
        createMockMaterialMatch({ sceneId: 'scene-002', sceneNumber: 2 }),
      ];
      const groups = groupMaterials(matches, { maxGroupSize: 5 });
      // Small groups should be merged
      expect(groups.length).toBeLessThanOrEqual(matches.length);
    });

    it('should handle matches with no materials', () => {
      const matches = [
        createMockMaterialMatch({ sceneId: 'scene-001', sceneNumber: 1, matches: [] }),
      ];
      const groups = groupMaterials(matches);
      expect(groups).toHaveLength(1);
      expect(groups[0].materials).toEqual([]);
    });

    it('should deduplicate materials within a group', () => {
      // When same material ID appears multiple times in a single match, it should be deduplicated
      const matches = [
        createMockMaterialMatch({
          sceneId: 'scene-001',
          sceneNumber: 1,
          matches: [createMockMaterialItem('mat-001'), createMockMaterialItem('mat-001')],
        }),
      ];
      const groups = groupMaterials(matches);
      // mat-001 appears twice but should only be counted once
      const mat001Count = groups[0].materials.filter((m) => m.id === 'mat-001').length;
      expect(mat001Count).toBe(1);
    });
  });
});
