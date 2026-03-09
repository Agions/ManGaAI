/**
 * 视频混剪编辑器
 * 主组件 - 整合所有子组件
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button, Progress, Card, Space, message, Row, Col, Typography } from 'antd';
import {
  ScissorOutlined,
  SaveOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { convertFileSrc } from '@tauri-apps/api/tauri';

import { VideoPlayer, Timeline, ExportSettingsModal, PreviewModal } from './components';
import { useVideoPlayer, useTimeline } from './hooks';
import type { VideoEditorProps, ExportSettings } from './types';
import { defaultExportSettings } from './types';
import styles from './VideoEditor.module.less';

const VideoEditor: React.FC<VideoEditorProps> = ({ videoPath, segments, onEditComplete }) => {
  // 视频播放器状态
  const {
    videoRef,
    currentTime,
    duration,
    isPlaying,
    togglePlay,
    seekTo,
    formatTime
  } = useVideoPlayer({ videoPath });

  // 时间轴状态
  const {
    editedSegments,
    selectedSegment,
    dragState,
    timelineRef,
    getSegmentStyle,
    setSelectedSegment,
    handleDragStart,
    handleSegmentClick,
    getTimeFromPosition
  } = useTimeline({ duration, segments });

  // 导出设置状态
  const [exportSettings, setExportSettings] = useState<ExportSettings>(defaultExportSettings);
  const [showExportModal, setShowExportModal] = useState(false);

  // 预览状态
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewSegment, setPreviewSegment] = useState<typeof segments[0] | null>(null);

  // 处理状态
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);

  // 清理预览文件
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.includes('temp')) {
        invoke('clean_temp_file', { path: previewUrl }).catch(console.error);
      }
    };
  }, []);

  // 点击片段时跳转到对应时间点
  const onSegmentClick = useCallback((segment: typeof segments[0]) => {
    seekTo(segment.startTime);
    setSelectedSegment(segment);
  }, [seekTo, setSelectedSegment]);

  // 预览片段
  const handlePreviewSegment = async (segment: typeof segments[0]) => {
    setPreviewLoading(true);
    setPreviewSegment(segment);
    setShowPreviewModal(true);

    try {
      const tempPath = await invoke<string>('generate_preview', {
        inputPath: videoPath,
        segment: {
          start: segment.startTime,
          end: segment.endTime,
          type: segment.type
        },
        transition: exportSettings.transitionType,
        transitionDuration: exportSettings.transitionDuration,
        volume: exportSettings.audioVolume / 100,
        addSubtitles: exportSettings.useSubtitles
      });

      const fileUrl = convertFileSrc(tempPath);
      setPreviewUrl(fileUrl);
    } catch (error) {
      console.error('生成预览失败:', error);
      message.error('生成预览失败: ' + error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 关闭预览
  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewUrl('');
    setPreviewSegment(null);
  };

  // 处理视频导出
  const handleExportVideo = async () => {
    setShowExportModal(false);

    if (!editedSegments || editedSegments.length === 0) {
      message.warning('没有可用的脚本片段来剪辑视频');
      return;
    }

    try {
      const savePath = await save({
        defaultPath: `剪辑_${new Date().toISOString().split('T')[0]}.${exportSettings.format}`,
        filters: [
          { name: '视频文件', extensions: [exportSettings.format] }
        ]
      });

      if (!savePath) return;

      setProcessing(true);
      setProcessProgress(0);

      // 监听进度事件
      const unlistenHandler = await (window as any).__TAURI__.event.listen('cut_progress', (event: { payload: number }) => {
        setProcessProgress(Math.round(event.payload * 100));
      });

      await invoke('cut_video', {
        inputPath: videoPath,
        outputPath: savePath,
        segments: editedSegments.map(s => ({
          start: s.startTime,
          end: s.endTime,
          type: s.type,
          content: s.content,
        })),
        quality: exportSettings.quality,
        format: exportSettings.format,
        transition: exportSettings.transitionType,
        transitionDuration: exportSettings.transitionDuration,
        volume: exportSettings.audioVolume / 100,
        addSubtitles: exportSettings.useSubtitles
      }).catch(error => {
        console.error('视频剪辑失败:', error);
        message.error('视频剪辑失败: ' + error);
        setProcessing(false);
        return null;
      });

      unlistenHandler();

      if (onEditComplete) {
        onEditComplete(savePath);
      }

      message.success('视频剪辑完成');
    } catch (error) {
      console.error('导出视频失败:', error);
      message.error('导出视频失败');
    } finally {
      setProcessing(false);
    }
  };

  // 保存片段时间
  const handleSaveSegments = () => {
    if (onEditComplete) {
      onEditComplete(editedSegments);
    }
    message.success('片段时间已更新');
  };

  return (
    <div className={styles.editorContainer}>
      <Typography.Title level={4}>视频混剪编辑器</Typography.Title>

      <Card>
        {/* 视频播放器 */}
        <VideoPlayer
          videoRef={videoRef}
          videoPath={videoPath}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onSeek={seekTo}
          formatTime={formatTime}
        />

        {/* 时间轴 */}
        <Timeline
          timelineRef={timelineRef}
          segments={editedSegments}
          selectedSegment={selectedSegment}
          getSegmentStyle={getSegmentStyle}
          onSegmentClick={onSegmentClick}
          onDragStart={handleDragStart}
          formatTime={formatTime}
        />

        {/* 片段详情 */}
        {selectedSegment && (
          <Card size="small" style={{ marginTop: 10 }}>
            <div className={styles.segmentDetails}>
              <Row gutter={16}>
                <Col span={6}>
                  <Typography.Text strong>时间: </Typography.Text>
                  <Typography.Text>{formatTime(selectedSegment.startTime)} - {formatTime(selectedSegment.endTime)}</Typography.Text>
                </Col>
                <Col span={4}>
                  <Typography.Text strong>类型: </Typography.Text>
                  <Typography.Text>{selectedSegment.type === 'narration' ? '旁白' :
                        selectedSegment.type === 'dialogue' ? '对话' : '描述'}</Typography.Text>
                </Col>
                <Col span={12}>
                  <Typography.Text strong>内容: </Typography.Text>
                  <Typography.Text>{selectedSegment.content}</Typography.Text>
                </Col>
                <Col span={2}>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    size="small"
                    onClick={() => handlePreviewSegment(selectedSegment)}
                  >
                    预览
                  </Button>
                </Col>
              </Row>
            </div>
          </Card>
        )}

        {/* 控制按钮 */}
        <div className={styles.editorControls}>
          <Space>
            <Button
              type="primary"
              icon={<ScissorOutlined />}
              onClick={() => setShowExportModal(true)}
              disabled={processing || editedSegments.length === 0}
            >
              生成混剪视频
            </Button>

            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowExportModal(true)}
              disabled={processing}
            >
              导出设置
            </Button>

            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveSegments}
              disabled={processing}
            >
              保存片段时间
            </Button>
          </Space>

          {processing && (
            <div className={styles.progressContainer}>
              <Progress percent={processProgress} status="active" style={{ width: 200 }} />
              <Typography.Text className={styles.progressText}>
                {processProgress < 30 ? '准备片段...' :
                 processProgress < 70 ? '处理视频中...' :
                 processProgress < 90 ? '合成最终视频...' : '完成中...'}
              </Typography.Text>
            </div>
          )}
        </div>
      </Card>

      {/* 导出设置弹窗 */}
      <ExportSettingsModal
        visible={showExportModal}
        settings={exportSettings}
        onSettingsChange={setExportSettings}
        onOk={handleExportVideo}
        onCancel={() => setShowExportModal(false)}
      />

      {/* 预览弹窗 */}
      <PreviewModal
        visible={showPreviewModal}
        loading={previewLoading}
        previewUrl={previewUrl}
        segment={previewSegment}
        formatTime={formatTime}
        onClose={handleClosePreview}
      />
    </div>
  );
};

export default VideoEditor;
