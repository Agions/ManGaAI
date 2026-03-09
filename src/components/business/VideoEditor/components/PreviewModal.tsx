/**
 * 预览弹窗组件
 */

import React from 'react';
import { Modal, Spin, Typography } from 'antd';
import type { ScriptSegment } from '@/core/types';
import styles from './PreviewModal.module.less';

interface PreviewModalProps {
  visible: boolean;
  loading: boolean;
  previewUrl: string;
  segment: ScriptSegment | null;
  formatTime: (time: number) => string;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  loading,
  previewUrl,
  segment,
  formatTime,
  onClose
}) => {
  return (
    <Modal
      title="片段预览"
      open={visible}
      onCancel={onClose}
      footer={[
        <React.Fragment key="footer">
          <button key="close" onClick={onClose} className={styles.closeButton}>
            关闭
          </button>
        </React.Fragment>
      ]}
      width={800}
    >
      {loading ? (
        <div className={styles.previewLoading}>
          <Spin tip="生成预览中..." />
        </div>
      ) : previewUrl ? (
        <div className={styles.previewContainer}>
          <video
            controls
            autoPlay
            src={previewUrl}
            className={styles.previewVideo}
          />
          {segment && (
            <div className={styles.previewInfo}>
              <Typography.Paragraph>
                <Typography.Text strong>时间段: </Typography.Text>
                <Typography.Text>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</Typography.Text>
              </Typography.Paragraph>
              <Typography.Paragraph>
                <Typography.Text strong>内容: </Typography.Text>
                <Typography.Text>{segment.content}</Typography.Text>
              </Typography.Paragraph>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.previewError}>
          <Typography.Text type="danger">无法生成预览，请重试</Typography.Text>
        </div>
      )}
    </Modal>
  );
};

export default PreviewModal;
