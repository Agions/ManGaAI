import React, { useState, useCallback } from 'react';
import {
  Card,
  Select,
  Radio,
  Button,
  Input,
  Space,
  Progress,
  Divider,
  message,
  Tooltip,
  Alert,
  Typography,
} from 'antd';
import {
  ExportOutlined,
  VideoCameraOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FileOutlined,
} from '@ant-design/icons';
import type { ExportSettings } from '@/core/types';
import styles from './VideoExporter.module.less';

const { Text, Title } = Typography;

// 导出格式选项
export const EXPORT_FORMATS = ['MP4', 'MOV', 'WebM'] as const;
export type ExportFormat = typeof EXPORT_FORMATS[number];

// 分辨率选项
export const RESOLUTIONS = ['480p', '720p', '1080p', '4K'] as const;
export type Resolution = typeof RESOLUTIONS[number];

// 帧率选项
export const FRAME_RATES = [24, 30, 60] as const;
export type FrameRate = typeof FRAME_RATES[number];

// 分辨率对应的像素值
const RESOLUTION_VALUES: Record<Resolution, { width: number; height: number }> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 },
};

// 质量预设
const QUALITY_PRESETS = {
  low: { label: '低', description: '文件小，适合快速预览', bitrate: '2Mbps' },
  medium: { label: '中', description: '平衡质量与文件大小', bitrate: '5Mbps' },
  high: { label: '高', description: '高质量，适合分享', bitrate: '10Mbps' },
  ultra: { label: '超清', description: '最高质量，适合专业用途', bitrate: '20Mbps' },
} as const;

export type QualityPreset = keyof typeof QUALITY_PRESETS;

interface VideoExporterProps {
  projectId?: string;
  projectName?: string;
  estimatedDuration?: number; // 预计时长（秒）
  onExport?: (settings: ExportSettings) => Promise<void>;
  onCancel?: () => void;
  initialSettings?: Partial<ExportSettings>;
}

const VideoExporter: React.FC<VideoExporterProps> = ({
  projectId,
  projectName = '未命名项目',
  estimatedDuration = 0,
  onExport,
  onCancel,
  initialSettings,
}) => {
  // 导出格式
  const [format, setFormat] = useState<ExportFormat>(initialSettings?.format as ExportFormat || 'MP4');

  // 分辨率
  const [resolution, setResolution] = useState<Resolution>(initialSettings?.resolution as Resolution || '1080p');

  // 帧率
  const [frameRate, setFrameRate] = useState<FrameRate>(initialSettings?.frameRate as FrameRate || 30);

  // 质量
  const [quality, setQuality] = useState<QualityPreset>('high');

  // 文件名
  const [filename, setFilename] = useState<string>(
    `${projectName}_${new Date().toISOString().slice(0, 10)}`
  );

  // 导出状态
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedFilePath, setExportedFilePath] = useState<string>('');

  // 计算预计文件大小
  const estimatedFileSize = useCallback(() => {
    const { width, height } = RESOLUTION_VALUES[resolution];
    const pixels = width * height;
    const frameRateValue = frameRate;
    const bitrate = QUALITY_PRESETS[quality].bitrate;
    const bitrateMbps = parseFloat(bitrate);

    // 粗略估算：比特率 * 时长
    const sizeInMegabits = bitrateMbps * estimatedDuration;
    const sizeInMegabytes = sizeInMegabits / 8;

    if (sizeInMegabytes > 1024) {
      return `${(sizeInMegabytes / 1024).toFixed(1)} GB`;
    }
    return `${sizeInMegabytes.toFixed(1)} MB`;
  }, [resolution, frameRate, quality, estimatedDuration]);

  // 处理导出
  const handleExport = async () => {
    if (!filename.trim()) {
      message.error('请输入有效的文件名');
      return;
    }

    if (estimatedDuration === 0) {
      message.error('没有可导出的内容');
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportStatus('正在准备导出...');
    setExportComplete(false);

    const exportSettings: ExportSettings = {
      format: format.toLowerCase() as ExportSettings['format'],
      quality,
      resolution: resolution as ExportSettings['resolution'],
      frameRate: frameRate as ExportSettings['frameRate'],
      includeSubtitles: true,
      burnSubtitles: true,
    };

    try {
      // 模拟导出进度（实际项目中应调用后端API）
      if (onExport) {
        await onExport(exportSettings);
      } else {
        // 模拟导出过程
        await simulateExport();
      }

      setExportProgress(100);
      setExportStatus('导出完成！');
      setExportComplete(true);
      setExportedFilePath(`/exports/${filename}.${format.toLowerCase()}`);
      message.success('视频导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      setExportStatus('导出失败，请重试');
      message.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  // 模拟导出进度
  const simulateExport = async () => {
    const steps = [
      { progress: 10, status: '正在编码视频...' },
      { progress: 30, status: '正在处理音频...' },
      { progress: 50, status: '正在合成字幕...' },
      { progress: 70, status: '正在添加转场效果...' },
      { progress: 90, status: '正在生成最终文件...' },
      { progress: 100, status: '导出完成！' },
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setExportProgress(step.progress);
      setExportStatus(step.status);
    }
  };

  // 取消导出
  const handleCancel = () => {
    if (exporting) {
      message.warning('导出已取消');
    }
    setExporting(false);
    setExportProgress(0);
    setExportStatus('');
    onCancel?.();
  };

  // 重置导出
  const handleReset = () => {
    setExporting(false);
    setExportProgress(0);
    setExportStatus('');
    setExportComplete(false);
    setExportedFilePath('');
  };

  return (
    <Card className={styles.exportPanel}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <VideoCameraOutlined className={styles.titleIcon} />
          <Title level={4} className={styles.title}>漫剧视频导出</Title>
        </div>
        {projectName && (
          <Text type="secondary" className={styles.projectName}>
            项目：{projectName}
          </Text>
        )}
      </div>

      <Divider className={styles.divider} />

      {!exportComplete ? (
        <div className={styles.content}>
          {/* 文件名设置 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <SettingOutlined />
              <Text strong>文件名</Text>
            </div>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="输入文件名"
              disabled={exporting}
              className={styles.filenameInput}
              addonAfter={`.${format.toLowerCase()}`}
            />
          </div>

          {/* 导出格式 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <FileOutlined />
              <Text strong>导出格式</Text>
            </div>
            <Radio.Group
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              disabled={exporting}
              className={styles.formatGroup}
            >
              <Space direction="vertical">
                {EXPORT_FORMATS.map((fmt) => (
                  <Radio key={fmt} value={fmt} className={styles.formatRadio}>
                    <Space>
                      <span className={styles.formatLabel}>{fmt}</span>
                      <span className={styles.formatDesc}>
                        {fmt === 'MP4' && '通用格式，兼容性最好'}
                        {fmt === 'MOV' && 'Apple QuickTime 格式'}
                        {fmt === 'WebM' && 'Web 在线播放格式'}
                      </span>
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          {/* 分辨率选择 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <SettingOutlined />
              <Text strong>分辨率</Text>
            </div>
            <Select
              value={resolution}
              onChange={setResolution}
              disabled={exporting}
              className={styles.select}
              options={RESOLUTIONS.map((res) => ({
                value: res,
                label: (
                  <Space>
                    <span>{res}</span>
                    <Text type="secondary" className={styles.optionDesc}>
                      {RESOLUTION_VALUES[res].width}x{RESOLUTION_VALUES[res].height}
                    </Text>
                  </Space>
                ),
              }))}
            />
          </div>

          {/* 帧率选择 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <PlayCircleOutlined />
              <Text strong>帧率</Text>
            </div>
            <Radio.Group
              value={frameRate}
              onChange={(e) => setFrameRate(e.target.value)}
              disabled={exporting}
              className={styles.frameRateGroup}
            >
              <Space>
                {FRAME_RATES.map((fps) => (
                  <Radio key={fps} value={fps} className={styles.frameRateRadio}>
                    <Space>
                      <span className={styles.frameRateLabel}>{fps} FPS</span>
                      <Text type="secondary" className={styles.frameRateDesc}>
                        {fps === 24 && '电影标准'}
                        {fps === 30 && '常用帧率'}
                        {fps === 60 && '流畅丝滑'}
                      </Text>
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          {/* 质量选择 */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <SettingOutlined />
              <Text strong>质量预设</Text>
            </div>
            <Radio.Group
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={exporting}
              className={styles.qualityGroup}
            >
              <Space direction="vertical">
                {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
                  <Radio key={key} value={key} className={styles.qualityRadio}>
                    <Space>
                      <span className={styles.qualityLabel}>{preset.label}</span>
                      <span className={styles.qualityDesc}>{preset.description}</span>
                      <Text type="secondary" className={styles.bitrate}>
                        {preset.bitrate}
                      </Text>
                    </Space>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>

          {/* 预计文件大小 */}
          {estimatedDuration > 0 && (
            <Alert
              message={
                <Space>
                  <span>预计导出时长：</span>
                  <Text strong>{Math.floor(estimatedDuration / 60)}分{estimatedDuration % 60}秒</Text>
                  <Text type="secondary">|</Text>
                  <span>预计文件大小：</span>
                  <Text strong>{estimatedFileSize()}</Text>
                </Space>
              }
              type="info"
              showIcon
              className={styles.infoAlert}
            />
          )}

          {/* 导出进度 */}
          {exporting && (
            <div className={styles.progressSection}>
              <Text strong>导出进度：{exportStatus}</Text>
              <Progress
                percent={exportProgress}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                className={styles.progress}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className={styles.actions}>
            <Space>
              {exporting ? (
                <Button onClick={handleCancel} danger>
                  取消导出
                </Button>
              ) : (
                <>
                  {onCancel && (
                    <Button onClick={onCancel}>
                      取消
                    </Button>
                  )}
                  <Tooltip title={!filename.trim() ? '请输入文件名' : undefined}>
                    <Button
                      type="primary"
                      icon={<ExportOutlined />}
                      onClick={handleExport}
                      disabled={!filename.trim() || estimatedDuration === 0}
                    >
                      开始导出
                    </Button>
                  </Tooltip>
                </>
              )}
            </Space>
          </div>
        </div>
      ) : (
        /* 导出完成 */
        <div className={styles.completeSection}>
          <div className={styles.successIcon}>
            <CheckCircleOutlined />
          </div>
          <Title level={4} className={styles.successTitle}>导出成功！</Title>
          <Text type="secondary" className={styles.filePath}>
            文件已保存至：{exportedFilePath}
          </Text>

          <div className={styles.exportSummary}>
            <Space direction="vertical" size="small">
              <Text>
                <Text strong>格式：</Text>
                {format}
              </Text>
              <Text>
                <Text strong>分辨率：</Text>
                {resolution} ({RESOLUTION_VALUES[resolution].width}x{RESOLUTION_VALUES[resolution].height})
              </Text>
              <Text>
                <Text strong>帧率：</Text>
                {frameRate} FPS
              </Text>
              <Text>
                <Text strong>质量：</Text>
                {QUALITY_PRESETS[quality].label}
              </Text>
              <Text>
                <Text strong>预计大小：</Text>
                {estimatedFileSize()}
              </Text>
            </Space>
          </div>

          <div className={styles.completeActions}>
            <Space>
              <Button onClick={handleReset}>
                再次导出
              </Button>
              <Button type="primary" icon={<ExportOutlined />} onClick={() => message.success('文件已打开')}>
                打开文件
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Card>
  );
};

export default VideoExporter;
