/**
 * 分镜协作面板
 * 包含：分镜列表选择、镜头评论、版本管理（保存快照/版本对比/回滚）
 */

import React, { useState } from 'react';

import {
  Button,
  Space,
  List,
  Alert,
  Select,
  Empty,
  Text,
  Title,
  Paragraph,
  Input,
  ListItem,
} from '@/components/ui/ui-components';
import type { FrameComment, StoryboardVersion, VersionDiffSummary } from '@/core/services';
import { collaborationService } from '@/core/services';
import type { StoryboardFrame } from '@/features/storyboard/components/StoryboardEditor';
import { toast } from '@/shared/components/ui/Toast';

import styles from './StoryboardCollaborationPanel.module.less';

export interface StoryboardCollaborationPanelProps {
  projectId: string;
  storyboardFrames: StoryboardFrame[];
  selectedFrameId: string | undefined;
  onSelectFrame: (id: string | undefined) => void;
  /** 持久化分镜数据变更（评论、版本快照） */
  onPersistPatch: (patch: Record<string, unknown>) => void;
  /** 回滚后更新父侧 frames 列表 */
  onFrameUpdate: (frames: StoryboardFrame[]) => void;
}

export const StoryboardCollaborationPanel: React.FC<StoryboardCollaborationPanelProps> = ({
  projectId,
  storyboardFrames,
  selectedFrameId,
  onSelectFrame,
  onPersistPatch,
  onFrameUpdate,
}) => {
  // 评论相关状态
  const [commentDraft, setCommentDraft] = useState('');
  const [storyboardComments, setStoryboardComments] = useState<FrameComment[]>([]);

  // 版本管理状态
  const [storyboardVersions, setStoryboardVersions] = useState<StoryboardVersion[]>([]);
  const [versionLabel, setVersionLabel] = useState('');
  const [compareLeftVersionId, setCompareLeftVersionId] = useState<string | undefined>(undefined);
  const [compareRightVersionId, setCompareRightVersionId] = useState<string | undefined>(undefined);
  const [versionDiff, setVersionDiff] = useState<VersionDiffSummary | null>(null);

  if (storyboardFrames.length === 0) {
    return <Empty description="暂无分镜" image={undefined} />;
  }

  const selectedFrame = storyboardFrames.find((frame) => frame.id === selectedFrameId) ?? null;
  const comments = projectId ? collaborationService.listComments(projectId, selectedFrame?.id) : [];

  // 添加评论
  const handleAddComment = () => {
    if (!projectId || !selectedFrame || !commentDraft.trim()) return;
    collaborationService.addComment({
      projectId,
      frameId: selectedFrame.id,
      content: commentDraft.trim(),
      author: 'current-user',
    });
    const updated = collaborationService.listComments(projectId);
    setStoryboardComments(updated);
    onPersistPatch({ storyboardComments: updated });
    setCommentDraft('');
    toast.success('评论已添加');
  };

  // 保存快照
  const handleSaveVersion = () => {
    if (!projectId) return;
    const version = collaborationService.saveVersion({
      projectId,
      label: versionLabel.trim() || `版本-${new Date().toLocaleTimeString()}`,
      createdBy: 'current-user',
      payload: storyboardFrames,
    });
    const versions = collaborationService.listVersions(projectId);
    setStoryboardVersions(versions);
    onPersistPatch({ storyboardVersions: versions });
    setVersionLabel('');
    toast.success('快照已保存');
  };

  // 版本对比
  const handleCompareVersions = () => {
    if (!compareLeftVersionId || !compareRightVersionId) {
      toast.warning('请选择两个版本进行对比');
      return;
    }
    const diff = collaborationService.diffVersions(compareLeftVersionId, compareRightVersionId);
    setVersionDiff(diff);
  };

  // 回滚
  const handleRollback = () => {
    if (!projectId || !compareLeftVersionId) {
      toast.warning('请选择要回滚的版本');
      return;
    }
    const payload = collaborationService.rollback(projectId, compareLeftVersionId);
    if (!Array.isArray(payload)) {
      toast.error('回滚失败，未找到对应版本');
      return;
    }
    onPersistPatch({ storyboardFrames: payload });
    onFrameUpdate(payload as StoryboardFrame[]);
    toast.success('已回滚到所选版本');
  };

  return (
    <>
      {/* 分镜列表 */}
      <Select
        style={{ width: '100%', marginBottom: 12 }}
        placeholder="选择分镜"
        value={selectedFrameId}
        onChange={(v) => onSelectFrame(v as string | undefined)}
        options={storyboardFrames.map((frame, index) => ({
          label: `${index + 1}. ${frame.title || `分镜 ${index + 1}`}`,
          value: frame.id,
        }))}
      />

      {selectedFrame && (
        <div className={styles.framePreview}>
          <Text strong>{selectedFrame.title || '未命名分镜'}</Text>
          <Text type="secondary">{selectedFrame.sceneDescription || '无场景描述'}</Text>
          <Text type="secondary">
            镜头: {selectedFrame.cameraType || '-'} / 时长: {selectedFrame.duration || 0}s
          </Text>
        </div>
      )}

      {/* 镜头评论 */}
      <div className={styles.section}>
        <Text strong>镜头评论</Text>
        <Space.Compact block style={{ marginTop: 8 }}>
          <Input
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder={selectedFrame ? `对 ${selectedFrame.title} 添加评论` : '先选择分镜'}
            disabled={!selectedFrame}
          />
          <Button
            type="primary"
            onClick={handleAddComment}
            disabled={!selectedFrame || !commentDraft.trim()}
          >
            添加
          </Button>
        </Space.Compact>
        <List
          className={styles.collabList}
          size="small"
          dataSource={comments}
          locale={{ emptyText: '暂无评论' }}
          renderItem={(item: FrameComment) => (
            <ListItem>
              <div>
                <div>{item.content}</div>
                <Text type="secondary">{new Date(item.createdAt).toLocaleString()}</Text>
              </div>
            </ListItem>
          )}
        />
      </div>

      {/* 版本管理 */}
      <div className={styles.section}>
        <Text strong>版本管理</Text>
        <Space wrap style={{ marginTop: 8 }}>
          <Input
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            placeholder="版本标签（可选）"
            style={{ width: 220 }}
          />
          <Button onClick={handleSaveVersion}>保存快照</Button>
        </Space>

        <Space wrap style={{ marginTop: 8 }}>
          <Select
            placeholder="选择版本A"
            value={compareLeftVersionId}
            onChange={(v) => setCompareLeftVersionId(v as string | undefined)}
            style={{ width: 200 }}
            options={storyboardVersions.map((v) => ({ value: v.id, label: v.label }))}
          />
          <Select
            placeholder="选择版本B"
            value={compareRightVersionId}
            onChange={(v) => setCompareRightVersionId(v as string | undefined)}
            style={{ width: 200 }}
            options={storyboardVersions.map((v) => ({ value: v.id, label: v.label }))}
          />
          <Button onClick={handleCompareVersions}>版本差异</Button>
          <Button danger onClick={handleRollback}>
            回滚到版本A
          </Button>
        </Space>

        {versionDiff && (
          <Alert
            type={versionDiff.changeCount > 0 ? 'info' : 'success'}
            showIcon
            message={`差异字段数: ${versionDiff.changeCount}`}
            description={versionDiff.changedKeys.slice(0, 8).join(', ') || '无差异'}
          />
        )}
      </div>
    </>
  );
};
