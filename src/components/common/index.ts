/**
 * 通用组件导出
 */

// 布局组件
export {
  default as PageContainer,
  PageSection,
  StatisticCard,
  ActionCard,
  GridStatistic,
} from './PageContainer';

// 基础组件
export { default as Loading } from './Loading';
export { default as EmptyState } from './Empty';
export { default as PageHeader } from './PageHeader';
export { default as Skeleton, BasicSkeleton, CardSkeleton, ListSkeleton, FormSkeleton, StatisticSkeleton } from './Skeleton';

// 动效组件
export { default as PageTransition, TransitionRouter, AnimateIn } from './PageTransition';

// 提示组件
export { default as toast, notify, closeAll } from './Toast';

// 确认对话框
export {
  ConfirmDialog,
  AsyncConfirmDialog,
  useConfirm,
} from './ConfirmDialog';

// 文件上传
export {
  FileUploader,
  ImageUploader,
  VideoUploader,
  DocumentUploader,
} from './FileUploader';

// 动效工具
export * from '@/styles/motion';
