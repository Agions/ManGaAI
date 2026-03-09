import React, { useState } from 'react';
import { Button, message, Space, Card, Spin, Input, Alert } from 'antd';
import { UploadOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ScriptChapter, ScriptSource, ScriptValidationResult } from '@/core/types';
import { scriptImportService, tauriService } from '@/core/services';
import styles from './NovelImporter.module.less';

interface NovelImporterProps {
  initialContent?: string;
  onContentLoad: (content: string, metadata: NovelMetadata) => void;
  onRemove?: () => void;
  loading?: boolean;
}

export interface NovelMetadata {
  filename: string;
  fileFormat: ScriptSource['fileFormat'];
  sourceType: ScriptSource['sourceType'];
  fileSize: number;
  charCount: number;
  estimatedChapters: number;
  chapterCount: number;
  chapters: ScriptChapter[];
  validation: ScriptValidationResult;
}

const { TextArea } = Input;

/**
 * 小说/剧本导入组件
 * 支持导入 txt, md, docx 格式的小说或剧本文件
 */
const NovelImporter: React.FC<NovelImporterProps> = ({
  initialContent,
  onContentLoad,
  onRemove,
  loading = false
}) => {
  const [content, setContent] = useState<string | null>(initialContent || null);
  const [metadata, setMetadata] = useState<NovelMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const buildMetadata = (
    nextContent: string,
    params: { filename: string; sourceType: ScriptSource['sourceType']; filePath?: string }
  ): NovelMetadata => {
    const result = scriptImportService.analyzeImport({
      content: nextContent,
      filename: params.filename,
      sourceType: params.sourceType,
      filePath: params.filePath,
    });

    return {
      filename: result.source.filename,
      fileFormat: result.source.fileFormat,
      sourceType: result.source.sourceType,
      fileSize: result.source.fileSize,
      charCount: result.source.charCount,
      estimatedChapters: result.estimatedChapters,
      chapterCount: result.chapters.length,
      chapters: result.chapters,
      validation: result.validation,
    };
  };

  /**
   * 选择小说文件
   */
  const handleSelectFile = async () => {
    try {
      // 打开文件选择对话框
      const selected = await tauriService.openFile({
        multiple: false,
        filters: [{
          name: '小说/剧本文件',
          extensions: ['txt', 'md', 'docx']
        }]
      });

      // 如果用户取消选择，selected将是null
      if (!selected || Array.isArray(selected)) {
        return;
      }

      const filePath = selected as string;
      setIsLoading(true);

      try {
        // 优先使用 Tauri FS 读文本，统一跨平台行为
        const fileContent = await tauriService.readText(filePath);

        // 获取文件名
        const filename = filePath.split(/[\\/]/).pop() || '未知文件';

        // 计算元数据和章节切分
        const novelMetadata = buildMetadata(fileContent, {
          filename,
          sourceType: 'file',
          filePath,
        });

        const warnings = novelMetadata.validation.issues.filter(issue => issue.level === 'warning');
        const errors = novelMetadata.validation.issues.filter(issue => issue.level === 'error');

        if (errors.length > 0) {
          message.error(errors[0].message);
          return;
        }

        setContent(fileContent);
        setMetadata(novelMetadata);
        onContentLoad(fileContent, novelMetadata);

        if (warnings.length > 0) {
          message.warning(warnings[0].message);
        }
        message.success('小说文件导入成功');
      } catch (error) {
        console.error('读取文件失败:', error);
        message.error('读取文件失败，请重试（建议使用 TXT/MD 编码格式）');
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('选择文件失败:', error);
      message.error('选择文件失败，请重试');
    }
  };

  /**
   * 手动输入内容
   */
  const handleManualInput = () => {
    if (!manualInput.trim()) {
      message.warning('请输入内容');
      return;
    }

    const novelMetadata = buildMetadata(manualInput, {
      filename: '手动输入',
      sourceType: 'manual',
    });

    const errors = novelMetadata.validation.issues.filter(issue => issue.level === 'error');
    if (errors.length > 0) {
      message.error(errors[0].message);
      return;
    }

    setContent(manualInput);
    setMetadata(novelMetadata);
    onContentLoad(manualInput, novelMetadata);
    message.success('内容导入成功');
  };

  /**
   * 移除内容
   */
  const handleRemove = () => {
    setContent(null);
    setMetadata(null);
    setManualInput('');
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={styles.novelImporter}>
      <Spin spinning={loading || isLoading} tip={isLoading ? "导入中..." : "加载中..."}>
        {!content ? (
          <div className={styles.uploadArea}>
            <Card>
              <div className={styles.uploadOptions}>
                <div className={styles.uploadOption}>
                  <h4>方式一：选择文件</h4>
                  <p>支持 TXT、MD、DOCX 格式的小说或剧本文件</p>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={handleSelectFile}
                    loading={isLoading}
                  >
                    选择文件
                  </Button>
                </div>

                <div className={styles.divider}>
                  <span>或</span>
                </div>

                <div className={styles.uploadOption}>
                  <h4>方式二：直接输入</h4>
                  <p>直接在下方输入框中粘贴或输入小说/剧本内容</p>
                  <TextArea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="请输入小说或剧本内容..."
                    rows={6}
                  />
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={handleManualInput}
                    disabled={!manualInput.trim()}
                    style={{ marginTop: 8 }}
                  >
                    导入内容
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className={styles.contentPreview}>
            <Card
              title={
                <Space>
                  <FileTextOutlined />
                  <span>{metadata?.filename}</span>
                </Space>
              }
              extra={
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemove}
                >
                  移除
                </Button>
              }
            >
              {metadata && (
                <Alert
                  message="文件信息"
                  description={
                    <Space direction="vertical">
                      <span>文件名: {metadata.filename}</span>
                      <span>字符数: {metadata.charCount.toLocaleString()}</span>
                      <span>识别格式: {metadata.fileFormat.toUpperCase()}</span>
                      <span>章节数: {metadata.chapterCount}</span>
                      <span>预估章节数: {metadata.estimatedChapters}</span>
                    </Space>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <div className={styles.contentPreviewBox}>
                <TextArea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (metadata) {
                      const newMetadata = buildMetadata(e.target.value, {
                        filename: metadata.filename,
                        sourceType: metadata.sourceType,
                      });
                      setMetadata(newMetadata);
                      onContentLoad(e.target.value, newMetadata);
                    }
                  }}
                  rows={10}
                  placeholder="内容预览和编辑..."
                />
              </div>
            </Card>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default NovelImporter;
