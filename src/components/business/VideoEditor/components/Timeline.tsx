/**
 * 时间轴组件
 */

import React from 'react';
import { Tooltip } from 'antd';
import type { ScriptSegment } from '@/core/types';
import type { SegmentStyleProps } from '../types';
import styles from './Timeline.module.less';

interface TimelineProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
  segments: ScriptSegment[];
  selectedSegment: ScriptSegment | null;
  getSegmentStyle: (segment: ScriptSegment) => SegmentStyleProps;
  onSegmentClick: (segment: ScriptSegment) => void;
  onDragStart: (segmentId: string, type: 'move' | 'start' | 'end', e: React.MouseEvent) => void;
  formatTime: (time: number) => string;
}

export const Timeline: React.FC<TimelineProps> = ({
  timelineRef,
  segments,
  selectedSegment,
  getSegmentStyle,
  onSegmentClick,
  onDragStart,
  formatTime
}) => {
  return (
    <div className={styles.timelineContainer} ref={timelineRef}>
      {segments.map((segment, index) => {
        const { left, width, color } = getSegmentStyle(segment);
        return (
          <Tooltip
            key={segment.id}
            title={`${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}: ${segment.content.substring(0, 50)}${segment.content.length > 50 ? '...' : ''}`}
          >
            <div
              className={`${styles.segmentMarker} ${selectedSegment?.id === segment.id ? styles.selected : ''}`}
              style={{ left, width, backgroundColor: color }}
              onClick={() => onSegmentClick(segment)}
            >
              <div
                className={styles.segmentResizeHandle}
                style={{ left: 0 }}
                onMouseDown={(e) => onDragStart(segment.id, 'start', e)}
              />

              <div
                className={styles.segmentContent}
                onMouseDown={(e) => onDragStart(segment.id, 'move', e)}
              >
                {index + 1}
              </div>

              <div
                className={styles.segmentResizeHandle}
                style={{ right: 0 }}
                onMouseDown={(e) => onDragStart(segment.id, 'end', e)}
              />
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default Timeline;
