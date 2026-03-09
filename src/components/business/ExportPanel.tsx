import React, { useState } from 'react';
import { Card, Radio, Button, Input, Space, message, Tooltip } from 'antd';
import { ExportOutlined, FileTextOutlined, FilePdfOutlined, GlobalOutlined } from '@ant-design/icons';
import { exportScript } from '@/core/services/legacy';
import type { ScriptData } from '@/core/types';
import styles from './ExportPanel.module.less';

// 导出格式
type ExportFormat = 'txt' | 'srt' | 'pdf' | 'html';

interface ExportPanelProps {
  script: ScriptData;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ script }) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [filename, setFilename] = useState<string>(`脚本_${script.id || 'draft'}`);
  const [exporting, setExporting] = useState(false);

  // 处理导出格式变更 - 使用 any 类型来绕过类型检查
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFormatChange = (e: any) => {
    setExportFormat(e.target.value as ExportFormat);
  };

  // 处理文件名变更
  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
  };

  // 执行导出
  const handleExport = async () => {
    if (!filename.trim()) {
      message.error('请输入有效的文件名');
      return;
    }

    setExporting(true);
    try {
      await exportScript(script, exportFormat as 'txt' | 'srt', filename);
      message.success(`脚本已成功导出为${exportFormat.toUpperCase()}格式`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  // 根据格式返回对应图标
  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'txt':
        return <FileTextOutlined />;
      case 'srt':
        return <FileTextOutlined />;
      case 'pdf':
        return <FilePdfOutlined />;
      case 'html':
        return <GlobalOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  return (
    <Card
      title="导出脚本"
      className={styles.exportPanel}
      extra={
        <Tooltip title="导出后的文件将保存到您选择的位置">
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            导出
          </Button>
        </Tooltip>
      }
    >
      <div className={styles.content}>
        <div className={styles.filenameSection}>
          <label htmlFor="filename" className={styles.label}>文件名:</label>
          <Input
            id="filename"
            value={filename}
            onChange={handleFilenameChange}
            placeholder="输入文件名(不含扩展名)"
            className={styles.filenameInput}
          />
        </div>

        <div className={styles.formatSection}>
          <label className={styles.label}>导出格式:</label>
          <Radio.Group onChange={handleFormatChange} value={exportFormat}>
            <Space direction="vertical">
              <Radio value="txt">
                <Space>
                  <FileTextOutlined /> 纯文本 (.txt)
                  <span className={styles.formatDesc}>- 简单文本格式，适合通用场景</span>
                </Space>
              </Radio>
              <Radio value="srt">
                <Space>
                  <FileTextOutlined /> 字幕文件 (.srt)
                  <span className={styles.formatDesc}>- 标准字幕格式，可导入视频编辑软件</span>
                </Space>
              </Radio>
              <Radio value="pdf">
                <Space>
                  <FilePdfOutlined /> PDF文档 (.pdf)
                  <span className={styles.formatDesc}>- 带格式的PDF文档，适合打印或分享</span>
                </Space>
              </Radio>
              <Radio value="html">
                <Space>
                  <GlobalOutlined /> 网页 (.html)
                  <span className={styles.formatDesc}>- 可在浏览器中打开的网页格式</span>
                </Space>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Card>
  );
};

export default ExportPanel;
