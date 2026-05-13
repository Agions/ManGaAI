/**
 * 统一工具导出
 */

export * from './logger';
export * from './hooks';
export * from './requestCache';
export * from './retryRequest';
export * from './idle';
export * from './motion';
export * from './platform';
export * from './tauri';

// Re-export from shared/utils for backwards compatibility
export {
  formatDuration,
  formatFileSize,
  formatDate,
  formatDateTime,
  formatTime,
  formatTimeHMS,
  formatTimeWithMs,
  formatTimeWithCentiseconds,
  formatFriendlyDuration,
  formatNumber,
  formatPercent,
  debounce,
  throttle,
  deepClone,
  generateId,
  truncateText,
  capitalize,
  uniqueArray,
  chunkArray,
  delay,
  retry,
  downloadFile,
  readFileAsDataURL,
  readFileAsText,
  copyToClipboard,
  readFromClipboard,
  randomColor,
  getContrastColor,
  camelToKebab,
  kebabToCamel,
  sortBy,
  filterObject,
  mapObject,
  detectFileType,
  isValidEmail,
  isValidURL,
  safeJSONParse,
  computeHash,
} from '@/shared/utils';
