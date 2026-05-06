/**
 * 拖放上传组件
 * 支持文件拖放上传，带有视觉反馈
 */

import { Upload, ArrowUp } from 'lucide-react';
import React, { useCallback, useState, useRef } from 'react';

import toast from '@/shared/components/ui/Toast';
import { logger } from '@/core/utils/logger';

import styles from './FileUploader.module.less';

export interface UploadFile {
  uid: string;
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  response?: unknown;
  error?: Error;
}

export interface FileUploaderProps {
  /** 接受的文件类型 */
  accept?: string;
  /** 最大文件数量 */
  maxCount?: number;
  /** 最大文件大小 (MB) */
  maxSize?: number;
  /** 是否支持多文件 */
  multiple?: boolean;
  /** 上传 URL */
  action?: string;
  /** 自定义上传请求 */
  customRequest?: (options: { file: File; onSuccess: (response?: unknown) => void; onError: (error: Error) => void; onProgress: (percent: number) => void }) => void;
  /** 文件列表 */
  fileList?: UploadFile[];
  /** 文件变化回调 */
  onChange?: (info: { file: UploadFile; fileList: UploadFile[] }) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
  /** 自定义校验 */
  beforeUpload?: (file: File, fileList: File[]) => boolean | Promise<void>;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位文本 */
  placeholder?: string;
  /** 提示文本 */
  hint?: string;
  /** 自定义样式类 */
  className?: string;
  /** 是否显示文件列表 */
  showFileList?: boolean;
  /** 是否使用拖拽模式 */
  isDragger?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  accept,
  maxCount = 1,
  maxSize = 100,
  multiple = false,
  action,
  customRequest,
  fileList: externalFileList,
  onChange,
  onError,
  beforeUpload,
  disabled = false,
  placeholder = '点击或拖拽文件到此处上传',
  hint,
  className,
  showFileList = true,
  isDragger = true,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [internalFileList, setInternalFileList] = useState<UploadFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentFileList = externalFileList || internalFileList;

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleFileValidation = useCallback((file: File, files: File[]): boolean => {
    // 检查文件大小
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      toast.error(`文件 ${file.name} 超过最大限制 ${maxSize}MB`);
      return false;
    }

    // 检查文件数量
    if (maxCount && files.length > maxCount) {
      toast.error(`最多只能上传 ${maxCount} 个文件`);
      return false;
    }

    // 调用自定义校验 (async handled via side-effects, sync return for shadcn)
    if (beforeUpload) {
      const result = beforeUpload(file, files);
      if (result instanceof Promise) {
        result
          .then(() => {/* validation passed */})
          .catch((err) => {
            logger.warn('File validation warning:', err);
          });
        return false;
      }
      return result;
    }

    return true;
  }, [maxSize, maxCount, beforeUpload]);

  const processFile = useCallback((file: File) => {
    const uploadFile: UploadFile = {
      uid: generateId(),
      name: file.name,
      status: 'pending',
    };

    const newFileList = [...currentFileList, uploadFile];
    
    if (customRequest) {
      customRequest({
        file,
        onSuccess: (response) => {
          uploadFile.status = 'done';
          uploadFile.response = response;
          const updated = newFileList.map(f => f.uid === uploadFile.uid ? uploadFile : f);
          onChange?.({ file: uploadFile, fileList: updated });
        },
        onError: (error) => {
          uploadFile.status = 'error';
          uploadFile.error = error;
          onError?.(error);
          const updated = newFileList.map(f => f.uid === uploadFile.uid ? uploadFile : f);
          onChange?.({ file: uploadFile, fileList: updated });
        },
        onProgress: (_percent) => {
          uploadFile.status = 'uploading';
          const updated = newFileList.map(f => f.uid === uploadFile.uid ? uploadFile : f);
          onChange?.({ file: uploadFile, fileList: updated });
        },
      });
    } else if (action) {
      uploadFile.status = 'uploading';
      onChange?.({ file: uploadFile, fileList: newFileList });
    } else {
      uploadFile.status = 'done';
      uploadFile.url = URL.createObjectURL(file);
      onChange?.({ file: uploadFile, fileList: newFileList });
    }

    setInternalFileList(newFileList);
  }, [currentFileList, customRequest, action, onChange, onError]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const fileArray = multiple ? Array.from(files) : [files[0]];
    
    for (const file of fileArray) {
      if (handleFileValidation(file, fileArray)) {
        processFile(file);
      }
    }
  }, [multiple, handleFileValidation, processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [handleFiles]);

  const renderDragger = () => (
    <div
      className={`${styles.uploader} ${className || ''} ${disabled ? styles.disabled : ''} ${dragOver ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
      />
      <p className={styles.icon}>
        <Upload className={styles.uploadIcon} />
      </p>
      <p className={styles.text}>{placeholder}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );

  const renderNormal = () => (
    <div
      className={`${styles.uploader} ${className || ''} ${disabled ? styles.disabled : ''}`}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
      />
      <div className={styles.normalTrigger}>
        <ArrowUp />
        <span>{placeholder}</span>
      </div>
    </div>
  );

  return (
    <>
      {isDragger ? renderDragger() : renderNormal()}
      {showFileList && currentFileList.length > 0 && (
        <div className={styles.fileList}>
          {currentFileList.map((file) => (
            <div key={file.uid} className={styles.fileItem}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={`${styles.fileStatus} ${styles[file.status]}`}>
                {file.status === 'done' && '✓'}
                {file.status === 'uploading' && '...'}
                {file.status === 'error' && '✗'}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

/**
 * 图片上传组件
 */
export const ImageUploader: React.FC<Omit<FileUploaderProps, 'accept'>> = (props) => (
  <FileUploader
    accept="image/*"
    {...props}
  />
);

/**
 * 视频上传组件
 */
export const VideoUploader: React.FC<Omit<FileUploaderProps, 'accept'>> = (props) => (
  <FileUploader
    accept="video/*"
    maxSize={500}
    {...props}
  />
);

/**
 * 文档上传组件
 */
export const DocumentUploader: React.FC<Omit<FileUploaderProps, 'accept'>> = (props) => (
  <FileUploader
    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
    {...props}
  />
);

export default FileUploader;
