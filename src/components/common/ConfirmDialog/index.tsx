/**
 * 确认对话框组件
 * 提供确认、取消操作的模态对话框
 */

import React, { useState, useCallback } from 'react';
import { Modal, Button, Progress } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ConfirmDialog.module.less';

export type ConfirmType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface ConfirmDialogProps {
  open?: boolean;
  type?: ConfirmType;
  title?: string;
  content?: string;
  icon?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  okButtonProps?: Record<string, unknown>;
  cancelButtonProps?: Record<string, unknown>;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  maskClosable?: boolean;
  closable?: boolean;
  width?: number | string;
  centered?: boolean;
  destroyOnClose?: boolean;
  className?: string;
}

const iconMap = {
  info: <InfoCircleOutlined className={styles.iconInfo} />,
  success: <CheckCircleOutlined className={styles.iconSuccess} />,
  warning: <WarningOutlined className={styles.iconWarning} />,
  error: <ExclamationCircleOutlined className={styles.iconError} />,
  confirm: <ExclamationCircleOutlined className={styles.iconConfirm} />,
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open = false,
  type = 'confirm',
  title = '确认操作',
  content,
  icon,
  okText = '确定',
  cancelText = '取消',
  okButtonProps,
  cancelButtonProps,
  onOk,
  onCancel,
  loading = false,
  maskClosable = false,
  closable = false,
  width = 416,
  centered = true,
  destroyOnClose = true,
  className,
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const handleOk = useCallback(async () => {
    if (!onOk) return;

    setLocalLoading(true);
    try {
      const result = onOk();
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setLocalLoading(false);
    }
  }, [onOk]);

  return (
    <Modal
      open={open}
      title={null}
      footer={null}
      onCancel={onCancel}
      width={width}
      centered={centered}
      closable={closable}
      maskClosable={maskClosable}
      destroyOnClose={destroyOnClose}
      className={`${styles.confirmDialog} ${className || ''}`}
      wrapClassName={styles.wrap}
    >
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={styles.content}
          >
            <div className={styles.iconWrapper}>
              {icon || iconMap[type]}
            </div>
            <div className={styles.message}>
              <div className={styles.title}>{title}</div>
              {content && <div className={styles.description}>{content}</div>}
            </div>
            <div className={styles.footer}>
              <Button
                {...cancelButtonProps}
                onClick={onCancel}
                disabled={loading || localLoading}
              >
                {cancelText}
              </Button>
              <Button
                type={type === 'error' ? 'primary' : 'primary'}
                danger={type === 'error'}
                loading={loading || localLoading}
                onClick={handleOk}
                {...okButtonProps}
              >
                {okText}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

/**
 * 异步操作确认对话框
 * 支持进度显示的确认对话框
 */
export interface AsyncConfirmDialogProps extends ConfirmDialogProps {
  progress?: number;
  status?: 'normal' | 'exception' | 'success' | 'active';
}

export const AsyncConfirmDialog: React.FC<AsyncConfirmDialogProps> = ({
  progress,
  status = 'active',
  ...props
}) => {
  return (
    <ConfirmDialog {...props}>
      {progress !== undefined && (
        <div className={styles.progress}>
          <Progress
            percent={Math.round(progress)}
            status={status}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
        </div>
      )}
    </ConfirmDialog>
  );
};

/**
 * 确认对话框 Hook
 */
export interface UseConfirmOptions {
  title?: string;
  content?: string;
  type?: ConfirmType;
  okText?: string;
  cancelText?: string;
}

export interface UseConfirmReturn {
  confirm: (options?: UseConfirmOptions) => Promise<boolean>;
  ConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'open' | 'onOk' | 'onCancel'>>;
}

export const useConfirm = (defaultOptions?: UseConfirmOptions): UseConfirmReturn => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmOptions>(defaultOptions || {});
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: UseConfirmOptions = {}) => {
    setOptions({ ...defaultOptions, ...opts });
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, [defaultOptions]);

  const handleOk = useCallback(() => {
    resolveRef?.(true);
    setOpen(false);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    resolveRef?.(false);
    setOpen(false);
  }, [resolveRef]);

  const ConfirmDialogComponent: React.FC<Omit<ConfirmDialogProps, 'open' | 'onOk' | 'onCancel'>> = (dialogProps) => (
    <ConfirmDialog
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      {...defaultOptions}
      {...options}
      {...dialogProps}
    />
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
};

export default ConfirmDialog;
