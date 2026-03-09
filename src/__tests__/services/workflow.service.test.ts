/**
 * 工作流管理器测试
 */

import { CATEGORY_INFO, getNodesByCategory, getNodeTemplate, workflowManager } from '@/components/business/WorkflowEditor/nodeTemplates';

describe('WorkflowEditor nodeTemplates', () => {
  describe('CATEGORY_INFO', () => {
    it('should have input category', () => {
      expect(CATEGORY_INFO.input).toBeDefined();
      expect(CATEGORY_INFO.input.label).toBe('输入');
      expect(CATEGORY_INFO.input.color).toBe('#3b82f6');
    });

    it('should have output category', () => {
      expect(CATEGORY_INFO.output).toBeDefined();
      expect(CATEGORY_INFO.output.label).toBe('输出');
      expect(CATEGORY_INFO.output.color).toBe('#10b981');
    });

    it('should have ai category', () => {
      expect(CATEGORY_INFO.ai).toBeDefined();
      expect(CATEGORY_INFO.ai.label).toBe('AI');
      expect(CATEGORY_INFO.ai.color).toBe('#8b5cf6');
    });

    it('should have video category', () => {
      expect(CATEGORY_INFO.video).toBeDefined();
      expect(CATEGORY_INFO.video.label).toBe('视频');
    });

    it('should have audio category', () => {
      expect(CATEGORY_INFO.audio).toBeDefined();
      expect(CATEGORY_INFO.audio.label).toBe('音频');
    });

    it('should have logic category', () => {
      expect(CATEGORY_INFO.logic).toBeDefined();
      expect(CATEGORY_INFO.logic.label).toBe('逻辑');
    });

    it('should have utility category', () => {
      expect(CATEGORY_INFO.utility).toBeDefined();
      expect(CATEGORY_INFO.utility.label).toBe('工具');
    });
  });

  describe('getNodesByCategory', () => {
    it('should get input nodes', () => {
      const inputNodes = getNodesByCategory('input');
      expect(inputNodes.length).toBeGreaterThan(0);
      expect(inputNodes.every(n => n.category === 'input')).toBe(true);
    });

    it('should get output nodes', () => {
      const outputNodes = getNodesByCategory('output');
      expect(outputNodes.length).toBeGreaterThan(0);
    });

    it('should get ai nodes', () => {
      const aiNodes = getNodesByCategory('ai');
      expect(aiNodes.length).toBeGreaterThan(0);
    });

    it('should get video nodes', () => {
      const videoNodes = getNodesByCategory('video');
      expect(videoNodes.length).toBeGreaterThan(0);
    });

    it('should get audio nodes', () => {
      const audioNodes = getNodesByCategory('audio');
      expect(audioNodes.length).toBeGreaterThan(0);
    });

    it('should get logic nodes', () => {
      const logicNodes = getNodesByCategory('logic');
      expect(logicNodes.length).toBeGreaterThan(0);
    });

    it('should get utility nodes', () => {
      const utilityNodes = getNodesByCategory('utility');
      expect(utilityNodes.length).toBeGreaterThan(0);
    });
  });

  describe('getNodeTemplate', () => {
    it('should get video-input template', () => {
      const template = getNodeTemplate('video-input');
      expect(template).toBeDefined();
      expect(template?.name).toBe('视频输入');
      expect(template?.category).toBe('input');
    });

    it('should get video-export template', () => {
      const template = getNodeTemplate('video-export');
      expect(template).toBeDefined();
      expect(template?.name).toBe('视频导出');
      expect(template?.category).toBe('output');
    });

    it('should get script-generator template', () => {
      const template = getNodeTemplate('script-generator');
      expect(template).toBeDefined();
      expect(template?.category).toBe('ai');
    });

    it('should get delay template', () => {
      const template = getNodeTemplate('delay');
      expect(template).toBeDefined();
      expect(template?.category).toBe('utility');
    });

    it('should get condition template', () => {
      const template = getNodeTemplate('condition');
      expect(template).toBeDefined();
      expect(template?.category).toBe('logic');
    });

    it('should return undefined for unknown type', () => {
      const template = getNodeTemplate('unknown-type');
      expect(template).toBeUndefined();
    });
  });

  describe('workflowManager', () => {
    it('should create workflow', () => {
      const workflow = workflowManager.createWorkflow('测试工作流');
      expect(workflow).toBeDefined();
      expect(workflow.id).toContain('wf_');
      expect(workflow.name).toBe('测试工作流');
      expect(workflow.nodes).toEqual([]);
      expect(workflow.connections).toEqual([]);
    });

    it('should get workflow', () => {
      const created = workflowManager.createWorkflow('获取测试');
      const retrieved = workflowManager.getWorkflow(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('获取测试');
    });

    it('should return null for non-existent workflow', () => {
      const workflow = workflowManager.getWorkflow('non-existent-id');
      expect(workflow).toBeNull();
    });

    it('should update workflow', () => {
      const workflow = workflowManager.createWorkflow('更新测试');
      const updatedWorkflow = {
        ...workflow,
        name: '更新后的名称',
        nodes: [{ id: 'node1', type: 'test', name: 'Test', position: { x: 0, y: 0 }, inputs: [], outputs: [], config: {} }]
      };

      workflowManager.updateWorkflow(workflow.id, updatedWorkflow);
      const retrieved = workflowManager.getWorkflow(workflow.id);

      expect(retrieved?.name).toBe('更新后的名称');
      expect(retrieved?.nodes.length).toBe(1);
    });

    it('should delete workflow', () => {
      const workflow = workflowManager.createWorkflow('删除测试');
      workflowManager.deleteWorkflow(workflow.id);
      const retrieved = workflowManager.getWorkflow(workflow.id);
      expect(retrieved).toBeNull();
    });

    it('should create from template', () => {
      const workflow = workflowManager.createFromTemplate('basic-manga');
      expect(workflow).toBeDefined();
      expect(workflow?.name).toBe('基础漫剧生成');
    });

    it('should return null for unknown template', () => {
      const workflow = workflowManager.createFromTemplate('unknown-template');
      expect(workflow).toBeNull();
    });
  });
});
