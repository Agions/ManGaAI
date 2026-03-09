/**
 * 时间轴 Hook
 */

import { useState, useRef, useCallback } from 'react';
import type { ScriptSegment } from '@/core/types';
import type { SegmentStyleProps, DragState } from '../types';

interface UseTimelineOptions {
  duration: number;
  segments: ScriptSegment[];
  onSegmentsChange?: (segments: ScriptSegment[]) => void;
}

interface UseTimelineReturn {
  // State
  editedSegments: ScriptSegment[];
  selectedSegment: ScriptSegment | null;
  dragState: DragState;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  // Computed
  getSegmentStyle: (segment: ScriptSegment) => SegmentStyleProps;
  // Actions
  setSelectedSegment: (segment: ScriptSegment | null) => void;
  handleDragStart: (segmentId: string, type: 'move' | 'start' | 'end', e: React.MouseEvent) => void;
  handleSegmentClick: (segment: ScriptSegment) => void;
  // Getters
  getTimeFromPosition: (clientX: number) => number;
}

export const useTimeline = ({ duration, segments, onSegmentsChange }: UseTimelineOptions): UseTimelineReturn => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [editedSegments, setEditedSegments] = useState<ScriptSegment[]>(segments);
  const [selectedSegment, setSelectedSegment] = useState<ScriptSegment | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: null,
    dragSegmentId: null
  });

  // 当 segments 变化时更新 editedSegments
  if (JSON.stringify(editedSegments) !== JSON.stringify(segments)) {
    // Only update if they're actually different
    const shouldUpdate = segments.some((s, i) =>
      !editedSegments[i] ||
      s.id !== editedSegments[i].id ||
      s.startTime !== editedSegments[i].startTime ||
      s.endTime !== editedSegments[i].endTime
    );
    if (shouldUpdate && editedSegments.length !== segments.length) {
      setEditedSegments(segments);
    }
  }

  // 计算片段样式
  const getSegmentStyle = useCallback((segment: ScriptSegment): SegmentStyleProps => {
    const left = `${(segment.startTime / duration) * 100}%`;
    const width = `${((segment.endTime - segment.startTime) / duration) * 100}%`;

    let color = '#1890ff'; // 默认为蓝色（旁白）
    if (segment.type === 'dialogue') {
      color = '#52c41a'; // 对话为绿色
    } else if (segment.type === 'narration') {
      color = '#fa8c16'; // 旁白为橙色
    }

    return { left, width, color };
  }, [duration]);

  // 从位置获取时间
  const getTimeFromPosition = useCallback((clientX: number): number => {
    if (!timelineRef.current) return 0;

    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));

    return percentage * duration;
  }, [duration]);

  // 点击片段
  const handleSegmentClick = useCallback((segment: ScriptSegment) => {
    setSelectedSegment(segment);
  }, []);

  // 拖拽移动 - 使用 useRef 保存最新状态
  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const handleDragMove = useCallback((e: MouseEvent) => {
    const { isDragging, dragSegmentId, dragType } = dragStateRef.current;
    if (!isDragging || !dragSegmentId || !dragType) return;

    const currentTime = getTimeFromPosition(e.clientX);

    setEditedSegments(prev =>
      prev.map(segment => {
        if (segment.id !== dragSegmentId) return segment;

        const original = segment;
        let newStart = original.startTime;
        let newEnd = original.endTime;

        switch (dragType) {
          case 'move': {
            const segmentDuration = original.endTime - original.startTime;
            newStart = currentTime;
            newEnd = currentTime + segmentDuration;

            if (newStart < 0) {
              newStart = 0;
              newEnd = segmentDuration;
            }
            if (newEnd > duration) {
              newEnd = duration;
              newStart = newEnd - segmentDuration;
            }
            break;
          }
          case 'start': {
            newStart = Math.min(currentTime, original.endTime - 0.5);
            newStart = Math.max(0, newStart);
            break;
          }
          case 'end': {
            newEnd = Math.max(currentTime, original.startTime + 0.5);
            newEnd = Math.min(duration, newEnd);
            break;
          }
        }

        return {
          ...segment,
          startTime: newStart,
          endTime: newEnd
        };
      })
    );
  }, [duration, getTimeFromPosition]);

  // 结束拖拽
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: null,
      dragSegmentId: null
    });

    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);

    // 通知父组件
    if (onSegmentsChange) {
      onSegmentsChange(editedSegments);
    }
  }, [handleDragMove, editedSegments, onSegmentsChange]);

  // 开始拖拽
  const handleDragStart = useCallback((segmentId: string, type: 'move' | 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    setDragState({
      isDragging: true,
      dragType: type,
      dragSegmentId: segmentId
    });

    // 添加全局拖拽事件监听
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [handleDragMove, handleDragEnd]);

  return {
    editedSegments,
    selectedSegment,
    dragState,
    timelineRef,
    getSegmentStyle,
    setSelectedSegment,
    handleDragStart,
    handleSegmentClick,
    getTimeFromPosition
  };
};

export default useTimeline;
